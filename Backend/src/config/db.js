// src/config/db.js
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const isMock = process.env.MOCK_DB === 'true';

let exported; // what we'll export at the end

if (isMock) {
  // Tiny stub for mocked test runs (no DB touch)
  exported = {
    query: async () => ({ rows: [], rowCount: 0 }),
  };
} else {
  // Decide SSL (Azure needs it). You can also force via DB_SSL=true
  const url = process.env.DATABASE_URL || '';
  const useSSL =
    /sslmode=require/i.test(url) ||
    /postgres\.database\.azure\.com/i.test(url) ||
    process.env.DB_SSL === 'true';

  const pool = new Pool({
    connectionString: url,
    ssl: useSSL ? { require: true, rejectUnauthorized: false } : false,
    keepAlive: true,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => console.error('[db] idle client error:', err));
  pool.connect()
    .then(() => console.log(`[db] Connected (${useSSL ? 'SSL' : 'no SSL'})`))
    .catch((err) => console.error('[db] connection failed:', err.message));

  exported = pool;
}

module.exports = exported;
