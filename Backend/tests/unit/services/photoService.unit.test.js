// tests/unit/services/photoService.unit.test.js
jest.mock("../../../src/config/db", () => ({ query: jest.fn() }));

const pool = require("../../../src/config/db");
const svc = require("../../../src/services/photoService");

describe("photoService (unit, DB mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("listPhotos -> filters + pagination", async () => {
    // 1st call: COUNT(*)
    pool.query.mockResolvedValueOnce({ rows: [{ total: 23 }] });
    // 2nd call: data rows
    const rows = [
      { id: 1, file_name: "a.jpg", student_ids: [1], student_names: ["Sam"] },
      { id: 2, file_name: "b.jpg", student_ids: [], student_names: [] },
    ];
    pool.query.mockResolvedValueOnce({ rows });

    const out = await svc.listPhotos({
      event_id: 5,
      searchName: "abc",
      studentName: "Sam",
      photoType: "individual",
      page: 3,
      limit: 10,
    });

    expect(out).toEqual({
      data: rows,
      total: 23,
      page: 3,
      limit: 10,
    });

    expect(pool.query).toHaveBeenCalledTimes(2);

    // COUNT query
    const [countSQL, countParams] = pool.query.mock.calls[0];
    expect(countSQL).toMatch(/select\s+count\(\*\)::int\s+as\s+total/i);
    expect(countSQL).toMatch(/from\s+photos\s+p/i);
    expect(countSQL).toMatch(/p\.event_id\s*=\s*\$1/i);
    expect(countSQL).toMatch(/p\.file_name\s+ilike\s*\$\d+/i);
    expect(countSQL).toMatch(/p\.photo_type\s*=\s*\$\d+/i);
    expect(countSQL).toMatch(/exists\s*\(/i);
    // only the first 4 params are used by COUNT (limit/offset are appended later)
    expect(countParams.slice(0, 4)).toEqual([5, "%abc%", "individual", "%Sam%"]);

    // Data query
    const [dataSQL, dataParams] = pool.query.mock.calls[1];
    expect(dataSQL).toMatch(/select[\s\S]+from\s+photos\s+p/i);
    expect(dataSQL).toMatch(/left\s+join\s+lateral/i);
    expect(dataSQL).toMatch(/order\s+by\s+p\.added_at\s+desc/i);
    expect(dataSQL).toMatch(/limit\s+\$\d+\s+offset\s+\$\d+/i);
    expect(dataParams).toEqual([5, "%abc%", "individual", "%Sam%", 10, 20]); // offset=(3-1)*10
  });

  test("listPhotos -> minimal (event only) paginates", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] });
    pool.query.mockResolvedValueOnce({ rows: [] });

    const out = await svc.listPhotos({ event_id: 1, page: 1, limit: 20 });
    expect(out).toEqual({ data: [], total: 0, page: 1, limit: 20 });

    const [countSQL, countParams] = pool.query.mock.calls[0];
    expect(countSQL).toMatch(/where\s+p\.event_id\s*=\s*\$1/i);
    // only the first param is used by COUNT (limit/offset appended after)
    expect(countParams.slice(0, 1)).toEqual([1]);

    const [dataSQL, dataParams] = pool.query.mock.calls[1];
    expect(dataSQL).toMatch(/limit\s+\$\d+\s+offset\s+\$\d+/i);
    expect(dataParams).toEqual([1, 20, 0]);
  });

  test("deletePhoto -> success", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    await expect(svc.deletePhoto(123)).resolves.toBeUndefined();

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/delete\s+from\s+photos/i);
    expect(params).toEqual([123]);
  });

  test("deletePhoto -> 404 when not found", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    await expect(svc.deletePhoto(999)).rejects.toMatchObject({
      status: 404,
      message: "Photo not found",
    });
  });
});
