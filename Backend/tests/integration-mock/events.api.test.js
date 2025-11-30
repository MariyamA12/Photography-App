process.env.MOCK_DB = 'true';
 
// Inject an admin user without real JWT
jest.mock('../../src/middleware/authMiddleware', () => (req, _res, next) => {
  req.user = { userId: 1, role: 'admin' };
  next();
});
 
// Only allow admins
jest.mock('../../src/middleware/roleMiddleware', () => (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
});
 
// Mock DB (used by sendPhotographerNotification to look up photographer user)
jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
 
// Mock email service used by notify endpoints
jest.mock('../../src/services/emailService', () => ({
  sendPhotographerAlert: jest.fn(),
  sendParentsAlert: jest.fn(),
}));
 
// Mock event service layer entirely
jest.mock('../../src/services/eventService', () => ({
  createEvent: jest.fn(),
  getFilteredEvents: jest.fn(),
  getEventById: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  getEventParticipants: jest.fn(),
  markPhotographerSentByButton: jest.fn(),
  markParentsSentByButton: jest.fn(),
  markPhotographerSentByJob: jest.fn(),
  markParentsSentByJob: jest.fn(),
}));
 
const request = require('supertest');
const app = require('../../src/app');
 
const svc = require('../../src/services/eventService');
const pool = require('../../src/config/db');
const { sendPhotographerAlert } = require('../../src/services/emailService');
 
describe('Admin Events API (mocked integration)', () => {
  beforeEach(() => jest.clearAllMocks());
 
  test('POST /api/admin/events -> 201 on success', async () => {
    const fake = {
      id: 99, name: 'Photo Day', description: 'desc',
      event_date: '2025-10-01', school_id: 3, photographer_id: 7, created_by: 1
    };
    svc.createEvent.mockResolvedValueOnce(fake);
 
    const res = await request(app)
      .post('/api/admin/events')
      .send({
        name: 'Photo Day',
        description: 'desc',
        event_date: '2025-10-01',
        school_id: 3,
        photographer_id: 7
      });
 
    expect(res.status).toBe(201);
    // controller returns { event: ... }
    expect(res.body).toEqual({ event: fake });
    // controller adds created_by from req.user
    expect(svc.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Photo Day',
      created_by: 1,
    }));
  });
 
  test('POST /api/admin/events -> 400 on validation error', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .send({ name: '', event_date: 'not-a-date' });
 
    expect([400, 422]).toContain(res.status);
    const msg = JSON.stringify(res.body).toLowerCase();
    expect(msg).toMatch(/event name|required|valid date|school id/);
  });
 
  test('GET /api/admin/events -> 200 with filters + pagination', async () => {
    // controller maps extra *_Sent fields; not required to assert them
    svc.getFilteredEvents.mockResolvedValueOnce({
      data: [{ id: 1, name: 'A' }],
      total: 1,
      page:  '1',   // controller passes strings through from req.query
      limit: '10',
    });
 
    const res = await request(app)
      .get('/api/admin/events')
      .query({ search: 'A', page: 1, limit: 10 });
 
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(1);
 
    // match controller behavior: passes strings from req.query to service
    expect(svc.getFilteredEvents).toHaveBeenCalledWith(expect.objectContaining({
      search: 'A',
      page: '1',
      limit: '10',
    }));
  });
 
  test('GET /api/admin/events/:id -> 200 with event wrapper', async () => {
    svc.getEventById.mockResolvedValueOnce({ id: 5, name: 'E', event_date: '2099-01-01' });
 
    const res = await request(app).get('/api/admin/events/5');
    expect(res.status).toBe(200);
    // controller returns { event: {..., timeUntilJobMs } }
    expect(res.body).toHaveProperty('event');
    expect(res.body.event).toMatchObject({ id: 5, name: 'E' });
    expect(typeof res.body.event.timeUntilJobMs).toBe('number');
  });
 
  test('PATCH /api/admin/events/:id -> 200 with {event}', async () => {
    svc.updateEvent.mockResolvedValueOnce({ id: 7, name: 'Updated' });
 
    const res = await request(app)
      .patch('/api/admin/events/7')
      .send({ name: 'Updated' });
 
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ event: { id: 7, name: 'Updated' } });
    expect(svc.updateEvent).toHaveBeenCalledWith(7, { name: 'Updated' });
  });
 
  test('DELETE /api/admin/events/:id -> 204', async () => {
    svc.deleteEvent.mockResolvedValueOnce();
    const res = await request(app).delete('/api/admin/events/13');
    expect([200, 204]).toContain(res.status); // 204 per controller
    expect(svc.deleteEvent).toHaveBeenCalledWith(13);
  });
 
  test('GET /api/admin/events/:id/participants -> 200', async () => {
    const payload = { data: [{ student_id: 1 }], total: 1, page: 1, limit: 10 };
    svc.getEventParticipants.mockResolvedValueOnce(payload);
 
    const res = await request(app)
      .get('/api/admin/events/9/participants')
      .query({ studentName: 'a', parentName: 'b', relationType: 'biological', page: 1, limit: 10 });
 
    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(svc.getEventParticipants).toHaveBeenCalledWith(9, expect.objectContaining({
      studentName: 'a', parentName: 'b', relationType: 'biological', page: 1, limit: 10
    }));
  });
 
  test('POST /api/admin/events/:id/notify-photographer -> 200', async () => {
    // Event found, not already notified, has photographer_id
    svc.getEventById.mockResolvedValueOnce({
      id: 4,
      event_date: '2099-01-01',
      photographer_id: 77,
      notify_photographer_button_sent: false,
    });
 
    // DB user lookup for photographer
    pool.query.mockResolvedValueOnce({ rows: [{ name: 'Alice', email: 'alice@x.com' }] });
 
    // Email ok
    sendPhotographerAlert.mockResolvedValueOnce();
 
    // Mark flag updated
    svc.markPhotographerSentByButton.mockResolvedValueOnce({
      id: 4, notify_photographer_button_sent: true
    });
 
    const res = await request(app).post('/api/admin/events/4/notify-photographer');
 
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'Photographer notified',
      event: { id: 4, notify_photographer_button_sent: true }
    });
 
    expect(svc.getEventById).toHaveBeenCalledWith(4);
    expect(pool.query).toHaveBeenCalledWith('SELECT name, email FROM users WHERE id = $1', [77]);
    expect(sendPhotographerAlert).toHaveBeenCalled();
    expect(svc.markPhotographerSentByButton).toHaveBeenCalledWith(4);
  });
});