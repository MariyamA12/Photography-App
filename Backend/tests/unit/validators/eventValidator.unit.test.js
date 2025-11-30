const { validationResult } = require('express-validator');
const {
  createEventRules,
  updateEventRules,
  eventIdParamRule,
  getEventsRules,
  getParticipantsRules,
  validate,
} = require('../../../src/validators/eventValidator');
 
async function runRules(rules, { body = {}, params = {}, query = {} } = {}) {
  const req = { body, params, query };
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
 
describe('eventValidator (unit)', () => {
  describe('createEventRules', () => {
    test('passes for a valid payload', async () => {
      const { req, result } = await runRules(createEventRules, {
        body: {
          name: 'Photo Day',
          description: 'desc',
          event_date: '2025-10-01',
          school_id: 3,
          photographer_id: 7,
        },
      });
      expect(result.isEmpty()).toBe(true);
      const out = await invokeValidate(req);
      expect(out.nextCalled).toBe(true);
    });
 
    test('fails for missing/invalid required fields', async () => {
      const { req, result } = await runRules(createEventRules, {
        body: { name: '', event_date: 'not-a-date', school_id: -1 },
      });
      expect(result.isEmpty()).toBe(false);
 
      const out = await invokeValidate(req);
      expect(out.status).toBe(400);
 
      const fields = out.body.errors.map(e => e.field).filter(Boolean);
      const messages = out.body.errors
        .map(e => (e.message || '').toLowerCase())
        .join(' ');
 
      if (fields.length) {
        expect(fields).toEqual(expect.arrayContaining(['name', 'event_date', 'school_id']));
      } else {
        expect(messages).toMatch(/name/);
        expect(messages).toMatch(/valid date|must be a valid date/);
        expect(messages).toMatch(/school id/);
      }
    });
  });
 
  describe('updateEventRules', () => {
    test('passes when id is valid and optional fields are valid', async () => {
      const { req, result } = await runRules(updateEventRules, {
        params: { id: '5' },
        body: { name: 'Updated', description: 'ok', event_date: '2025-01-02', school_id: 2, photographer_id: 9 },
      });
      expect(result.isEmpty()).toBe(true);
      const out = await invokeValidate(req);
      expect(out.nextCalled).toBe(true);
    });
 
    test('fails when id is invalid or optional fields are bad', async () => {
      const { req, result } = await runRules(updateEventRules, {
        params: { id: '0' },
        body: { name: '', event_date: 'nope', school_id: 'x', photographer_id: -3 },
      });
      expect(result.isEmpty()).toBe(false);
 
      const out = await invokeValidate(req);
      expect(out.status).toBe(400);
      const msgs = out.body.errors.map(e => (e.message || '').toLowerCase()).join(' ');
      expect(msgs).toMatch(/event id/);
      expect(msgs).toMatch(/name/);
      expect(msgs).toMatch(/valid date|must be a valid date/);
      expect(msgs).toMatch(/school id/);
      expect(msgs).toMatch(/photographer id/);
    });
  });
 
  describe('eventIdParamRule', () => {
    test('passes with positive int id', async () => {
      const { req, result } = await runRules(eventIdParamRule, { params: { id: '12' } });
      expect(result.isEmpty()).toBe(true);
      const out = await invokeValidate(req);
      expect(out.nextCalled).toBe(true);
    });
 
    test('fails when id missing/invalid', async () => {
      const { req, result } = await runRules(eventIdParamRule, { params: { id: '0' } });
      expect(result.isEmpty()).toBe(false);
      const out = await invokeValidate(req);
      expect(out.status).toBe(400);
 
      const fields = out.body.errors.map(e => e.field).filter(Boolean);
      const messages = out.body.errors.map(e => (e.message || '').toLowerCase()).join(' ');
      if (fields.length) {
        expect(fields).toEqual(expect.arrayContaining(['id']));
      } else {
        expect(messages).toMatch(/event id|id/);
      }
    });
  });
 
  describe('getEventsRules', () => {
    test('passes with valid filters & pagination', async () => {
      const { req, result } = await runRules(getEventsRules, {
        query: {
          school_id: '3',
          photographer_id: '7',
          event_date: '2025-10-01',
          search: 'day',
          page: '1',
          limit: '10',
        },
      });
      expect(result.isEmpty()).toBe(true);
      const out = await invokeValidate(req);
      expect(out.nextCalled).toBe(true);
    });
 
    test('fails with bad query values', async () => {
      const { req, result } = await runRules(getEventsRules, {
        query: { school_id: '-1', photographer_id: 'x', event_date: 'nope', page: '0', limit: '0' },
      });
      expect(result.isEmpty()).toBe(false);
      const out = await invokeValidate(req);
      expect(out.status).toBe(400);
      const msgs = out.body.errors.map(e => (e.message || '').toLowerCase()).join(' ');
      expect(msgs).toMatch(/invalid school_id/);
      expect(msgs).toMatch(/invalid photographer_id/);
      expect(msgs).toMatch(/invalid event_date/);
      expect(msgs).toMatch(/page must be/i);
      expect(msgs).toMatch(/limit must be/i);
    });
  });
 
  describe('getParticipantsRules', () => {
    test('passes with valid params & query', async () => {
      const { req, result } = await runRules(getParticipantsRules, {
        params: { id: '9' },
        query: { studentName: 'a', parentName: 'b', relationType: 'biological', page: '2', limit: '20' },
      });
      expect(result.isEmpty()).toBe(true);
      const out = await invokeValidate(req);
      expect(out.nextCalled).toBe(true);
    });
 
    test('fails with invalid relationType/paging', async () => {
      const { req, result } = await runRules(getParticipantsRules, {
        params: { id: '0' },
        query: { relationType: 'cousin', page: '0', limit: '0' },
      });
      expect(result.isEmpty()).toBe(false);
      const out = await invokeValidate(req);
      expect(out.status).toBe(400);
      const msgs = out.body.errors.map(e => (e.message || '').toLowerCase()).join(' ');
      expect(msgs).toMatch(/event id/);
      expect(msgs).toMatch(/relationtype must be biological or step/);
      expect(msgs).toMatch(/page must be/i);
      expect(msgs).toMatch(/limit must be/i);
    });
  });
});