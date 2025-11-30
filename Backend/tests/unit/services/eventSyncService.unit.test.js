// tests/unit/services/eventSyncService.unit.test.js
jest.mock("../../../src/config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
jest.mock("../../../src/services/eventService", () => ({
  getEventById: jest.fn(),
}));

const pool = require("../../../src/config/db");
const { getEventById } = require("../../../src/services/eventService");
const {
  syncEventData,
  syncUpload,
} = require("../../../src/services/photographer/eventSyncService");

describe("eventSyncService (unit, DB mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // syncEventData tests
  // ---------------------------
  describe("syncEventData", () => {
    test("returns full payload when event exists and belongs to photographer", async () => {
      const ev = {
        id: 10,
        name: "Photo Day",
        school_id: 3,
        photographer_id: 7,
        event_date: "2025-10-01",
        is_finished: false,
      };
      getEventById.mockResolvedValue(ev);

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 3, name: "Greenwood School" }] }) // schools
        .mockResolvedValueOnce({ rows: [{ id: 1, name: "Alice", class_name: "10A" }] }) // students
        .mockResolvedValueOnce({
          rows: [
            {
              id: 100,
              code: "QR123",
              photo_type: "individual",
              student_ids: [1],
              students: [],
            },
          ],
        }) // qr_codes
        .mockResolvedValueOnce({
          rows: [{ id: 200, student_id: 1, preference_type: "individual" }],
        }); // preferences

      const out = await syncEventData(10, 7);

      expect(out.event).toMatchObject({
        id: 10,
        name: "Photo Day",
        school: { id: 3, name: "Greenwood School" },
      });
      expect(out.students[0]).toHaveProperty("name", "Alice");
      expect(out.qr_codes[0]).toHaveProperty("code", "QR123");
      expect(out.photo_preferences[0]).toHaveProperty(
        "preference_type",
        "individual"
      );

      expect(pool.query).toHaveBeenCalledTimes(4);
    });

    test("throws 404 if event not found", async () => {
      getEventById.mockResolvedValue(null);
      await expect(syncEventData(99, 7)).rejects.toMatchObject({
        status: 404,
        message: "Event not found",
      });
    });

    test("throws 403 if event belongs to another photographer", async () => {
      const ev = { id: 10, photographer_id: 123, school_id: 3 };
      getEventById.mockResolvedValue(ev);
      await expect(syncEventData(10, 7)).rejects.toMatchObject({
        status: 403,
        message: "Forbidden: not your event",
      });
    });
  });

  // ---------------------------
  // syncUpload tests
  // ---------------------------
  describe("syncUpload", () => {
    test("inserts sessions + attendance + marks QR codes", async () => {
      // Mock DB client with transaction functions
      const client = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(client);

      // Order of queries inside syncUpload:
      // BEGIN
      // INSERT INTO photo_sessions ... RETURNING ...
      // INSERT INTO attendance ...
      // UPDATE qrcodes ...
      // COMMIT
      // (debug) SELECT * FROM attendance ...

      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: 111,
              qrcode_id: 55,
              student_ids: [1],
              photo_type: "individual",
            },
          ],
        }) // INSERT photo_sessions RETURNING ...
        .mockResolvedValueOnce({ rows: [] }) // INSERT attendance
        .mockResolvedValueOnce({ rows: [] }) // UPDATE qrcodes
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [] }); // debug SELECT

      const sessions = [
        {
          session_id: "abc",
          qrcode_id: 55,
          photo_type: "individual",
          student_ids: [1],
          timestamp: "2025-10-01T10:00:00Z",
        },
      ];

      const result = await syncUpload(10, 7, sessions);

      // sanity: correct SQLs hit in order with plausible params
      expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(client.query.mock.calls[1][0]).toMatch(/insert\s+into\s+photo_sessions/i);
      expect(client.query.mock.calls[2][0]).toMatch(/insert\s+into\s+attendance/i);
      expect(client.query.mock.calls[3][0]).toMatch(/update\s+qrcodes/i);
      expect(client.query).toHaveBeenNthCalledWith(5, "COMMIT");

      // make sure QR update used expected params
      expect(client.query.mock.calls[3][1]).toEqual([55, 7]);

      expect(result).toEqual({ totalSessions: 1, qrcodesMarked: 1 });
      expect(client.release).toHaveBeenCalled();
    });

    test("rolls back transaction if error occurs", async () => {
      const client = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(client);

      // BEGIN ok, then fail on photo_sessions insert returning
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("DB insert failed")); // INSERT photo_sessions fails

      await expect(
        syncUpload(10, 7, [
          {
            session_id: "abc",
            student_ids: [1],
            photo_type: "individual",
            timestamp: "2025-10-01T10:00:00Z",
          },
        ])
      ).rejects.toThrow("DB insert failed");

      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
    });
  });
});
