const app = require('./src/app')
const config = require('./src/config')
const { pool } = require('./src/config/db')

const start = async () => {
  try {
    // Verify database connection
    await pool.query('SELECT 1')
    console.log('Database connected successfully')

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.nodeEnv}]`)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start()
