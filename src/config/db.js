const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

const query = (text, params) => pool.query(text, params)

const getClient = () => pool.connect()

module.exports = { pool, query, getClient }
