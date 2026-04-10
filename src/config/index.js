require('dotenv').config()

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
}

// Validate critical env vars
const requiredVars = ['POSTGRES_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable: ${varName}`)
    process.exit(1)
  }
}

module.exports = config
