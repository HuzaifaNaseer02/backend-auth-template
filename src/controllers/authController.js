const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const {
  ConflictError,
  UnauthorizedError,
  BadRequestError
} = require('../utils/errors')
const { successResponse } = require('../utils/response')

const SALT_ROUNDS = 12

const generateAccessToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })
}

const generateRefreshToken = (user) => {
  return jwt.sign({ sub: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  })
}

const formatUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  createdAt: user.created_at
})

exports.signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body

    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      throw new ConflictError('Email is already registered')
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Store refresh token
    const decoded = jwt.decode(refreshToken)
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(decoded.exp * 1000)
    })

    return successResponse(
      res,
      {
        user: formatUserResponse(user),
        accessToken,
        refreshToken
      },
      201
    )
  } catch (err) {
    next(err)
  }
}

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findByEmail(email)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated')
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const decoded = jwt.decode(refreshToken)
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(decoded.exp * 1000)
    })

    return successResponse(res, {
      user: formatUserResponse(user),
      accessToken,
      refreshToken
    })
  } catch (err) {
    next(err)
  }
}

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required')
    }

    // Verify the refresh token
    let decoded
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret)
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token')
    }

    // Check if token exists in DB
    const storedToken = await RefreshToken.findByToken(refreshToken)
    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found')
    }

    // Delete old refresh token (rotation)
    await RefreshToken.deleteByToken(refreshToken)

    const user = await User.findById(decoded.sub)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    const newDecoded = jwt.decode(newRefreshToken)
    await RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(newDecoded.exp * 1000)
    })

    return successResponse(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await RefreshToken.deleteByToken(refreshToken)
    }

    return successResponse(res, { message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return successResponse(res, { user: formatUserResponse(user) })
  } catch (err) {
    next(err)
  }
}
