// src/jobs/cleanupExpiredTokens.js

/**
 * Job: cleanupExpiredRefreshTokens
 *
 * Deletes expired refresh tokens from the database once per day, at midnight
 * Europe/London time. Only runs in production.
 *
 * Dependencies:
 *   npm install node-cron
 */

const cron = require('node-cron');
const pool = require('../config/db');

async function cleanupExpiredRefreshTokens() {
  const now = new Date().toISOString();
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    console.log(
      `[${now}] [cleanupExpiredRefreshTokens] removed ${rowCount} expired tokens`
    );
  } catch (err) {
    console.error(
      `[${now}] [cleanupExpiredRefreshTokens] error deleting expired tokens:`,
      err
    );
  }
}

// Schedule only in production, at 00:00 Europe/London
if (process.env.NODE_ENV === 'production') {
  cron.schedule(
    '0 0 * * *',
    cleanupExpiredRefreshTokens,
    {
      scheduled: true,
      timezone: 'Europe/London',
    }
  );
  console.log(
    `[${new Date().toISOString()}] Scheduled cleanupExpiredRefreshTokens (daily @ midnight Europe/London)`
  );
}

module.exports = cleanupExpiredRefreshTokens;
