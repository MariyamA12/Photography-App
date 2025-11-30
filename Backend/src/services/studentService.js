const pool = require('../config/db');

async function getStudents({ search, sort, page = 1, limit = 10, schoolName, className, schoolId }) {
  // build base query with join to schools
  let base = `
    FROM students s
    LEFT JOIN schools sch ON s.school_id = sch.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  // name search
  if (search) {
    params.push(`%${search}%`);
    base += ` AND s.name ILIKE $${idx++}`;
  }
  // filter by school name
  if (schoolName) {
    params.push(`%${schoolName}%`);
    base += ` AND sch.name ILIKE $${idx++}`;
  }
  // filter by class_name
  if (className) {
    params.push(`%${className}%`);
    base += ` AND s.class_name ILIKE $${idx++}`;
  }
  // filter by school ID
  if (schoolId) {
    params.push(schoolId);
    base += ` AND s.school_id = $${idx++}`;
  }

  // total count
  const countRes = await pool.query(`SELECT COUNT(*) ${base}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // ordering
  const dir = sort === 'oldest' ? 'ASC' : 'DESC';

  // pagination
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // final data query
  const dataSql = `
    SELECT
      s.id,
      s.name,
      s.class_name,
      s.school_id,
      sch.name AS school_name,
      s.created_at
    ${base}
    ORDER BY s.created_at ${dir}
    LIMIT $${idx++}
    OFFSET $${idx}
  `;

  const dataRes = await pool.query(dataSql, params);

  return {
    data: dataRes.rows,
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

// other functions unchanged
async function getStudentById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, class_name, school_id, created_at FROM students WHERE id = $1',
    [id]
  );
  if (!rows.length) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function createStudent({ name, class_name, school_id }) {
  const { rows } = await pool.query(
    `INSERT INTO students (name, class_name, school_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, class_name, school_id, created_at`,
    [name, class_name, school_id || null]
  );
  return rows[0];
}

async function updateStudent(id, { name, class_name, school_id }) {
  await getStudentById(id);

  const fields = [];
  const params = [];
  let idx = 1;

  if (name !== undefined) {
    params.push(name);
    fields.push(`name = $${idx++}`);
  }
  if (class_name !== undefined) {
    params.push(class_name);
    fields.push(`class_name = $${idx++}`);
  }
  if (school_id !== undefined) {
    params.push(school_id);
    fields.push(`school_id = $${idx++}`);
  }
  if (!fields.length) {
    return getStudentById(id);
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE students
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, class_name, school_id, created_at`,
    params
  );
  return rows[0];
}

async function deleteStudent(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM students WHERE id = $1',
    [id]
  );
  if (!rowCount) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
