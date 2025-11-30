const { body, param, query } = require('express-validator');

const createStudentRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Student name is required'),
  body('class_name')
    .trim()
    .notEmpty().withMessage('Class name is required'),
  body('school_id')
    .optional()
    .isInt({ gt: 0 }).withMessage('School ID must be a positive integer'),
];

const updateStudentRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('If provided, name cannot be empty'),
  body('class_name')
    .optional()
    .trim()
    .notEmpty().withMessage('If provided, class name cannot be empty'),
  body('school_id')
    .optional()
    .isInt({ gt: 0 }).withMessage('If provided, school ID must be a positive integer'),
];

const idParamRule = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isInt({ gt: 0 }).withMessage('ID must be a positive integer'),
];

const getStudentsRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('Limit must be a positive integer')
    .toInt(),
  query('search')
    .optional()
    .isString().withMessage('Search must be a string'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest']).withMessage('Sort must be "newest" or "oldest"'),
  query('schoolName')
    .optional()
    .isString().withMessage('schoolName must be a string'),
  query('className')
    .optional()
    .isString().withMessage('className must be a string'),
  // new schoolId filter
  query('schoolId')
    .optional()
    .isInt({ min: 1 }).withMessage('schoolId must be a positive integer')
    .toInt(),
];

module.exports = {
  createStudentRules,
  updateStudentRules,
  idParamRule,
  getStudentsRules,
};
