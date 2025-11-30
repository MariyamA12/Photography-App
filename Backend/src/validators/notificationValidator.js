// src/validators/notificationValidator.js
const { query, validationResult } = require('express-validator');

const adminNotificationRules = [
  query('type')
    .optional()
    .isIn(['preference_request', 'photographer_assignment'])
    .withMessage('Invalid type'),
  query('recipientRole')
    .optional()
    .isIn(['parent', 'photographer'])
    .withMessage('Invalid recipientRole'),
  query('eventId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('eventId must be positive integer'),
  query('schoolId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('schoolId must be positive integer'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be ISO date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be ISO date'),
  query('page')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('page must be ≥1'),
  query('limit')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('limit must be ≥1'),
];

function validateNotification(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array().map(e => ({ field: e.param, message: e.msg })) });
  }
  next();
}

module.exports = {
  adminNotificationRules,
  validateNotification,
};
