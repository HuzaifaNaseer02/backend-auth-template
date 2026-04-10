const db = require('../config/db')

const RefreshToken = {
  async create({ userId, token, expiresAt }) {
    const result = await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token, expires_at, created_at`,
      [userId, token, expiresAt]
    )
    return result.rows[0]
  },

  async findByToken(token) {
    const result = await db.query(
      `SELECT id, user_id, token, expires_at, created_at
       FROM refresh_tokens WHERE token = $1`,
      [token]
    )
    return result.rows[0] || null
  },

  async deleteByToken(token) {
    await db.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token])
  },

  async deleteAllForUser(userId) {
    await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId])
  },

  async deleteExpired() {
    await db.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`)
  }
}

module.exports = RefreshToken
