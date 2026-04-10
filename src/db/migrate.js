require('dotenv').config()
const { pool } = require('../config/db')

const createTables = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Enable uuid extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Index on email for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `)

    // Refresh tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)
    `)

    await client.query('COMMIT')
    console.log('Database migration completed successfully.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
