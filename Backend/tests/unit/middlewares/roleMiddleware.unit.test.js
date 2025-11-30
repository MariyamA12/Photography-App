const roleMiddleware = require('../../../src/middleware/roleMiddleware');

const runMw = (mw, req = {}, res = {}) =>
  new Promise((resolve) => {
    const r = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((x) => resolve({ type: 'json', payload: x })),
      ...res,
    };
    mw(req, r, () => resolve({ type: 'next' }));
  });

describe('roleMiddleware', () => {
  test('401 if no user on req', async () => {
    const mw = roleMiddleware('admin');
    const out = await runMw(mw, { }, {});
    expect(out.type).toBe('json');
    expect(out.payload.message).toMatch(/Unauthorized/i);
  });

  test('403 if role mismatch', async () => {
    const mw = roleMiddleware('admin');
    const out = await runMw(mw, { user: { role: 'parent' } }, {});
    expect(out.type).toBe('json');
    expect(out.payload.message).toMatch(/Forbidden/i);
  });

  test('next() if role matches', async () => {
    const mw = roleMiddleware('admin');
    const out = await runMw(mw, { user: { role: 'admin' } }, {});
    expect(out.type).toBe('next');
  });
});
