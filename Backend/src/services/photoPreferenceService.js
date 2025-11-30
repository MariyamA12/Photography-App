const pool = require('../config/db');

/**
 * Insert one photo preference record.
 */
async function createPhotoPreference({
  eventId,
  parentId,
  studentId,
  preferenceType,
  extraStudentIds,
}) {
  const { rows } = await pool.query(
    `INSERT INTO photo_preferences
       (event_id, parent_id, student_id, preference_type, extra_student_ids)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      eventId,
      parentId,
      studentId,
      preferenceType,
      // Postgres will accept null for the array if undefined
      Array.isArray(extraStudentIds) ? extraStudentIds : null
    ]
  );
  return rows[0];
}

module.exports = { createPhotoPreference };
