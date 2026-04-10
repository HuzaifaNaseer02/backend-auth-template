const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const config = require('./config')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Security headers
app.use(helmet())

// CORS
app.use(cors({ origin: config.cors.origin }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
})
app.use(limiter)

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many auth attempts, please try again later'
  }
})
app.use('/api/auth', authLimiter)

// Body parsing
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false }))

// API routes
app.use('/api', routes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Global error handler
app.use(errorHandler)

module.exports = app
