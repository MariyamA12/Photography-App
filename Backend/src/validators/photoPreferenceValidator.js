const { body } = require('express-validator');
const { validate } = require('./photographerValidator'); 
  // re-use your existing `validate` fn from photographerValidator.js

const photoPreferenceRules = [
  body('event_id')
    .isInt({ gt: 0 }).withMessage('event_id must be a positive integer'),
  body('student_id')
    .isInt({ gt: 0 }).withMessage('student_id must be a positive integer'),
  body('preference_type')
    .isIn(['individual','with_sibling','with_friend','group'])
    .withMessage('preference_type must be one of individual, with_sibling, with_friend, or group'),
  body('extra_student_ids')
    .optional()
    .isArray().withMessage('extra_student_ids must be an array of integers')
    .bail()
    .custom(arr => arr.every(id => Number.isInteger(id)))
    .withMessage('each extra_student_id must be an integer'),
];

module.exports = {
  photoPreferenceRules,
  validatePhotoPreference: [...photoPreferenceRules, validate],
};
