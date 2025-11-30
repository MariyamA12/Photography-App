// src/validators/attendanceValidator.js
const { query, validationResult } = require('express-validator');

const attendanceRules = [
  query('event_id').optional().isInt({ gt: 0 }).withMessage('event_id must be a positive integer'),
  query('school_id').optional().isInt({ gt: 0 }).withMessage('school_id must be a positive integer'),
  query('student_name').optional().isString().trim(),
  query('photographer_id').optional().isInt({ gt: 0 }).withMessage('photographer_id must be a positive integer'),
  query('photo_type').optional().isIn(['individual','with_sibling','with_friend','group']).withMessage('Invalid photo_type'),
  query('class_name').optional().isString().trim(),
  query('presence').optional().isIn(['present','absent']).withMessage('presence must be present or absent'),
  query('is_random').optional().isBoolean().withMessage('is_random must be boolean'),
  query('date_from').optional().isISO8601().withMessage('date_from must be a valid date'),
  query('date_to').optional().isISO8601().withMessage('date_to must be a valid date'),
  query('page').optional().isInt({ gt: 0 }).withMessage('page must be ≥ 1'),
  query('limit').optional().isInt({ gt: 0 }).withMessage('limit must be ≥ 1'),
];

function validateAttendance(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => ({ field: e.param, message: e.msg })) });
  }
  next();
}

module.exports = {
  attendanceRules,
  validateAttendance,
};
