// tests/fixtures/helpers.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /sslmode=require/.test(process.env.DATABASE_URL || '')
    ? { require: true, rejectUnauthorized: false }
    : false,
});

async function resetDb() {
  // kept for legacy calls; perTestReset already truncates.
  try { await pool.query('TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE;'); } catch {}
  try { await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;'); } catch {}
}

async function seedUser({ name, email, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role`,
    [name, email, hash, role]
  );
  return rows[0];
}

module.exports = { pool, resetDb, seedUser };
