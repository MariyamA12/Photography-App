// src/services/parentStudentService.js
const pool = require('../config/db');

/**
 * Create a parent–student link and infer sibling/step-sibling relations.
 * @param {Object} params
 * @param {number} params.parent_id
 * @param {number} params.student_id
 * @param {'biological'|'step'} params.relationship_type
 * @returns {Object} The created link
 */
async function createLink({ parent_id, student_id, relationship_type }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validate parent is role='parent'
    const { rows: pRows } = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [parent_id]
    );
    if (!pRows.length || pRows[0].role !== 'parent') {
      const err = new Error('Parent user not found or invalid role');
      err.status = 404;
      throw err;
    }

    // 2. Validate student exists
    const { rows: sRows } = await client.query(
      'SELECT 1 FROM students WHERE id = $1',
      [student_id]
    );
    if (!sRows.length) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }

    // 3. Prevent duplicate mapping
    const { rows: dRows } = await client.query(
      'SELECT 1 FROM parent_student WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );
    if (dRows.length) {
      const err = new Error('Link already exists');
      err.status = 409;
      throw err;
    }

    // 4. Insert parent_student link
    await client.query(
      `INSERT INTO parent_student 
         (parent_id, student_id, relationship_type)
       VALUES ($1, $2, $3)`,
      [parent_id, student_id, relationship_type]
    );

    // 5. Infer sibling relations with other students of same parent
    const { rows: siblings } = await client.query(
      `SELECT student_id, relationship_type
         FROM parent_student
        WHERE parent_id = $1
          AND student_id <> $2`,
      [parent_id, student_id]
    );

    for (const { student_id: otherId, relationship_type: otherRel } of siblings) {
      // determine final relation_type
      const finalType =
        relationship_type === 'biological' && otherRel === 'biological'
          ? 'biological'
          : 'step';

      // canonical ordering to avoid duplicates
      const [s1, s2] =
        student_id < otherId
          ? [student_id, otherId]
          : [otherId, student_id];

      // upsert into sibling_relations
      await client.query(
        `INSERT INTO sibling_relations
           (student1_id, student2_id, relation_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (student1_id, student2_id)
           DO UPDATE
           SET relation_type = LEAST(
             EXCLUDED.relation_type, 
             sibling_relations.relation_type
           )`,
        [s1, s2, finalType]
      );
    }

    await client.query('COMMIT');
    return { parent_id, student_id, relationship_type };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete a parent–student link and clean up sibling relations.
 * @param {number} parent_id
 * @param {number} student_id
 */
async function deleteLink(parent_id, student_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete parent_student mapping
    const delRes = await client.query(
      `DELETE FROM parent_student 
         WHERE parent_id = $1 
           AND student_id = $2`,
      [parent_id, student_id]
    );
    if (!delRes.rowCount) {
      const err = new Error('Link not found');
      err.status = 404;
      throw err;
    }

    // 2. Recalculate sibling relations for remaining students of this parent
    const { rows: remaining } = await client.query(
      `SELECT student_id
         FROM parent_student
        WHERE parent_id = $1`,
      [parent_id]
    );

    for (const { student_id: otherId } of remaining) {
      // order pair
      const [s1, s2] =
        student_id < otherId
          ? [student_id, otherId]
          : [otherId, student_id];

      // check if any common parent remains linking these two
      const { rows: common } = await client.query(
        `SELECT 1
           FROM parent_student ps1
           JOIN parent_student ps2
             ON ps1.parent_id = ps2.parent_id
          WHERE ps1.student_id = $1 
            AND ps2.student_id = $2`,
        [s1, s2]
      );

      if (!common.length) {
        // no shared parent → remove relation
        await client.query(
          `DELETE FROM sibling_relations 
             WHERE student1_id = $1 
               AND student2_id = $2`,
          [s1, s2]
        );
      } else {
        // recompute strongest relation type among shared parent mappings
        const { rows: rels } = await client.query(
          `SELECT ps1.relationship_type
             FROM parent_student ps1
             JOIN parent_student ps2
               ON ps1.parent_id = ps2.parent_id
            WHERE ps1.student_id = $1 
              AND ps2.student_id = $2`,
          [s1, s2]
        );
        const newType = rels.every(r => r.relationship_type === 'step')
          ? 'step'
          : 'biological';
        await client.query(
          `UPDATE sibling_relations
              SET relation_type = $3
            WHERE student1_id = $1
              AND student2_id = $2`,
          [s1, s2, newType]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List parent-student links with optional filters and pagination.
 * Supports filtering by relationship_type.
 *
 * @param {Object} params
 * @param {string} params.parentName
 * @param {string} params.studentName
 * @param {number} params.schoolId
 * @param {'biological'|'step'} params.relationshipType
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {{ data: Array, total: number }}
 */
async function listLinks({
  parentName = '',
  studentName = '',
  schoolId,
  relationshipType,
  page = 1,
  limit = 10,
}) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (parentName) {
    clauses.push(`u.name ILIKE $${idx}`);
    params.push(`%${parentName}%`);
    idx++;
  }
  if (studentName) {
    clauses.push(`s.name ILIKE $${idx}`);
    params.push(`%${studentName}%`);
    idx++;
  }
  if (schoolId) {
    clauses.push(`s.school_id = $${idx}`);
    params.push(schoolId);
    idx++;
  }
  if (relationshipType) {
    clauses.push(`ps.relationship_type = $${idx}`);
    params.push(relationshipType);
    idx++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      ps.parent_id,
      u.name         AS parent_name,
      u.email        AS email,
      ps.student_id,
      s.name         AS student_name,
      s.class_name,
      ps.relationship_type,
      COUNT(*) OVER() AS total
    FROM parent_student ps
    JOIN users u    ON u.id = ps.parent_id
    JOIN students s ON s.id = ps.student_id
    ${where}
    ORDER BY u.name, s.name
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  const total = rows.length ? parseInt(rows[0].total, 10) : 0;
  return { data: rows, total };
}

module.exports = {
  createLink,
  deleteLink,
  listLinks,
};
