// tests/integration-mock/login.validation.api.test.js
process.env.MOCK_DB = 'true';
const request = require('supertest');
const app = require('../../src/app');

// This suite relies only on express-validator (no DB)
describe('Auth API validation (no DB)', () => {
  test('POST /api/login -> 400 on invalid body', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);

    const errs = res.body.errors || [];
    expect(Array.isArray(errs)).toBe(true);
    expect(errs.length).toBeGreaterThanOrEqual(2);

    // Accept either {field,msg} or {param,msg} or {message}-only
    const fields = errs.map(e => e.field || e.param).filter(Boolean);
    const messages = errs.map(e => e.message || e.msg || '').join(' ').toLowerCase();

    // If fields exist, assert them; otherwise assert messages mention both concerns
    if (fields.length) {
      expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
    } else {
      expect(messages).toMatch(/email/);
      expect(messages).toMatch(/password/);
    }
  });

  test('POST /api/login -> 400 when email missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: '123456' });

    expect(res.status).toBe(400);
    const errs = res.body.errors || [];
    const fields = errs.map(e => e.field || e.param).filter(Boolean);
    const messages = errs.map(e => e.message || e.msg || '').join(' ').toLowerCase();

    if (fields.length) {
      expect(fields).toEqual(expect.arrayContaining(['email']));
    } else {
      expect(messages).toMatch(/email/);
    }
  });
});
