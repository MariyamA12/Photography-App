// src/services/parents/photoService.js

const pool = require('../../config/db');

/**
 * Returns paginated photos belonging to a parent's children, with optional filters.
 */
async function getPhotosForParent(
  parentId,
  { event_name, photo_type, student_name, from_date, to_date, page = 1, limit = 10 }
) {
  const where = ['pst.parent_id = $1'];
  const params = [parentId];
  let idx = 2;

  if (event_name) {
    where.push(`e.name ILIKE $${idx}`);
    params.push(`%${event_name}%`);
    idx++;
  }
  if (photo_type) {
    where.push(`p.photo_type = $${idx}`);
    params.push(photo_type);
    idx++;
  }
  if (student_name) {
    where.push(`s.name ILIKE $${idx}`);
    params.push(`%${student_name}%`);
    idx++;
  }
  if (from_date) {
    where.push(`p.added_at::date >= $${idx}::date`);
    params.push(from_date);
    idx++;
  }
  if (to_date) {
    where.push(`p.added_at::date <= $${idx}::date`);
    params.push(to_date);
    idx++;
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // total count
  const countSQL = `
    SELECT COUNT(DISTINCT p.id)::int AS total
      FROM photos p
      JOIN photo_students ps  ON ps.photo_id = p.id
      JOIN students s         ON s.id = ps.student_id
      JOIN parent_student pst ON pst.student_id = s.id
      JOIN events e           ON e.id = p.event_id
    ${whereSQL}
  `;
  const { rows: [countRow] } = await pool.query(countSQL, params);
  const total = countRow.total;

  // paging
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // data page
  const dataSQL = `
    SELECT
      p.id,
      p.file_name,
      p.file_url,
      p.photo_type,
      p.added_at,
      array_agg(DISTINCT s.name) AS student_names
    FROM photos p
    JOIN photo_students ps  ON ps.photo_id = p.id
    JOIN students s         ON s.id = ps.student_id
    JOIN parent_student pst ON pst.student_id = s.id
    JOIN events e           ON e.id = p.event_id
    ${whereSQL}
    GROUP BY p.id
    ORDER BY p.added_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  const { rows: data } = await pool.query(dataSQL, params);

  return { data, total };
}

module.exports = { getPhotosForParent };
