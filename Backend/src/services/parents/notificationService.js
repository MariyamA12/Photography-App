// src/services/parent/notificationService.js
const pool = require('../../config/db');

/**
 * Fetch paginated notifications for a parent with optional filters.
 */
async function getParentNotifications({ userId, type, from, to, page = 1, limit = 10 }) {
  const clauses = ['ns.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type) {
    clauses.push(`ns.type = $${idx++}`);
    params.push(type);
  }
  if (from) {
    clauses.push(`ns.sent_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    clauses.push(`ns.sent_at <= $${idx++}`);
    params.push(to);
  }

  const where = `WHERE ${clauses.join(' AND ')}`;

  // Total count
  const countRes = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications_sent ns ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  // Pagination
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataRes = await pool.query(
    `
    SELECT
      ns.id,
      ns.event_id,
      e.name AS event_name,
      ns.type,
      ns.message,
      ns.sent_at
    FROM notifications_sent ns
    JOIN events e ON e.id = ns.event_id
    ${where}
    ORDER BY ns.sent_at DESC
    LIMIT $${idx++} OFFSET $${idx}
    `,
    params
  );

  const subjectMap = {
    preference_request: 'Photo Preference Request for',
    // add more parent-specific types here if needed
  };

  const data = dataRes.rows.map(r => ({
    id:        r.id,
    eventId:   r.event_id,
    eventName: r.event_name,
    type:      r.type,
    subject:   `${subjectMap[r.type] || r.type} ${r.event_name}`,
    message:   r.message,
    sentAt:    r.sent_at,
  }));

  return { data, total, page, limit };
}

module.exports = { getParentNotifications };
