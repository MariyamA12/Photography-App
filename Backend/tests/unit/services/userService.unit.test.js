// tests/unit/services/userService.unit.test.js
jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
jest.mock('uuid', () => ({ v4: () => 'uuid-refresh-token' }));

const pool = require('../../../src/config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { loginUser } = require('../../../src/services/userService');

describe('userService.loginUser', () => {
  const fakeUserRow = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    password: '$2b$10$hash_here', // service expects "password" field alias
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 401 for unknown email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      loginUser({ email: 'no@user.tld', password: 'x' })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 for wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeUserRow] });
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(
      loginUser({ email: fakeUserRow.email, password: 'bad' })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('returns user + accessToken + refreshToken on success', async () => {
    // 1) select user
    pool.query.mockResolvedValueOnce({ rows: [fakeUserRow] });
    // 2) bcrypt ok
    bcrypt.compare.mockResolvedValueOnce(true);
    // 3) insert refresh token
    pool.query.mockResolvedValueOnce({ rows: [] });

    const out = await loginUser({ email: fakeUserRow.email, password: 'ok' });

    expect(out.user).toEqual({
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    });
    expect(out.refreshToken).toBe('uuid-refresh-token');
    expect(typeof out.accessToken).toBe('string');

    // sanity: JWT payload
    const decoded = jwt.decode(out.accessToken);
    expect(decoded).toMatchObject({ userId: 1, role: 'admin' });

    // DB called twice: select user, insert refresh
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
