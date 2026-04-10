const { body } = require('express-validator')

exports.signupRules = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be at most 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must be at most 100 characters')
]

exports.signinRules = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

exports.refreshTokenRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
]
