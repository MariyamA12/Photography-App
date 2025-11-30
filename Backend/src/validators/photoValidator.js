// src/validators/photoValidator.js
const { query, validationResult } = require("express-validator");

const listRules = [
  query("event_id")
    .exists().withMessage("event_id is required")
    .isInt({ gt: 0 }).withMessage("event_id must be a positive integer"),
  query("searchName").optional().isString().trim(),
  query("studentName").optional().isString().trim(),
  query("photoType")
    .optional()
    .isIn(["individual","with_sibling","with_friend","group"])
    .withMessage("Invalid photoType"),
  query("page").optional().isInt({ gt: 0 }).withMessage("page must be ≥ 1"),
  query("limit").optional().isInt({ gt: 0 }).withMessage("limit must be ≥ 1"),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.param, message: e.msg })),
    });
  }
  next();
}

module.exports = { listRules, validate };
