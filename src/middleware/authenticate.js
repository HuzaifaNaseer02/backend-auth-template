const jwt = require('jsonwebtoken')
const config = require('../config')
const { UnauthorizedError } = require('../utils/errors')

const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, config.jwt.secret)

    req.user = { id: decoded.sub, email: decoded.email }
    next()
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid or expired token'))
    }
    next(err)
  }
}

module.exports = authenticate
