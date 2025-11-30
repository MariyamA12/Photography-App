// src/services/photoService.js
const pool = require("../config/db");

/**
 * List photos for an event with optional filters & pagination.
 */
async function listPhotos({ event_id, searchName, studentName, photoType, page = 1, limit = 20 }) {
  const clauses = ["p.event_id = $1"];
  const params = [event_id];
  let idx = 2;

  if (searchName) {
    clauses.push(`p.file_name ILIKE $${idx++}`);
    params.push(`%${searchName}%`);
  }
  if (photoType) {
    clauses.push(`p.photo_type = $${idx++}`);
    params.push(photoType);
  }
  if (studentName) {
    clauses.push(`EXISTS (
      SELECT 1 FROM photo_students ps2
      JOIN students s2 ON s2.id = ps2.student_id
      WHERE ps2.photo_id = p.id AND s2.name ILIKE $${idx++}
    )`);
    params.push(`%${studentName}%`);
  }

  const whereSQL = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // Total count
  const { rows: [countRow] } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM photos p ${whereSQL}`,
    params
  );
  const total = countRow.total;

  // Pagination
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // Data
  const { rows: data } = await pool.query(
    `SELECT
       p.photo_session_id,
       p.id,
       p.file_name,
       p.file_url,
       p.photo_type,
       p.added_by,
       p.added_at,
       COALESCE(stu.student_ids,   ARRAY[]::int[])   AS student_ids,
       COALESCE(stu.student_names, ARRAY[]::text[]) AS student_names
     FROM photos p
     LEFT JOIN LATERAL (
       SELECT
         array_agg(ps3.student_id ORDER BY ps3.student_id)   AS student_ids,
         array_agg(s3.name          ORDER BY s3.name)        AS student_names
       FROM photo_students ps3
       JOIN students s3 ON s3.id = ps3.student_id
      WHERE ps3.photo_id = p.id
     ) AS stu ON TRUE
     ${whereSQL}
     ORDER BY p.added_at DESC
     LIMIT $${idx++} OFFSET $${idx}
    `,
    params
  );

  return { data, total, page, limit };
}

/**
 * Delete a photo (and cascades photo_students if set).
 */
async function deletePhoto(photoId) {
  const { rowCount } = await pool.query(
    `DELETE FROM photos WHERE id = $1`,
    [photoId]
  );
  if (rowCount === 0) {
    const err = new Error("Photo not found");
    err.status = 404;
    throw err;
  }
}

module.exports = {
  listPhotos,
  deletePhoto,
};
