const { Router } = require('express')
const authController = require('../controllers/authController')
const authenticate = require('../middleware/authenticate')
const validate = require('../middleware/validate')
const {
  signupRules,
  signinRules,
  refreshTokenRules
} = require('../validators/authValidator')

const router = Router()

router.post('/signup', validate(signupRules), authController.signup)
router.post('/signin', validate(signinRules), authController.signin)
router.post(
  '/refresh-token',
  validate(refreshTokenRules),
  authController.refreshToken
)
router.post('/logout', authController.logout)
router.get('/profile', authenticate, authController.getProfile)

module.exports = router
