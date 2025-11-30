// tests/unit/validators/photographerValidator.unit.test.js
const { validationResult, param, body } = require("express-validator");
const { eventIdParamRule, validate } = require("../../../src/validators/photographerValidator");

// helper to run rules (supports arrays/objects/function middlewares)
async function runRules(rules, { params = {}, bodyData = {} } = {}) {
  const req = { params, body: bodyData };
  const res = {};
  const next = () => {};
  const flat = Array.isArray(rules) ? rules.flat(Infinity) : [rules];

  for (const rule of flat) {
    if (!rule) continue;
    if (typeof rule.run === "function") {
      await rule.run(req, res, next);
    } else if (typeof rule === "function") {
      await rule(req, res, next);
    } else if (Array.isArray(rule)) {
      for (const r of rule) {
        if (typeof r?.run === "function") await r.run(req, res, next);
        else if (typeof r === "function") await r(req, res, next);
      }
    }
  }
  return { req, result: validationResult(req) };
}

// helper to call validate middleware
async function invokeValidate(req) {
  const res = {
    _status: 200,
    _json: null,
    status(c) { this._status = c; return this; },
    json(o) { this._json = o; return this; },
  };
  let nextCalled = false;
  await validate(req, res, () => { nextCalled = true; });
  return { status: res._status, body: res._json, nextCalled };
}

describe("photographerValidator.eventIdParamRule", () => {
  test("passes with valid positive int id", async () => {
    const { req, result } = await runRules([eventIdParamRule], { params: { id: "5" } });
    expect(result.isEmpty()).toBe(true);
    const out = await invokeValidate(req);
    expect(out.nextCalled).toBe(true);
  });

  test("fails with id=0", async () => {
    const { req, result } = await runRules([eventIdParamRule], { params: { id: "0" } });

    // Assert directly on express-validator's result (has param/path reliably)
    expect(result.isEmpty()).toBe(false);
    const first = result.array()[0] || {};
    const paramName = first.param || first.path;
    expect(paramName).toBe("id");

    // Then assert our validate() turns it into a 400, without assuming fields in body
    const out = await invokeValidate(req);
    expect(out.status).toBe(400);
    expect(Array.isArray(out.body.errors)).toBe(true);
    expect(out.body.errors.length).toBeGreaterThan(0);
  });
});

describe("photographerValidator.syncUpload validation", () => {
  // inline rules mirrored from photographerRoutes.js
  const syncUploadRules = [
    param("id").isInt({ gt: 0 }),
    body("sessions").isArray({ min: 1 }),
    body("sessions.*.session_id").isString().notEmpty(),
    body("sessions.*.photo_type").isIn(["individual", "with_sibling", "with_friend", "group", "random"]),
    body("sessions.*.student_ids").isArray(),
    body("sessions.*.timestamp").isISO8601(),
  ];

  test("passes with valid body", async () => {
    const { result } = await runRules(syncUploadRules, {
      params: { id: "10" },
      bodyData: {
        sessions: [
          {
            session_id: "local-1",
            photo_type: "individual",
            student_ids: [1, 2],
            timestamp: "2025-10-01T10:00:00Z",
          },
        ],
      },
    });
    expect(result.isEmpty()).toBe(true);
  });

  test("fails with invalid body", async () => {
    const { result } = await runRules(syncUploadRules, {
      params: { id: "0" }, // bad id
      bodyData: {
        sessions: [
          {
            session_id: "",
            photo_type: "bad-type",
            student_ids: "not-an-array",
            timestamp: "not-a-date",
          },
        ],
      },
    });

    expect(result.isEmpty()).toBe(false);

    const fields = result.array().map(e => e.param || e.path);
    expect(fields).toEqual(
      expect.arrayContaining([
        "id",
        expect.stringMatching(/session_id/),
        expect.stringMatching(/photo_type/),
        expect.stringMatching(/student_ids/),
        expect.stringMatching(/timestamp/),
      ])
    );
  });
});
