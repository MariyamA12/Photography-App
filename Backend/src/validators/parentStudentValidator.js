// src/validators/parentStudentValidator.js
const { body, param, query } = require('express-validator');
const { validate } = require('./userValidator');

const createParentStudentRules = [
  body('parent_id')
    .isInt().withMessage('Parent ID must be an integer'),
  body('student_id')
    .isInt().withMessage('Student ID must be an integer'),
  body('relationship_type')
    .isIn(['biological', 'step'])
    .withMessage('Relationship type must be either biological or step'),
];

const updateParentStudentRules = [
  param('parentId')
    .isInt().withMessage('Parent ID must be an integer'),
  param('studentId')
    .isInt().withMessage('Student ID must be an integer'),
  body('new_parent_id')
    .optional()
    .isInt().withMessage('New Parent ID must be an integer'),
  body('relationship_type')
    .optional()
    .isIn(['biological', 'step'])
    .withMessage('Relationship type must be either biological or step'),
];

const deleteParentStudentRules = [
  param('parentId')
    .isInt().withMessage('Parent ID must be an integer'),
  param('studentId')
    .isInt().withMessage('Student ID must be an integer'),
];

const getParentStudentRules = [
  query('parentName')
    .optional()
    .isString().withMessage('parentName must be a string'),
  query('studentName')
    .optional()
    .isString().withMessage('studentName must be a string'),
  query('schoolId')
    .optional()
    .isInt().withMessage('schoolId must be an integer'),
  query('relationship_type')
    .optional()
    .isIn(['biological', 'step'])
    .withMessage('relationship_type must be either biological or step'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be an integer ≥ 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('limit must be an integer ≥ 1'),
];

module.exports = {
  createParentStudentRules,
  updateParentStudentRules,
  deleteParentStudentRules,
  getParentStudentRules,
  validate,
};
