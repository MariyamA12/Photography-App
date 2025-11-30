// src/validators/parentPhotoValidator.js

const { query, validationResult } = require('express-validator');

const parentPhotoRules = [
  query('event_name').optional().isString().trim(),
  query('photo_type')
    .optional()
    .isIn(['individual','with_sibling','with_friend','group'])
    .withMessage('Invalid photo_type'),
  query('student_name').optional().isString().trim(),
  query('from_date').optional().isISO8601().withMessage('from_date must be a valid date'),
  query('to_date').optional().isISO8601().withMessage('to_date must be a valid date'),
  query('page').optional().isInt({ gt: 0 }).withMessage('page must be ≥ 1'),
  query('limit').optional().isInt({ gt: 0 }).withMessage('limit must be ≥ 1'),
];

function validateParentPhotos(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
}

module.exports = { parentPhotoRules, validateParentPhotos };
