jest.mock("../../../src/config/db", () => ({ query: jest.fn() }));
 
const pool = require("../../../src/config/db");
const svc = require("../../../src/services/eventService");
 
describe("eventService (unit, DB mocked)", () => {
  beforeEach(() => jest.clearAllMocks());
 
  test("createEvent -> inserts and returns created row", async () => {
    const created = {
      id: 42,
      name: "Photo Day",
      description: "desc",
      event_date: "2025-10-01",
      school_id: 3,
      photographer_id: 9,
      created_by: 1,
    };
    pool.query.mockResolvedValueOnce({ rows: [created] });
 
    const out = await svc.createEvent(created);
    expect(out).toEqual(created);
 
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/insert\s+into\s+events/i);
    expect(sql).toMatch(/returning\s+\*/i);
    expect(params).toEqual([
      created.name,
      created.description,
      created.event_date,
      created.school_id,
      created.photographer_id,
      created.created_by,
    ]);
  });
 
  test("getFilteredEvents -> builds filters, pagination, sort & excludes expired by default", async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    pool.query.mockResolvedValueOnce({ rows, rowCount: rows.length });
 
    const out = await svc.getFilteredEvents({
      photographer_id: 11,
      school_id: 3,
      search: "day",
      start_date: "2025-10-01",
      end_date: "2025-10-31",
      sort_asc: false,
      includeExpired: false,
      page: 2,
      limit: 5,
    });
 
    expect(out).toEqual({ data: rows, total: 2, page: 2, limit: 5 });
 
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/from\s+events/i);
    expect(sql).toMatch(/photographer_id\s*=\s*\$\d+/i);
    expect(sql).toMatch(/school_id\s*=\s*\$\d+/i);
    expect(sql).toMatch(/name\s+ilike\s*\$\d+/i);
    expect(sql).toMatch(/event_date::date\s*>=\s*\$\d+/i);
    expect(sql).toMatch(/event_date::date\s*<=\s*\$\d+/i);
    expect(sql).toMatch(/event_date::date\s*>=\s*current_date/i); // exclude past
    expect(sql).toMatch(/order\s+by\s+event_date\s+desc/i);
    expect(sql).toMatch(/limit\s+\$\d+\s+offset\s+\$\d+/i);
 
    expect(params).toEqual([
      11,               // photographer_id
      3,                // school_id
      "%day%",          // search
      "2025-10-01",     // start_date
      "2025-10-31",     // end_date
      5,                // limit
      5,                // offset = (page-1)*limit = 5
    ]);
  });
 
  test("getEventById -> returns row or null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 77, name: "E" }] });
    expect(await svc.getEventById(77)).toEqual({ id: 77, name: "E" });
 
    pool.query.mockResolvedValueOnce({ rows: [] });
    expect(await svc.getEventById(999)).toBeNull();
 
    const [, params] = pool.query.mock.calls[1];
    expect(params).toEqual([999]);
  });
 
  test("updateEvent -> dynamic SET and returns updated row", async () => {
    const updated = { id: 10, name: "Picnic", school_id: 3 };
    pool.query.mockResolvedValueOnce({ rows: [updated] });
 
    const out = await svc.updateEvent(10, { name: "Picnic", school_id: 3 });
    expect(out).toEqual(updated);
 
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/update\s+events/i);
    // allow newlines between SET ... WHERE
    expect(sql).toMatch(/set[\s\S]+where\s+id\s*=\s*\$\d+/i);
    expect(sql).toMatch(/name\s*=\s*\$1/i);
    expect(sql).toMatch(/school_id\s*=\s*\$2/i);
    expect(sql).toMatch(/where\s+id\s*=\s*\$3/i);
    expect(sql).toMatch(/returning\s+\*/i);
    expect(params).toEqual(["Picnic", 3, 10]);
  });
 
  test("deleteEvent -> issues delete with id", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await svc.deleteEvent(5);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/delete\s+from\s+events/i);
    expect(params).toEqual([5]);
  });
 
  test("getEventParticipants -> builds where + pagination", async () => {
    const rows = [
      {
        student_id: 1,
        student_name: "A",
        parent_id: 10,
        parent_name: "P",
        relation_type: "biological",
      },
    ];
    pool.query.mockResolvedValueOnce({ rows, rowCount: rows.length });
 
    const out = await svc.getEventParticipants(9, {
      studentName: "A",
      parentName: "P",
      relationType: "biological",
      page: 3,
      limit: 20,
    });
 
    expect(out).toEqual({ data: rows, total: 1, page: 3, limit: 20 });
 
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/from\s+events\s+e\s+join\s+students/i);
    expect(sql).toMatch(/u\.name\s+ilike/i);
    expect(sql).toMatch(/ps\.relationship_type\s*=\s*\$\d+/i);
    expect(sql).toMatch(/limit\s+\$\d+\s+offset\s+\$\d+/i);
 
    // params should be: [eventId, '%student%', '%parent%', 'relation', limit, offset]
    expect(params).toEqual([9, "%A%", "%P%", "biological", 20, 40]);
  });
 
  test("listUpcomingEventsForJob -> passes daysOut as param", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const out = await svc.listUpcomingEventsForJob(7);
    expect(out).toEqual([{ id: 1 }]);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/current_date\s*\+\s*\$1\s*\*\s*interval/i);
    expect(params).toEqual([7]);
  });
 
  test("markPhotographerSentByButton -> updates flags and returns row", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 2, notify_photographer_button_sent: true }],
    });
    const out = await svc.markPhotographerSentByButton(2);
    expect(out).toMatchObject({ id: 2, notify_photographer_button_sent: true });
 
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/update\s+events/i);
    expect(sql).toMatch(/notify_photographer_button_sent\s*=\s*true/i);
    expect(params).toEqual([2]);
  });
});