// src/server.js

require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const seedAdminUser = require('./services/adminSeeder');
const seedPhotographerUser = require('./services/photographerSeeder');

// Initialize any background jobs (cron jobs, etc.)
require('./jobs/cleanupExpiredTokens');
require('./jobs/sendUpcomingAlerts');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Verify DB connection
    const { rows } = await pool.query('SELECT NOW()');
    console.log(`DB connected at ${rows[0].now}`);

    // Ensure initial users exist
    await seedAdminUser();
    await seedPhotographerUser();
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
