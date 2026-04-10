const { errorResponse } = require('../utils/response')

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err)
  }

  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode)
  }

  // Postgres unique constraint violation
  if (err.code === '23505') {
    return errorResponse(res, 'A record with that value already exists', 409)
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced resource not found', 400)
  }

  return errorResponse(res, 'Internal server error', 500)
}

module.exports = errorHandler
