// src/validators/eventValidator.js
const { body, param, query, validationResult } = require("express-validator");

// Create Event
const createEventRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Event name is required")
    .isLength({ max: 150 })
    .withMessage("Name too long"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be text"),
  body("event_date")
    .notEmpty()
    .withMessage("Event date is required")
    .isISO8601()
    .withMessage("Must be a valid date"),
  body("school_id")
    .notEmpty()
    .withMessage("School ID is required")
    .isInt({ gt: 0 })
    .withMessage("School ID must be a positive integer"),
  body("photographer_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Photographer ID must be a positive integer"),
];

// Update Event
const updateEventRules = [
  param("id")
    .notEmpty()
    .withMessage("Event ID is required")
    .isInt({ gt: 0 })
    .withMessage("Event ID must be a positive integer"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 150 })
    .withMessage("Name too long"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be text"),
  body("event_date").optional().isISO8601().withMessage("Must be a valid date"),
  body("school_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("School ID must be a positive integer"),
  body("photographer_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Photographer ID must be a positive integer"),
];

// Params for single Event
const eventIdParamRule = [
  param("id")
    .notEmpty()
    .withMessage("Event ID is required")
    .isInt({ gt: 0 })
    .withMessage("Event ID must be a positive integer"),
];

// List Events filters
const getEventsRules = [
  query("school_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Invalid school_id"),
  query("photographer_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Invalid photographer_id"),
  query("event_date").optional().isISO8601().withMessage("Invalid event_date"),
  query("search").optional().isString().trim(),
  query("page").optional().isInt({ gt: 0 }).withMessage("Page must be ≥ 1"),
  query("limit").optional().isInt({ gt: 0 }).withMessage("Limit must be ≥ 1"),
];

// Participants endpoint filters
const getParticipantsRules = [
  param("id")
    .notEmpty()
    .withMessage("Event ID is required")
    .isInt({ gt: 0 })
    .withMessage("Event ID must be a positive integer"),
  query("studentName").optional().isString().trim(),
  query("parentName").optional().isString().trim(),
  query("relationType")
    .optional()
    .isIn(["biological", "step"])
    .withMessage("relationType must be biological or step"),
  query("page").optional().isInt({ gt: 0 }).withMessage("Page must be ≥ 1"),
  query("limit").optional().isInt({ gt: 0 }).withMessage("Limit must be ≥ 1"),
];

// Common validate middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((e) => ({
        field: e.param ?? e.path ?? null, // v6 (param) or v7 (path)
        message: e.msg ?? e.message ?? "Invalid input",
      })),
    });
  }
  next();
}

module.exports = {
  createEventRules,
  updateEventRules,
  eventIdParamRule,
  getEventsRules,
  getParticipantsRules,
  validate,
};
