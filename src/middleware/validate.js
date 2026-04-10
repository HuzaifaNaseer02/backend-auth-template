const { validationResult } = require('express-validator')
const { BadRequestError } = require('../utils/errors')

const validate = (validations) => {
  return async (req, _res, next) => {
    for (const validation of validations) {
      await validation.run(req)
    }

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const messages = errors.array().map((e) => e.msg)
    return next(new BadRequestError(messages.join(', ')))
  }
}

module.exports = validate
