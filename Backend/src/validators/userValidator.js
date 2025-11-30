const { body, validationResult } = require('express-validator');

const emailNormalizationOptions = {
  // Keep dots and subaddresses in Gmail (so man.tom@gmail.com stays intact)
  gmail_lowercase: true,
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  // For other providers, just lowercase
  outlook_lowercase: true,
  yahoo_lowercase: true,
  icloud_lowercase: true
};

const loginRules = [
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(emailNormalizationOptions),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const createUserRules = [
  body('name')
    .notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(emailNormalizationOptions),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['parent', 'photographer'])
    .withMessage('Role must be either parent or photographer')
];

const updateUserRules = [
  body('name')
    .notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(emailNormalizationOptions),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['parent', 'photographer'])
    .withMessage('Role must be either parent or photographer')
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
  loginRules,
  createUserRules,
  updateUserRules,
  validate
};
