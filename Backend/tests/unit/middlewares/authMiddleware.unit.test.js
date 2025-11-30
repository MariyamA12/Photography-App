jest.mock('../../../src/services/userService', () => ({
  rotateRefreshToken: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

const jwt = require('jsonwebtoken');
const { rotateRefreshToken } = require('../../../src/services/userService');
const authMiddleware = require('../../../src/middleware/authMiddleware');

function mockReqRes(headers = {}, cookies = {}, body = {}) {
  return {
    req: {
      headers,
      cookies,
      body
    },
    res: {
      statusCode: 200,
      cookiesSet: {},
      _json: null,
      cookie(name, value) { this.cookiesSet[name] = value; return this; },
      status(code) { this.statusCode = code; return this; },
      json(obj) { this._json = obj; return this; }
    },
    next: jest.fn()
  };
}

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('passes with valid Bearer token', async () => {
    jwt.verify.mockReturnValue({ userId: 1, role: 'admin' });

    const { req, res, next } = mockReqRes(
      { authorization: 'Bearer valid.jwt' },
      {},
      {}
    );

    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: 1, role: 'admin' });
  });

  test('rotates using refreshToken cookie when access expired', async () => {
    const expiredErr = new Error('expired');
    expiredErr.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw expiredErr; });

    rotateRefreshToken.mockResolvedValue({
      accessToken: 'newAccess',
      refreshToken: 'newRefresh',
      user: { id: 2, role: 'parent' }
    });

    const { req, res, next } = mockReqRes({}, { refreshToken: 'oldRefresh' }, {});
    await authMiddleware(req, res, next);

    expect(res.cookiesSet.token).toBe('newAccess');
    expect(res.cookiesSet.refreshToken).toBe('newRefresh');
    expect(req.user).toEqual({ userId: 2, role: 'parent' });
    expect(next).toHaveBeenCalled();
  });

  test('401 when no tokens at all', async () => {
    const { req, res, next } = mockReqRes();
    await authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._json).toEqual({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when rotation fails', async () => {
    const expiredErr = new Error('expired');
    expiredErr.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw expiredErr; });

    rotateRefreshToken.mockRejectedValue(new Error('bad refresh'));

    const { req, res, next } = mockReqRes({}, { refreshToken: 'bad' }, {});
    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._json).toEqual({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });
});
