// src/validators/qrCodeValidator.js
const { param, query } = require('express-validator');

const eventIdParam = param('eventId')
  .exists().withMessage('Event ID is required')
  .isInt({ gt: 0 }).withMessage('Event ID must be a positive integer');

const generateQrCodesRules = [eventIdParam];

const getEventQRCodesRules = [
  eventIdParam,
  query('studentName')
    .optional().isString().withMessage('studentName must be a string')
    .trim(),
  query('photoType')
    .optional()
    .isIn(['individual', 'with_sibling', 'with_friend', 'group'])
    .withMessage('photoType must be one of individual, with_sibling, with_friend, group'),
  query('isScanned')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isScanned must be true or false'),
  query('page')
    .optional().isInt({ gt: 0 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional().isInt({ gt: 0 }).withMessage('limit must be a positive integer'),
];

const downloadEventQRCodesRules = [eventIdParam];

module.exports = {
  generateQrCodesRules,
  getEventQRCodesRules,
  downloadEventQRCodesRules,
};
