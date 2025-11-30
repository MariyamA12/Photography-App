// src/config/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, '../../sql');
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`→ Running ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`✔ ${file}`);
    }

    console.log('All migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
