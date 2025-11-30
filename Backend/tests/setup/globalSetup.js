// tests/setup/globalSetup.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

module.exports = async () => {
  // If we're running mocked tests, skip any DB work entirely.
  if (process.env.MOCK_DB === 'true') {
    console.log('[globalSetup] MOCK_DB=true → skipping DB setup');
    return;
  }

  // Load test env if not already loaded
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });

  // If there is no DATABASE_URL or we explicitly asked to skip, bail out gracefully.
  if (!process.env.DATABASE_URL || process.env.SKIP_DB_SETUP === '1') {
    console.log('[globalSetup] No DATABASE_URL or SKIP_DB_SETUP=1 → skipping DB setup');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: /sslmode=require/.test(process.env.DATABASE_URL || '')
      ? { require: true, rejectUnauthorized: false }
      : false,
  });

  try {
    await pool.query('SELECT 1'); // sanity connect

    // Optional: seed minimal tables if your file exists; otherwise skip quietly
    const ddlPath = path.join(process.cwd(), 'sql', '000_test_core_tables.sql');
    if (fs.existsSync(ddlPath)) {
      const ddl = fs.readFileSync(ddlPath, 'utf8');
      if (ddl.trim()) {
        await pool.query(ddl);
        console.log('[globalSetup] Applied 000_test_core_tables.sql');
      }
    } else {
      console.log('[globalSetup] No sql/000_test_core_tables.sql found — continuing');
    }
  } catch (e) {
    console.error('globalSetup DB error:', e);
    throw e;
  } finally {
    await pool.end();
  }
};
