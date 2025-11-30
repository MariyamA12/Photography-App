// tests/unit/validators/photoValidator.unit.test.js
const { validationResult } = require('express-validator');
const { listRules, validate } = require('../../../src/validators/photoValidator');

async function runRules(rules, { query = {} } = {}) {
  const req = { query };
  const res = {};
  const next = () => {};
  for (const rule of rules) await rule.run(req, res, next);
  return { req, result: validationResult(req) };
}

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

describe('photoValidator.listRules', () => {
  test('passes valid query', async () => {
    const { req, result } = await runRules(listRules, {
      query: {
        event_id: '5',
        searchName: 'sam',
        studentName: 'alex',
        photoType: 'individual',
        page: '2',
        limit: '10',
      },
    });
    expect(result.isEmpty()).toBe(true);
    const out = await invokeValidate(req);
    expect(out.nextCalled).toBe(true);
  });

  test('fails invalid query', async () => {
    const { req, result } = await runRules(listRules, {
      query: {
        // missing event_id
        photoType: 'bad-type',
        page: '0',
        limit: '0',
      },
    });
    expect(result.isEmpty()).toBe(false);
    const out = await invokeValidate(req);
    expect(out.status).toBe(400);

    // tolerant of express-validator v6 (param) and v7 (path)
    const fields = (out.body.errors || []).map(e => e.field).filter(Boolean);
    const messages = (out.body.errors || [])
      .map(e => (e.message || '').toLowerCase())
      .join(' ');

    if (fields.length) {
      expect(fields.join(' ')).toMatch(/event_id/);
    } else {
      expect(messages).toMatch(/event_id/i);
    }
    expect(messages).toMatch(/invalid phototype|invalid photoType/i);
    expect(messages).toMatch(/page must be|limit must be/i);
  });
});
