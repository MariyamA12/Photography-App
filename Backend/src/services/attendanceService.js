// src/services/attendanceService.js
const pool = require('../config/db');

/**
 * Returns paginated attendance records, unpacking student_ids arrays into
 * student_names and class_names arrays for both individual and group sessions,
 * and including photo_session_id for frontend mapping.
 */
async function getFilteredAttendance({
  event_id,
  school_id,
  student_name,
  photographer_id,
  photo_type,
  class_name,
  presence,
  is_random,
  date_from,
  date_to,
  page = 1,
  limit = 10,
}) {
  const where = [];
  const params = [];
  let idx = 1;

  // required filter
  if (event_id) {
    where.push(`att.event_id = $${idx}::int`);
    params.push(event_id);
    idx++;
  }

  // optional filters
  if (school_id) {
    where.push(`sc.id = $${idx}::int`);
    params.push(school_id);
    idx++;
  }
  if (student_name) {
    where.push(`stu.names::text ILIKE $${idx}`);
    params.push(`%${student_name}%`);
    idx++;
  }
  if (class_name) {
    where.push(`stu.classes::text ILIKE $${idx}`);
    params.push(`%${class_name}%`);
    idx++;
  }
  if (photographer_id) {
    where.push(`u.id = $${idx}::int`);
    params.push(photographer_id);
    idx++;
  }
  if (photo_type) {
    where.push(`att.photo_type = $${idx}`);
    params.push(photo_type);
    idx++;
  }
  if (presence) {
    where.push(`att.status = $${idx}`);
    params.push(presence);
    idx++;
  }
  if (is_random !== undefined) {
    if (`${is_random}` === 'true') {
      where.push(`att.qrcode_id IS NULL`);
    } else {
      where.push(`att.qrcode_id IS NOT NULL`);
    }
  }
  if (date_from) {
    where.push(`att.timestamp::date >= $${idx}::date`);
    params.push(date_from);
    idx++;
  }
  if (date_to) {
    where.push(`att.timestamp::date <= $${idx}::date`);
    params.push(date_to);
    idx++;
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // total count
  const countSQL = `
    SELECT COUNT(*)::int AS total
      FROM attendance att
      JOIN photo_sessions ps   ON ps.id = att.photo_session_id
      JOIN students s          ON s.id = ps.student_ids[1]
      JOIN schools sc          ON sc.id = s.school_id
      LEFT JOIN users u        ON u.id = att.marked_by
    ${whereSQL}
  `;
  const { rows: [countRow] } = await pool.query(countSQL, params);
  const total = countRow.total;

  // pagination
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // data query, now with photo_session_id but no photo_name
  const dataSQL = `
    SELECT
      att.photo_session_id,      -- session ID
      att.id                    AS attendance_id,
      att.student_ids           AS student_ids,
      stu.names                 AS student_names,
      stu.classes               AS class_names,
      sc.id                     AS school_id,
      e.id                      AS event_id,
      e.name                    AS event_name,
      att.status,
      att.timestamp             AS marked_at,
      att.photo_type,
      att.qrcode_id,
      u.id                      AS photographer_id,
      u.name                    AS photographer_name
    FROM attendance att
    JOIN photo_sessions ps      ON ps.id = att.photo_session_id
    JOIN events e               ON e.id = att.event_id
    JOIN students s             ON s.id = ps.student_ids[1]
    JOIN schools sc             ON sc.id = s.school_id
    LEFT JOIN users u           ON u.id = att.marked_by

    LEFT JOIN LATERAL (
      SELECT
        array_agg(s2.name ORDER BY s2.name)       AS names,
        array_agg(s2.class_name ORDER BY s2.name) AS classes
      FROM unnest(att.student_ids) AS sid
      JOIN students s2 ON s2.id = sid
    ) AS stu ON TRUE

    ${whereSQL}
    ORDER BY att.timestamp DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const { rows: data } = await pool.query(dataSQL, params);
  return { data, total };
}

module.exports = { getFilteredAttendance };
