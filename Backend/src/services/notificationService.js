// src/services/notificationService.js
const pool = require('../config/db');

/**
 * Log a notification in the database.
 */
async function logNotification({ userId, eventId, type, message, deliveryType = 'email' }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications_sent
         (user_id, event_id, type, message, delivery_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, event_id, type) DO NOTHING
       RETURNING *`,
      [userId, eventId, type, message, deliveryType]
    );
    if (rows[0]) {
      const r = rows[0];
      console.log('[NotificationService] Logged →', {
        id:       r.id,
        userId:   r.user_id,
        eventId:  r.event_id,
        type:     r.type,
        delivery: r.delivery_type,
        sentAt:   r.sent_at.toISOString(),
      });
    }
  } catch (err) {
    console.error('[NotificationService] Error:', err);
  }
}

/**
 * Admin: fetch all notifications with filters & pagination.
 */
async function getAdminNotifications({
  type,
  recipientRole,
  eventId,
  schoolId,
  from,
  to,
  page = 1,
  limit = 10,
}) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (type) {
    clauses.push(`ns.type = $${idx++}`);
    params.push(type);
  }
  if (recipientRole) {
    clauses.push(`u.role = $${idx++}`);
    params.push(recipientRole);
  }
  if (eventId) {
    clauses.push(`ns.event_id = $${idx++}`);
    params.push(eventId);
  }
  if (schoolId) {
    clauses.push(`e.school_id = $${idx++}`);
    params.push(schoolId);
  }
  if (from) {
    clauses.push(`ns.sent_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    clauses.push(`ns.sent_at <= $${idx++}`);
    params.push(to);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  // total count
  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
       FROM notifications_sent ns
       JOIN users u ON u.id = ns.user_id
       JOIN events e ON e.id = ns.event_id
     ${where}`,
    params
  );
  const total = totalRows[0].total;

  // pagination
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const { rows } = await pool.query(
    `
    SELECT
      ns.id,
      u.id   AS "userId",
      u.name AS "userName",
      u.role AS "userRole",
      ns.event_id       AS "eventId",
      e.name            AS "eventName",
      e.school_id       AS "schoolId",
      s.name            AS "schoolName",
      ns.type,
      ns.message,
      ns.delivery_type  AS "deliveryType",
      ns.sent_at        AS "sentAt"
    FROM notifications_sent ns
    JOIN users u ON u.id = ns.user_id
    JOIN events e ON e.id = ns.event_id
    JOIN schools s ON s.id = e.school_id
    ${where}
    ORDER BY ns.sent_at DESC
    LIMIT   $${idx++}
    OFFSET  $${idx}
    `,
    params
  );

  const subjectMap = {
    preference_request:     'Photo Preference Request for',
    photographer_assignment: 'Photographer Assignment:',
  };

  const data = rows.map(r => ({
    ...r,
    subject: `${subjectMap[r.type] || r.type} ${r.eventName}`,
  }));

  return { data, total, page, limit };
}

/**
 * Parent/Photographer: fetch own notifications (paginated).
 */
async function getUserNotifications({ userId, page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
       FROM notifications_sent
       WHERE user_id = $1`,
    [userId]
  );
  const total = totalRows[0].total;

  const { rows } = await pool.query(
    `
    SELECT
      id,
      event_id AS "eventId",
      type,
      message,
      sent_at  AS "sentAt"
    FROM notifications_sent
    WHERE user_id = $1
    ORDER BY sent_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { data: rows, total, page, limit };
}

module.exports = {
  logNotification,
  getAdminNotifications,
  getUserNotifications,
};
