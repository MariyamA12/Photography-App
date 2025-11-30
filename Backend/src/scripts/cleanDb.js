// backend/src/scripts/cleanDb.js
require('dotenv').config();
const pool = require('../config/db');

/**
 * ENV controls:
 *  - KEEP_TABLES: comma-separated names to preserve (e.g. "users,schools,students")
 *  - DRY_RUN: "1" to only print the TRUNCATE statement without executing
 */
const KEEP_TABLES = (process.env.KEEP_TABLES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => s.toLowerCase());

// add any meta tables you ALWAYS want to keep here (if you have them)
const ALWAYS_KEEP = new Set([
  // 'prisma_migrations', // uncomment if you use Prisma migrations
  // 'sequelize_meta',    // uncomment if you used Sequelize
]);

/** guard: allow only bare identifiers (avoid SQL injection via env) */
const isSafeIdent = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

async function getPublicTables(client) {
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `);
  return rows.map(r => r.table_name);
}

function buildTruncateSQL(tables) {
  // quote identifiers safely
  const quoted = tables.map(t => `"${t}"`).join(', ');
  return `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`;
}

(async () => {
  const client = await pool.connect();
  try {
    console.log('→ Discovering public tables…');
    const allTables = (await getPublicTables(client)).filter(isSafeIdent);

    // Respect KEEP_TABLES + ALWAYS_KEEP
    const keepSet = new Set([...KEEP_TABLES, ...ALWAYS_KEEP].map(s => s.toLowerCase()));

    // Some repos end up with both spellings for QR codes; both are fine here.
    // No need to special-case; we keep whatever the DB actually has.

    const toTruncate = allTables.filter(t => !keepSet.has(t.toLowerCase()));

    if (toTruncate.length === 0) {
      console.log('No tables to truncate. (Everything is in KEEP_TABLES / ALWAYS_KEEP.)');
      process.exit(0);
    }

    const sql = buildTruncateSQL(toTruncate);

    console.log('\nPlanned operation:');
    console.log(sql, '\n');

    if (process.env.DRY_RUN === '1') {
      console.log('DRY_RUN=1 → not executing. Exiting.');
      process.exit(0);
    }

    console.log('→ Cleaning database…');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✔ Done. Data wiped, sequences reset. Schema untouched.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('✖ Cleaning failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();
