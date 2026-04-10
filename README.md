# backend-auth-template

A production-ready **Node.js + Express** REST API template that provides a complete authentication system using **JSON Web Tokens (JWT)** and **PostgreSQL**. Clone it, set your environment variables, run the migration, and you have a secure auth back-end ready to build on.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Migration](#database-migration)
  - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Sign Up](#sign-up)
  - [Sign In](#sign-in)
  - [Refresh Token](#refresh-token)
  - [Logout](#logout)
  - [Get Profile](#get-profile)
- [Database Schema](#database-schema)
- [Security](#security)
- [Error Handling](#error-handling)
- [Project Architecture](#project-architecture)

---

## Features

- **JWT authentication** — short-lived access tokens and long-lived refresh tokens
- **Refresh token rotation** — old refresh token is invalidated on every use; a fresh one is issued
- **Password hashing** with bcrypt (12 salt rounds)
- **Input validation** via `express-validator` (email format, password strength, field lengths)
- **Security headers** via Helmet
- **CORS** support with configurable origin
- **Rate limiting** — 100 requests / 15 min globally; 20 requests / 15 min on auth routes
- **Request body size limit** of 10 kb to prevent payload attacks
- **Graceful shutdown** — flushes the PostgreSQL connection pool on SIGTERM / SIGINT
- **Structured error responses** with operational vs. unexpected error distinction
- **Database migration script** — creates all tables and indexes in a single transaction

---

## Tech Stack

| Layer | Package |
|-------|---------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (via `pg`) |
| Auth | `jsonwebtoken`, `bcrypt` |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Config | `dotenv` |
| Dev server | `nodemon` |

---

## Project Structure

```
backend-auth-template/
├── server.js               # Entry point — connects to DB, starts Express, handles shutdown
├── package.json
└── src/
    ├── app.js              # Express app setup (middleware, routes, error handler)
    ├── config/
    │   ├── index.js        # Loads & validates environment variables
    │   └── db.js           # PostgreSQL connection pool
    ├── routes/
    │   ├── index.js        # Mounts /auth routes and /health endpoint
    │   └── authRoutes.js   # Route definitions for all auth endpoints
    ├── controllers/
    │   └── authController.js  # Business logic for signup, signin, refresh, logout, profile
    ├── models/
    │   ├── User.js         # SQL queries for the users table
    │   └── RefreshToken.js # SQL queries for the refresh_tokens table
    ├── middleware/
    │   ├── authenticate.js # JWT Bearer token verification middleware
    │   ├── validate.js     # express-validator runner & error formatter
    │   └── errorHandler.js # Global Express error handler
    ├── validators/
    │   └── authValidator.js  # Validation rule sets (signup, signin, refresh)
    ├── utils/
    │   ├── errors.js       # Custom operational error classes
    │   └── response.js     # Helpers: successResponse / errorResponse
    └── db/
        └── migrate.js      # One-time migration: creates tables & indexes
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running **PostgreSQL** instance (local or hosted, e.g. Neon, Supabase, Railway)

### Installation

```bash
git clone https://github.com/HuzaifaNaseer02/backend-auth-template.git
cd backend-auth-template
npm install
```

### Environment Variables

Create a `.env` file in the project root. All variables marked **required** must be set or the server will refuse to start.

```env
# Server
PORT=3000                          # optional, default: 3000
NODE_ENV=development               # optional, default: development

# Database (required)
POSTGRES_URL=postgresql://user:password@host:5432/dbname

# JWT (required)
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d                  # optional, default: 7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d         # optional, default: 30d

# CORS
CORS_ORIGIN=http://localhost:5173  # optional, default: * (all origins)
```

> **Tip:** Use long, random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`.  
> You can generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Database Migration

Run the migration once to create the `users` and `refresh_tokens` tables:

```bash
npm run migrate
```

The script creates the `uuid-ossp` extension, both tables, and all required indexes inside a single transaction. If anything fails the transaction is rolled back.

### Running the Server

**Development** (auto-restarts on file changes via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

On successful startup you will see:

```
Database connected successfully
Server running on port 3000 [development]
```

---

## API Reference

All requests and responses use **JSON**. Successful responses follow this shape:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Human-readable message"
}
```

Base URL: `http://localhost:3000/api`

---

### Health Check

```
GET /health
```

Returns server status. No authentication required.

**Response `200`**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Sign Up

```
POST /auth/signup
```

Creates a new user account and returns tokens.

**Request body**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | Min 8 chars, at least one uppercase letter, one lowercase letter, one digit |
| `firstName` | string | ✅ | Max 100 chars |
| `lastName` | string | ❌ | Max 100 chars |

```json
{
  "email": "jane@example.com",
  "password": "Secret123",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Validation failed |
| `409` | Email already registered |

---

### Sign In

```
POST /auth/signin
```

Authenticates an existing user and returns tokens.

**Request body**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

```json
{
  "email": "jane@example.com",
  "password": "Secret123"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Validation failed |
| `401` | Invalid credentials or deactivated account |

---

### Refresh Token

```
POST /auth/refresh-token
```

Exchanges a valid refresh token for a **new access token and a new refresh token** (token rotation). The old refresh token is immediately invalidated.

**Request body**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | ✅ |

```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "accessToken": "<new-jwt>",
    "refreshToken": "<new-jwt>"
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Missing refresh token |
| `401` | Invalid, expired, or already-used refresh token |

---

### Logout

```
POST /auth/logout
```

Invalidates the supplied refresh token. No authentication header required.

**Request body**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | ❌ |

```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Get Profile

```
GET /auth/profile
```

Returns the authenticated user's profile. Requires a valid access token.

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `401` | Missing, invalid, or expired access token |

---

## Database Schema

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | Primary key, auto-generated |
| `email` | `VARCHAR(255)` | Unique, not null |
| `password_hash` | `VARCHAR(255)` | bcrypt hash, not null |
| `first_name` | `VARCHAR(100)` | Not null |
| `last_name` | `VARCHAR(100)` | Nullable |
| `is_active` | `BOOLEAN` | Default `true` |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |
| `updated_at` | `TIMESTAMPTZ` | Auto-set on insert |

Index: `idx_users_email` on `email`.

### `refresh_tokens`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | Primary key, auto-generated |
| `user_id` | `UUID` | Foreign key → `users(id)` ON DELETE CASCADE |
| `token` | `VARCHAR(500)` | The signed JWT string |
| `expires_at` | `TIMESTAMPTZ` | Derived from token `exp` claim |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |

Indexes: `idx_refresh_tokens_user_id`, `idx_refresh_tokens_token`.

---

## Security

| Mechanism | Detail |
|-----------|--------|
| **Helmet** | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Configurable allowed origin via `CORS_ORIGIN` env var |
| **Rate limiting** | 100 req / 15 min globally; 20 req / 15 min on `/api/auth/*` |
| **Body size limit** | `10kb` max request body to prevent large-payload attacks |
| **Password hashing** | bcrypt with 12 salt rounds |
| **JWT separation** | Separate secrets for access tokens and refresh tokens |
| **Refresh token rotation** | Old token deleted on every refresh; replay attacks invalidated |
| **Cascade delete** | Deleting a user automatically removes all their refresh tokens |
| **Input sanitisation** | Emails are normalized; strings are trimmed before validation |
| **Operational errors** | Only intentional `AppError` subclasses leak their messages; unexpected errors return a generic 500 |

---

## Error Handling

All errors are funneled through the global error handler in `src/middleware/errorHandler.js`.

Custom error classes live in `src/utils/errors.js`:

| Class | HTTP Status |
|-------|------------|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |

PostgreSQL constraint violations are also handled gracefully:
- `23505` (unique violation) → `409 Conflict`
- `23503` (foreign key violation) → `400 Bad Request`

All other unexpected errors return `500 Internal Server Error` without leaking internal details.

---

## Project Architecture

```
Request
  │
  ▼
app.js  (Helmet → CORS → Rate limit → Body parse)
  │
  ▼
routes/index.js  →  /health
  │
  └──► routes/authRoutes.js
            │
            ├── validate middleware  (express-validator rules)
            ├── authenticate middleware  (JWT verification, protected routes only)
            └── authController.js
                    │
                    ├── models/User.js          (SQL: users table)
                    └── models/RefreshToken.js  (SQL: refresh_tokens table)
                    │
                    └── utils/response.js  (standard JSON response shape)
  │
  ▼
middleware/errorHandler.js  (catches all next(err) calls)
```

