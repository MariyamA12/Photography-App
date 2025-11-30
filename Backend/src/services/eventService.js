// src/services/eventService.js
const pool = require("../config/db");

/**
 * Create a new event.
 */
async function createEvent({
  name,
  description,
  event_date,
  school_id,
  photographer_id,
  created_by,
}) {
  const { rows } = await pool.query(
    `INSERT INTO events
       (name, description, event_date, school_id, photographer_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      name,
      description,
      event_date,
      school_id,
      photographer_id || null,
      created_by,
    ]
  );
  return rows[0];
}

/**
 * Retrieve a paginated list of events with optional filters.
 * Honors photographer_id, school_id, search, date range, sort, and includeExpired.
 */
async function getFilteredEvents({
  photographer_id,
  school_id,
  search,
  start_date,
  end_date,
  sort_asc = true,
  includeExpired = false,
  page = 1,
  limit = 10,
}) {
  const clauses = [];
  const values = [];
  let idx = 1;

  // Only this photographer’s events
  if (photographer_id) {
    clauses.push(`photographer_id = $${idx++}`);
    values.push(photographer_id);
  }

  if (school_id) {
    clauses.push(`school_id = $${idx++}`);
    values.push(school_id);
  }

  if (search) {
    clauses.push(`name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  if (start_date) {
    clauses.push(`event_date::date >= $${idx++}`);
    values.push(start_date);
  }
  if (end_date) {
    clauses.push(`event_date::date <= $${idx++}`);
    values.push(end_date);
  }

  // Exclude past events unless requested
  if (!includeExpired) {
    clauses.push(`event_date::date >= CURRENT_DATE`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // Pagination
  const offset = (page - 1) * limit;
  values.push(limit, offset);

  // Dynamic sort direction
  const direction = sort_asc ? "ASC" : "DESC";

  const sql = `
    SELECT
      *,
      notify_photographer_button_sent,
      notify_photographer_button_sent_at,
      notify_photographer_job_sent,
      notify_photographer_job_sent_at,
      notify_parents_button_sent,
      notify_parents_button_sent_at,
      notify_parents_job_sent,
      notify_parents_job_sent_at
    FROM events
    ${where}
    ORDER BY event_date ${direction}
    LIMIT $${idx++} OFFSET $${idx}
  `;

  const { rows, rowCount } = await pool.query(sql, values);
  return {
    data: rows,
    total: rowCount,
    page,
    limit,
  };
}

/**
 * Retrieve a single event by ID.
 * Includes notification flags and timestamps.
 */
async function getEventById(id) {
  const { rows } = await pool.query(
    `SELECT
       *,
       notify_photographer_button_sent,
       notify_photographer_button_sent_at,
       notify_photographer_job_sent,
       notify_photographer_job_sent_at,
       notify_parents_button_sent,
       notify_parents_button_sent_at,
       notify_parents_job_sent,
       notify_parents_job_sent_at
     FROM events
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update an event’s fields.
 */
async function updateEvent(id, fields) {
  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${idx++}`);
    values.push(value);
  }
  values.push(id);

  const query = `
    UPDATE events
       SET ${sets.join(", ")}
     WHERE id = $${idx}
     RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Delete an event.
 */
async function deleteEvent(id) {
  await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
}

/**
 * Fetch events assigned to a photographer.
 */
async function getEventsByPhotographer(photographer_id) {
  const { rows } = await pool.query(
    `SELECT * FROM events
     WHERE photographer_id = $1
     ORDER BY event_date DESC`,
    [photographer_id]
  );
  return rows;
}

/**
 * Fetch events relevant to a parent via their linked students’ schools.
 */
async function getEventsForParent(parent_id) {
  const { rows } = await pool.query(
    `SELECT DISTINCT e.*
       FROM events e
       JOIN students s        ON s.school_id    = e.school_id
       JOIN parent_student ps ON ps.student_id  = s.id
      WHERE ps.parent_id = $1
      ORDER BY e.event_date DESC`,
    [parent_id]
  );
  return rows;
}

/**
 * Fetch paginated list of participants for an event.
 */
async function getEventParticipants(
  eventId,
  { studentName = "", parentName = "", relationType, page = 1, limit = 10 }
) {
  const clauses = ["e.id = $1"];
  const params = [eventId];
  let idx = 2;

  if (studentName) {
    clauses.push(`s.name ILIKE $${idx}`);
    params.push(`%${studentName}%`);
    idx++;
  }
  if (parentName) {
    clauses.push(`u.name ILIKE $${idx}`);
    params.push(`%${parentName}%`);
    idx++;
  }
  if (relationType) {
    clauses.push(`ps.relationship_type = $${idx}`);
    params.push(relationType);
    idx++;
  }

  const where = `WHERE ${clauses.join(" AND ")}`;
  const limitIdx = idx++;
  const offsetIdx = idx++;
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const sql = `
    SELECT
      s.id                AS student_id,
      s.name              AS student_name,
      s.class_name        AS class_name,
      sc.name             AS school_name,
      u.id                AS parent_id,
      u.name              AS parent_name,
      u.email             AS parent_email, 
      ps.relationship_type
    FROM events e
    JOIN students s        ON s.school_id   = e.school_id
    JOIN schools sc        ON sc.id         = s.school_id
    JOIN parent_student ps ON ps.student_id = s.id
    JOIN users u           ON u.id          = ps.parent_id
    ${where}
    ORDER BY s.name, u.name
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const { rows, rowCount } = await pool.query(sql, params);
  return { data: rows, total: rowCount, page, limit };
}

/**
 * Mark photographer alert sent via button.
 */
async function markPhotographerSentByButton(eventId) {
  const { rows } = await pool.query(
    `UPDATE events
       SET notify_photographer_button_sent = TRUE,
           notify_photographer_button_sent_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [eventId]
  );
  return rows[0];
}

/**
 * Mark parents alert sent via button.
 */
async function markParentsSentByButton(eventId) {
  const { rows } = await pool.query(
    `UPDATE events
       SET notify_parents_button_sent = TRUE,
           notify_parents_button_sent_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [eventId]
  );
  return rows[0];
}

/**
 * Mark photographer alert sent via cron job.
 */
async function markPhotographerSentByJob(eventId) {
  const { rows } = await pool.query(
    `UPDATE events
       SET notify_photographer_job_sent = TRUE,
           notify_photographer_job_sent_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [eventId]
  );
  return rows[0];
}

/**
 * Mark parents alert sent via cron job.
 */
async function markParentsSentByJob(eventId) {
  const { rows } = await pool.query(
    `UPDATE events
       SET notify_parents_job_sent = TRUE,
           notify_parents_job_sent_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [eventId]
  );
  return rows[0];
}

/**
 * List events exactly `daysOut` days away that still need job alerts.
 */
async function listUpcomingEventsForJob(daysOut = 7) {
  const { rows } = await pool.query(
    `SELECT * FROM events
     WHERE event_date::date = CURRENT_DATE + $1 * INTERVAL '1 day'
       AND (
         notify_photographer_job_sent = FALSE
         OR notify_parents_job_sent = FALSE
       )`,
    [daysOut]
  );
  return rows;
}

module.exports = {
  createEvent,
  getFilteredEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByPhotographer,
  getEventsForParent,
  getEventParticipants,
  markPhotographerSentByButton,
  markParentsSentByButton,
  markPhotographerSentByJob,
  markParentsSentByJob,
  listUpcomingEventsForJob,
};
