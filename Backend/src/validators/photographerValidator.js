// src/validators/photographerValidator.js

const { body, param, validationResult } = require('express-validator');

const photographerLoginRules = [
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

// New rule for validating :eventId param
const eventIdParamRule = [
  param('id')
    .notEmpty().withMessage('Event ID is required')
    .isInt({ gt: 0 }).withMessage('Event ID must be a positive integer'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
};

module.exports = {
  photographerLoginRules,
  eventIdParamRule,
  validate,
};
