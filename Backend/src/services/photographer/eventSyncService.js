// src/services/photographer/eventSyncService.js
const pool = require("../../config/db");
const { getEventById } = require("../eventService");

/**
 * Fetch all event data needed for offline sync by a specific photographer.
 */
async function syncEventData(eventId, photographerId) {
  const ev = await getEventById(eventId);
  if (!ev) throw { status: 404, message: "Event not found" };
  if (ev.photographer_id !== photographerId) {
    throw { status: 403, message: "Forbidden: not your event" };
  }

  const { rows: schoolRows } = await pool.query(
    "SELECT id, name FROM schools WHERE id = $1",
    [ev.school_id]
  );
  const school = schoolRows[0] || { id: ev.school_id, name: null };

  const { rows: students } = await pool.query(
    `SELECT id, name, class_name
       FROM students
      WHERE school_id = $1
      ORDER BY name`,
    [ev.school_id]
  );

  const { rows: qr_codes } = await pool.query(
    `SELECT
       q.id,
       q.code,
       q.photo_type,
       q.image_url,
       q.student_ids,
       COALESCE(sub.students, '[]') AS students
     FROM qrcodes q
     LEFT JOIN (
       SELECT qr.id AS qr_id,
              jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name))
                AS students
         FROM qrcodes qr
         CROSS JOIN LATERAL unnest(qr.student_ids) AS sid
         JOIN students s ON s.id = sid
        WHERE qr.event_id = $1
        GROUP BY qr.id
     ) sub ON sub.qr_id = q.id
     WHERE q.event_id = $1
     ORDER BY q.id`,
    [eventId]
  );

  const { rows: photo_preferences } = await pool.query(
    `SELECT id, student_id, extra_student_ids, preference_type
       FROM photo_preferences
      WHERE event_id = $1`,
    [eventId]
  );

  return {
    event: {
      id: ev.id,
      name: ev.name,
      event_date: ev.event_date,
      is_finished: ev.is_finished,
      school: { id: school.id, name: school.name },
    },
    students,
    qr_codes,
    photo_preferences,
  };
}

/**
 * Merge photo_sessions, QR-code scans, and attendance from mobile.
 * Upserts one attendance row per session (no more photo_name/temp_photo_name).
 */
async function syncUpload(eventId, photographerId, sessions) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalSessions = 0;
    const qrToUpdate = new Set();

    for (const s of sessions) {
      // 1) Upsert into photo_sessions (no temp_photo_name)
      const { rows } = await client.query(
        `INSERT INTO photo_sessions
           (event_id, qrcode_id, photographer_id, photo_type, student_ids, created_at, uploaded)
         VALUES ($1,$2,$3,$4,$5,$6, TRUE)
         ON CONFLICT(event_id, qrcode_id)
         DO UPDATE SET
           student_ids     = EXCLUDED.student_ids,
           photographer_id = EXCLUDED.photographer_id,
           photo_type      = EXCLUDED.photo_type,
           created_at      = EXCLUDED.created_at,
           uploaded        = TRUE
         RETURNING id, qrcode_id, student_ids, photo_type;`,
        [
          eventId,
          s.qrcode_id || null,
          photographerId,
          s.photo_type,
          s.student_ids,
          s.timestamp,
        ]
      );
      const { id: sessionDbId, qrcode_id, student_ids, photo_type } = rows[0];
      totalSessions++;
      if (qrcode_id) qrToUpdate.add(qrcode_id);

      // 2) Upsert attendance (no photo_name)
      await client.query(
        `INSERT INTO attendance
           (event_id, photo_session_id, student_ids, status, marked_by, timestamp, qrcode_id, photo_type)
         VALUES
           ($1,$2,$3,'present',$4,$5,$6,$7)
         ON CONFLICT(event_id, photo_session_id)
         DO UPDATE SET
           student_ids = EXCLUDED.student_ids,
           status      = 'present',
           marked_by   = EXCLUDED.marked_by,
           timestamp   = EXCLUDED.timestamp,
           qrcode_id   = EXCLUDED.qrcode_id,
           photo_type  = EXCLUDED.photo_type;`,
        [
          eventId,
          sessionDbId,
          student_ids,
          photographerId,
          s.timestamp,
          qrcode_id,
          photo_type,
        ]
      );
    }

    // 3) Mark QR codes scanned
    for (const qrId of qrToUpdate) {
      await client.query(
        `UPDATE qrcodes
           SET is_scanned = TRUE,
               scanned_at = NOW(),
               scanned_by = $2
         WHERE id = $1;`,
        [qrId, photographerId]
      );
    }

    await client.query("COMMIT");

    // 4) (Optional) Debug log
    const { rows: debugRows } = await client.query(
      `SELECT * FROM attendance WHERE event_id = $1 ORDER BY timestamp`,
      [eventId]
    );
    console.log(`🧾 [ATTENDANCE rows for event ${eventId}]:`, debugRows);

    return {
      totalSessions,
      qrcodesMarked: qrToUpdate.size,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { syncEventData, syncUpload };
