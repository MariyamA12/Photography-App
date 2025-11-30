// src/validators/dslrPhotoUploadValidator.js
const { param, validationResult } = require("express-validator");

const dslrPhotoUploadRules = [
  param("id")
    .exists().withMessage("Event ID is required")
    .isInt({ gt: 0 }).withMessage("Event ID must be a positive integer"),
];

function validateDslrUpload(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.param, message: e.msg })),
    });
  }
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "At least one photo file is required" });
  }
  next();
}

module.exports = { dslrPhotoUploadRules, validateDslrUpload };
