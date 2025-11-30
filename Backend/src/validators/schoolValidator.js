// src/validators/schoolValidator.js
const { body, param, query } = require('express-validator');

const createSchoolRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('School name is required'),
  body('address')
    .optional()
    .isString().withMessage('Address must be a string'),
];

const updateSchoolRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('If provided, name cannot be empty'),
  body('address')
    .optional()
    .isString().withMessage('If provided, address must be a string'),
];

const idParamRule = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isInt({ gt: 0 }).withMessage('ID must be a positive integer'),
];

const getSchoolsRules = [
  query('search')
    .optional()
    .isString().withMessage('Search must be a string'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest']).withMessage('Sort must be "newest" or "oldest"'),
];

module.exports = {
  createSchoolRules,
  updateSchoolRules,
  idParamRule,
  getSchoolsRules,
};
