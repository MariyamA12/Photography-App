const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env');
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE role = $1 AND email = $2',
      ['admin', email]
    );

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Super Admin', email, hashedPassword, 'admin']
      );
      console.log('Admin user seeded successfully');
    } else {
      console.log('Admin already exists');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

module.exports = seedAdminUser;
