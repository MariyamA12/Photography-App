// src/services/userService.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_DAYS = 7;

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

async function createRefreshToken(userId) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );
  return token;
}

exports.loginUser = async ({ email, password }) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, password_hash AS password, role
     FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

exports.rotateRefreshToken = async (oldToken) => {
  const { rows } = await pool.query(
    `SELECT user_id, expires_at
     FROM refresh_tokens WHERE token = $1`,
    [oldToken]
  );
  if (!rows.length || rows[0].expires_at < new Date()) {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }
  const userId = rows[0].user_id;
  await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [oldToken]);
  const refreshToken = await createRefreshToken(userId);
  const { rows: urows } = await pool.query(
    `SELECT id, name, email, role FROM users WHERE id = $1`,
    [userId]
  );
  const user = urows[0];
  const accessToken = signAccessToken(user);
  return { accessToken, refreshToken, user };
};

exports.revokeRefreshToken = async (token) => {
  await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
};

exports.createUser = async ({ name, email, password, role }) => {
  const { rows: existing } = await pool.query(
    `SELECT 1 FROM users WHERE email = $1`,
    [email]
  );
  if (existing.length) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password_hash, role]
  );
  return rows[0];
};

/**
 * Fetch users with optional filters, sorting, and pagination.
 */
exports.getUsers = async ({ search = '', role = '', sort = 'newest', page = 1, limit = 10 } = {}) => {
  const pageInt  = parseInt(page, 10)  || 1;
  const limitInt = parseInt(limit, 10) || 10;

  const clauses = [`role != 'admin'`];
  const values = [];
  let idx = 1;

  if (search) {
    clauses.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }
  if (role) {
    clauses.push(`role = $${idx}`);
    values.push(role);
    idx++;
  }

  const where     = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const direction = sort === 'oldest' ? 'ASC' : 'DESC';

  // 1) total count
  const countQuery  = `SELECT COUNT(*) AS total FROM users ${where}`;
  const countResult = await pool.query(countQuery, values);
  const total       = parseInt(countResult.rows[0].total, 10);
  const totalPages  = Math.ceil(total / limitInt);

  // 2) paginated data
  const offset   = (pageInt - 1) * limitInt;
  const dataQuery = `
    SELECT id, name, email, role, created_at
    FROM users
    ${where}
    ORDER BY created_at ${direction}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  const dataValues = [...values, limitInt, offset];
  const { rows }   = await pool.query(dataQuery, dataValues);

  return { data: rows, total, page: pageInt, totalPages };
};

exports.updateUser = async (id, { name, email, password, role }) => {
  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND id <> $2`,
    [email, id]
  );
  if (existing.length) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;

  fields.push(`name = $${idx}`);  values.push(name);  idx++;
  fields.push(`email = $${idx}`); values.push(email); idx++;
  fields.push(`role = $${idx}`);  values.push(role);  idx++;

  if (password) {
    const password_hash = await bcrypt.hash(password, 10);
    fields.push(`password_hash = $${idx}`); values.push(password_hash); idx++;
  }

  values.push(id);
  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, name, email, role, created_at
  `;
  const { rows: updatedRows } = await pool.query(query, values);
  return updatedRows[0];
};

exports.deleteUser = async (id) => {
  await pool.query(
    `DELETE FROM users WHERE id = $1`,
    [id]
  );
};
