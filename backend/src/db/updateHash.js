require('dotenv').config();
const { pool } = require('./index');
const bcrypt = require('bcryptjs');

async function run() {
  const hash = await bcrypt.hash('password123', 10);
  await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Successfully updated seed user password hashes to password123!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
