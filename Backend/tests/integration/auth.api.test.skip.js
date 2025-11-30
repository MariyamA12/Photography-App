// tests/integration/auth.api.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createUser } = require('../fixtures/helpers');

describe('Auth API', () => {
  const admin = {
    name: 'Admin Test',
    email: 'admin.test@example.com',
    password: 'Admin@123',
    role: 'admin',
  };
  const parent = {
    name: 'Parent Test',
    email: 'parent.test@example.com',
    password: 'Parent@123',
    role: 'parent',
  };

  test('POST /api/login -> 401 for bad credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nope@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  test('POST /api/login -> success returns tokens + sets cookies', async () => {
    await createUser(admin);

    const res = await request(app)
      .post('/api/login')
      .send({ email: admin.email, password: admin.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: admin.email, role: 'admin' });
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();

    // cookies for web clients
    const setCookie = res.headers['set-cookie'] || [];
    const hasAccessCookie = setCookie.some((c) => c.startsWith('token='));
    const hasRefreshCookie = setCookie.some((c) => c.startsWith('refreshToken='));
    expect(hasAccessCookie).toBe(true);
    expect(hasRefreshCookie).toBe(true);
  });

  test('GET /api/profile -> works with Bearer access token', async () => {
    await createUser(parent);

    const login = await request(app)
      .post('/api/login')
      .send({ email: parent.email, password: parent.password });

    const { accessToken } = login.body;
    expect(accessToken).toBeTruthy();

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: parent.email, role: 'parent' });
  });

  test('POST /api/refresh -> rotates tokens using refreshToken in body', async () => {
    await createUser(parent);

    const login = await request(app)
      .post('/api/login')
      .send({ email: parent.email, password: parent.password });

    const oldRefresh = login.body.refreshToken;
    const res = await request(app)
      .post('/api/refresh')
      .send({ refreshToken: oldRefresh });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(oldRefresh);
  });

  test('GET /api/admin -> requires admin role', async () => {
    // parent should be forbidden
    await createUser(parent);
    const pLogin = await request(app)
      .post('/api/login')
      .send({ email: parent.email, password: parent.password });

    const resForbidden = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${pLogin.body.accessToken}`);

    expect(resForbidden.status).toBe(403);

    // admin should pass
    await createUser(admin);
    const aLogin = await request(app)
      .post('/api/login')
      .send({ email: admin.email, password: admin.password });

    const resOk = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${aLogin.body.accessToken}`);

    expect(resOk.status).toBe(200);
    expect(resOk.body).toHaveProperty('secret', 'only for admins');
  });

  test('POST /api/logout -> revokes refresh token', async () => {
    await createUser(parent);

    const login = await request(app)
      .post('/api/login')
      .send({ email: parent.email, password: parent.password });

    // logout using the refresh token in body
    const logout = await request(app)
      .post('/api/logout')
      .send({ refreshToken: login.body.refreshToken });

    expect(logout.status).toBe(200);

    // trying to refresh with the old refresh token should now fail
    const refresh = await request(app)
      .post('/api/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(refresh.status).toBe(401);
  });
});
