require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function init() {
  console.log('Connecting to PostgreSQL to check database...');
  
  // Extract database name from connection string or default to 'campushub'
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campushub';
  const urlObj = new URL(dbUrl);
  const targetDb = urlObj.pathname.replace('/', '') || 'campushub';
  
  // Connect to default 'postgres' database first
  const rootUrl = `${urlObj.protocol}//${urlObj.username}:${urlObj.password}@${urlObj.host}/postgres`;
  const rootClient = new Client({ connectionString: rootUrl });

  try {
    await rootClient.connect();
    console.log('Connected to PostgreSQL server.');
    
    // Check if campushub database exists
    const checkRes = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database "${targetDb}" created successfully!`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.warn(`Note when checking root database: ${err.message}. Trying direct connection...`);
  } finally {
    try { await rootClient.end(); } catch (e) {}
  }

  // Connect to the target database and run schema + seed if tables don't exist
  const dbClient = new Client({ connectionString: dbUrl });
  try {
    await dbClient.connect();
    console.log(`Connected to database "${targetDb}".`);

    // Check if users table exists
    const tableRes = await dbClient.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (tableRes.rows.length === 0) {
      console.log('Executing schema.sql...');
      const schemaPath = path.join(__dirname, '..', '..', '..', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await dbClient.query(schemaSql);
      console.log('schema.sql executed successfully.');

      console.log('Executing seed.sql...');
      const seedPath = path.join(__dirname, '..', '..', '..', 'seed.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await dbClient.query(seedSql);
      console.log('seed.sql executed successfully.');
    } else {
      console.log('Tables already exist in database. Schema setup complete.');
    }
  } catch (err) {
    console.error('Database initialization error:', err.message);
  } finally {
    try { await dbClient.end(); } catch (e) {}
  }
}

init().then(() => {
  console.log('Database check finished.');
  process.exit(0);
});
