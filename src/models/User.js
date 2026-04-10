const db = require('../config/db')

const User = {
  async create({ email, passwordHash, firstName, lastName }) {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_active, created_at, updated_at`,
      [email, passwordHash, firstName, lastName]
    )
    return result.rows[0]
  },

  async findByEmail(email) {
    const result = await db.query(
      `SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at
       FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] || null
  },

  async findById(id) {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  },

  async updateProfile(id, { firstName, lastName }) {
    const result = await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, first_name, last_name, is_active, created_at, updated_at`,
      [firstName, lastName, id]
    )
    return result.rows[0] || null
  },

  async updatePassword(id, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, id]
    )
  }
}

module.exports = User
