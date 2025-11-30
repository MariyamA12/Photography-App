const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/health', () => {
  it('returns OK with environment=test', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'OK',
      message: 'API is running',
      environment: 'test',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});
