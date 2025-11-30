// src/validators/siblingRelationValidator.js
const { query } = require('express-validator');

const getSiblingRelationRules = [
  query('studentName')
    .optional()
    .isString().withMessage('studentName must be a string'),
  query('relation_type')
    .optional()
    .isIn(['biological', 'step'])
    .withMessage('relation_type must be either biological or step'),
  query('schoolId')
    .optional()
    .isInt().withMessage('schoolId must be an integer'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be an integer ≥ 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('limit must be an integer ≥ 1'),
];

module.exports = { getSiblingRelationRules };
