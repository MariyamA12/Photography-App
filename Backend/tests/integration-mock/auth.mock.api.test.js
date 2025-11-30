/**
 * Mocked "integration" tests (hit real Express app, mock DB+bcrypt)
 */
process.env.MOCK_DB = 'true';

// 👉 Mocks MUST come before requiring the app
jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('uuid', () => ({ v4: () => 'uuid-refresh-token' }));

const request = require('supertest');
const app = require('../../src/app');

const pool = require('../../src/config/db');
const bcrypt = require('bcrypt');

// common fake rows
const adminRow = {
  id: 1, name: 'Admin', email: 'admin@test.local',
  password: '$2b$10$hash', role: 'admin'
};
const parentRow = {
  id: 2, name: 'Parent', email: 'parent@test.local',
  password: '$2b$10$hash', role: 'parent'
};

describe('Auth API (MOCKED DB)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/login -> 401 when email not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // SELECT user -> none

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nope@test.local', password: 'notfound' }); // >= 6 chars

    expect(res.status).toBe(401);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  test('POST /api/login -> 401 when password wrong', async () => {
    pool.query.mockResolvedValueOnce({ rows: [adminRow] }); // SELECT user
    bcrypt.compare.mockResolvedValueOnce(false);             // bad password

    const res = await request(app)
      .post('/api/login')
      .send({ email: adminRow.email, password: 'wrongpw' }); // >= 6 chars

    expect(res.status).toBe(401);
  });

  test('POST /api/login -> success returns tokens + cookies', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [adminRow] }) // SELECT user
      .mockResolvedValueOnce({ rows: [] });        // INSERT refresh token
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/login')
      .send({ email: adminRow.email, password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: adminRow.email, role: 'admin' });
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBe('uuid-refresh-token');

    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toMatch(/token=/);
    expect(cookies.join(';')).toMatch(/refreshToken=/);
  });

  test('GET /api/profile -> works with Bearer token + user lookup', async () => {
    // login
    pool.query
      .mockResolvedValueOnce({ rows: [parentRow] }) // SELECT user (login)
      .mockResolvedValueOnce({ rows: [] });         // INSERT refresh
    bcrypt.compare.mockResolvedValueOnce(true);

    const login = await request(app)
      .post('/api/login')
      .send({ email: parentRow.email, password: 'Parent@123' })
      .expect(200);

    const token = login.body.accessToken;

    // controller will SELECT users WHERE id=$1
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: parentRow.id, name: parentRow.name, email: parentRow.email, role: parentRow.role }] });

    const prof = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(prof.body).toMatchObject({
      userId: parentRow.id,
      name: parentRow.name,
      email: parentRow.email,
      role: parentRow.role
    });
  });

  test('GET /api/admin -> forbidden for parent, ok for admin', async () => {
    // parent login
    pool.query
      .mockResolvedValueOnce({ rows: [parentRow] }) // SELECT
      .mockResolvedValueOnce({ rows: [] });         // INSERT refresh
    bcrypt.compare.mockResolvedValueOnce(true);

    const pLogin = await request(app)
      .post('/api/login')
      .send({ email: parentRow.email, password: 'Parent@123' })
      .expect(200);

    const pRes = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${pLogin.body.accessToken}`);

    expect(pRes.status).toBe(403);

    // admin login
    pool.query
      .mockResolvedValueOnce({ rows: [adminRow] })
      .mockResolvedValueOnce({ rows: [] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const aLogin = await request(app)
      .post('/api/login')
      .send({ email: adminRow.email, password: 'Admin@123' })
      .expect(200);

    const aRes = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${aLogin.body.accessToken}`);

    expect(aRes.status).toBe(200);
    expect(aRes.body).toHaveProperty('secret', 'only for admins');
  });
});
