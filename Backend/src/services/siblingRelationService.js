// src/services/siblingRelationService.js
const pool = require('../config/db');

/**
 * Fetch paginated, filtered list of sibling relations.
 *
 * @param {Object} opts
 * @param {string} opts.studentName
 * @param {'biological'|'step'} opts.relationType
 * @param {number} opts.schoolId
 * @param {number} opts.page
 * @param {number} opts.limit
 * @returns {{ data: Array, total: number }}
 */
async function listSiblingRelations({
  studentName = '',
  relationType,
  schoolId,
  page = 1,
  limit = 10,
}) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (studentName) {
    // match either student1 or student2
    clauses.push(`
      (s1.name ILIKE $${idx} OR s2.name ILIKE $${idx})
    `);
    params.push(`%${studentName}%`);
    idx++;
  }
  if (relationType) {
    clauses.push(`sr.relation_type = $${idx}`);
    params.push(relationType);
    idx++;
  }
  if (schoolId) {
    clauses.push(`
      (s1.school_id = $${idx} OR s2.school_id = $${idx})
    `);
    params.push(schoolId);
    idx++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      sr.student1_id,
      s1.name       AS student1_name,
      s1.class_name AS class1,
      s1.school_id  AS school1,

      sr.student2_id,
      s2.name       AS student2_name,
      s2.class_name AS class2,
      s2.school_id  AS school2,

      sr.relation_type,
      COUNT(*) OVER() AS total
    FROM sibling_relations sr
    JOIN students s1 ON sr.student1_id = s1.id
    JOIN students s2 ON sr.student2_id = s2.id
    ${where}
    ORDER BY s1.name, s2.name
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  const total = rows.length ? parseInt(rows[0].total, 10) : 0;
  return { data: rows, total };
}

module.exports = { listSiblingRelations };
