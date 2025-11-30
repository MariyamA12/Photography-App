// tests/integration-mock/eventSync.api.test.js
process.env.MOCK_DB = "true";

// ---- Default mocks used for most tests (happy paths + invalid id/body) ----
jest.mock("../../src/middleware/authMiddleware", () => (req, _res, next) => {
  req.user = { userId: 7, role: "photographer" };
  next();
});
jest.mock("../../src/middleware/roleMiddleware", () => (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
  next();
});

jest.mock("../../src/services/photographer/eventSyncService", () => ({
  syncEventData: jest.fn(),  // used by both GET /sync and POST /sync-upload
  syncUpload: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const { syncEventData, syncUpload } = require("../../src/services/photographer/eventSyncService");

describe("Photographer Event Sync API (mocked integration)", () => {
  beforeEach(() => jest.clearAllMocks());

  // -----------------------------
  // GET /api/photographer/events/:id/sync
  // -----------------------------
  test("GET /api/photographer/events/:id/sync -> 200 with payload", async () => {
    const payload = {
      event: { id: 10, name: "Photo Day", is_finished: false, school: { id: 3, name: "Greenwood" } },
      students: [{ id: 1, name: "Alice" }],
      qr_codes: [{ id: 100, code: "QR123", photo_type: "individual" }],
      photo_preferences: [{ id: 200, student_id: 1, preference_type: "individual" }],
    };
    syncEventData.mockResolvedValueOnce(payload);

    const res = await request(app).get("/api/photographer/events/10/sync");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(syncEventData).toHaveBeenCalledWith(10, 7);
  });

  test("GET /api/photographer/events/:id/sync -> 400 on invalid id", async () => {
    const res = await request(app).get("/api/photographer/events/0/sync");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  test("GET /api/photographer/events/:id/sync -> 403 if role mismatch", async () => {
    // Recreate the app with different authMiddleware for this test only
    jest.resetModules();

    // Inject a non-photographer role to trigger 403 in roleMiddleware
    jest.doMock("../../src/middleware/authMiddleware", () => (req, _res, next) => {
      req.user = { userId: 7, role: "admin" }; // not 'photographer'
      next();
    });
    jest.doMock("../../src/middleware/roleMiddleware", () => (role) => (req, res, next) => {
      if (!req.user || req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
      next();
    });
    jest.doMock("../../src/services/photographer/eventSyncService", () => ({
      syncEventData: jest.fn().mockResolvedValue({ ok: true }),
      syncUpload: jest.fn(),
    }));

    const request2 = require("supertest");
    const appWithWrongRole = require("../../src/app");

    const res = await request2(appWithWrongRole).get("/api/photographer/events/10/sync");
    expect(res.status).toBe(403);
  });

  // -----------------------------
  // POST /api/photographer/events/:id/sync-upload
  // -----------------------------
  test("POST /api/photographer/events/:id/sync-upload -> 200 + result when body is valid", async () => {
    // Controller calls syncEventData first (to verify ownership), then syncUpload
    syncEventData.mockResolvedValueOnce({ ok: true });

    syncUpload.mockResolvedValueOnce({
      totalSessions: 2,
      qrcodesMarked: 1,
    });

    const body = {
      sessions: [
        {
          session_id: "local-1",
          qrcode_id: 55,
          photo_type: "individual",
          student_ids: [1],
          timestamp: "2025-10-01T10:00:00Z",
        },
        {
          session_id: "local-2",
          qrcode_id: null,
          photo_type: "group",
          student_ids: [2, 3],
          timestamp: "2025-10-01T10:05:00Z",
        },
      ],
    };

    const res = await request(app)
      .post("/api/photographer/events/10/sync-upload")
      .send(body)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Sync successful",
      totalSessions: 2,
      qrcodesMarked: 1,
    });
    expect(syncEventData).toHaveBeenCalledWith(10, 7);
    expect(syncUpload).toHaveBeenCalledWith(10, 7, body.sessions);
  });

  test("POST /api/photographer/events/:id/sync-upload -> 400 on invalid body (missing sessions)", async () => {
    const res = await request(app)
      .post("/api/photographer/events/10/sync-upload")
      .send({}) // no sessions array
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});
