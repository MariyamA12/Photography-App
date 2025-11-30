const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedPhotographerUser() {
  const email = process.env.PHOTOGRAPHER_EMAIL;
  const password = process.env.PHOTOGRAPHER_PASSWORD;

  if (!email || !password) {
    console.warn('PHOTOGRAPHER_EMAIL or PHOTOGRAPHER_PASSWORD is missing in .env');
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE role = $1 AND email = $2',
      ['photographer', email]
    );

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Test Photographer', email, hashedPassword, 'photographer']
      );
      console.log('Photographer user seeded successfully');
    } else {
      console.log('Photographer already exists');
    }
  } catch (err) {
    console.error('Error seeding photographer user:', err.message);
  }
}

module.exports = seedPhotographerUser; 