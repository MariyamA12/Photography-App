// tests/integration-mock/photos.api.test.js
process.env.MOCK_DB = 'true';

jest.mock('../../src/middleware/authMiddleware', () => (req, _res, next) => {
  req.user = { userId: 1, role: 'admin' };
  next();
});
jest.mock('../../src/middleware/roleMiddleware', () => (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
});

//Mock multer to inject req.files so the route never complains
jest.mock('multer', () => {
  const mockMulter = () => ({
    array: () => (req, _res, next) => {
      req.files = [
        { originalname: 'IMG_0001.JPG', buffer: Buffer.from('dummy-1') },
        { originalname: 'IMG_0002.JPG', buffer: Buffer.from('dummy-2') },
      ];
      next();
    },
    single: () => (req, _res, next) => {
      req.file = { originalname: 'IMG_0001.JPG', buffer: Buffer.from('dummy-zip') };
      next();
    },
    fields: () => (req, _res, next) => { req.files = []; next(); },
  });
  // allow .memoryStorage() calls if your code uses it
  mockMulter.memoryStorage = () => ({});
  return mockMulter;
});

jest.mock('../../src/services/photoService', () => ({
  listPhotos: jest.fn(),
  deletePhoto: jest.fn(),
}));
jest.mock('../../src/services/dslrUploadService', () => ({
  uploadDslrPhotos: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app');
const photoService = require('../../src/services/photoService');
const { uploadDslrPhotos } = require('../../src/services/dslrUploadService');

describe('Admin Photos API (mocked integration)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /api/admin/photos -> 200 with result + parsed numbers', async () => {
    const payload = { data: [{ id: 1 }], total: 1, page: 2, limit: 10 };
    photoService.listPhotos.mockResolvedValueOnce(payload);

    const res = await request(app)
      .get('/api/admin/photos')
      .query({ event_id: '5', searchName: 'sam', page: '2', limit: '10' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(photoService.listPhotos).toHaveBeenCalledWith(expect.objectContaining({
      event_id: 5,
      searchName: 'sam',
      page: 2,
      limit: 10,
    }));
  });

  test('DELETE /api/admin/photos/:photoId -> 204', async () => {
    photoService.deletePhoto.mockResolvedValueOnce();
    const res = await request(app).delete('/api/admin/photos/123');
    expect([200, 204]).toContain(res.status);
    expect(photoService.deletePhoto).toHaveBeenCalledWith(123);
  });

  test('POST /api/admin/events/:id/upload-dslr-photos -> 201', async () => {
    uploadDslrPhotos.mockResolvedValueOnce({
      newCount: 3,
      duplicateCount: 2,
      details: [{ file: 'a.jpg', status: 'new' }],
    });

    // no .attach() needed; multer mock injects req.files
    const res = await request(app).post('/api/admin/events/5/upload-dslr-photos');

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      newCount: 3,
      duplicateCount: 2,
      details: [{ file: 'a.jpg', status: 'new' }],
    });
    expect(uploadDslrPhotos).toHaveBeenCalledWith(5, expect.anything(), 1);
  });
});
