// src/services/schoolService.js
const pool = require('../config/db');

async function getSchools({ search, sort }) {
  let query = 'SELECT id, name, address, created_at FROM schools';
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    query += ` WHERE name ILIKE $${params.length}`;
  }
  const direction = sort === 'oldest' ? 'ASC' : 'DESC';
  query += ` ORDER BY created_at ${direction}`;
  const { rows } = await pool.query(query, params);
  return rows;
}

async function getSchoolById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, address, created_at FROM schools WHERE id = $1',
    [id]
  );
  if (!rows.length) {
    const err = new Error('School not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function createSchool({ name, address }) {
  const { rows: existing } = await pool.query(
    'SELECT id FROM schools WHERE name = $1',
    [name]
  );
  if (existing.length) {
    const err = new Error('School already exists');
    err.status = 409;
    throw err;
  }
  const { rows } = await pool.query(
    `INSERT INTO schools (name, address)
     VALUES ($1, $2)
     RETURNING id, name, address, created_at`,
    [name, address || null]
  );
  return rows[0];
}

async function updateSchool(id, { name, address }) {
  // ensure it exists (throws 404 if not)
  await getSchoolById(id);

  const fields = [];
  const params = [];
  let idx = 1;

  if (name !== undefined) {
    params.push(name);
    fields.push(`name = $${idx++}`);
  }
  if (address !== undefined) {
    params.push(address);
    fields.push(`address = $${idx++}`);
  }
  if (!fields.length) {
    return getSchoolById(id);
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE schools
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, address, created_at`,
    params
  );
  return rows[0];
}

async function deleteSchool(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM schools WHERE id = $1',
    [id]
  );
  if (!rowCount) {
    const err = new Error('School not found');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
};
