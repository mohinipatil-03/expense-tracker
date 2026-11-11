require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'expense_tracker_db';

  console.log(`Connecting to MySQL Server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without database first to ensure database exists
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✓ Successfully connected to MySQL.');

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log(`Executing schema from: ${schemaPath}...`);
    await connection.query(schemaSql);
    console.log('✓ Database schema created / verified successfully.');

    // Switch to database and run seed.sql
    await connection.query(`USE \`${database}\`;`);
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    console.log(`Executing seed data from: ${seedPath}...`);
    await connection.query(seedSql);
    console.log('✓ Sample categories, budgets, and transactions seeded successfully.');

    console.log('\n🎉 MySQL setup complete! You can now start the application with: npm start');
  } catch (err) {
    console.error('❌ MySQL Setup Error:', err.message);
    console.error('\nPlease verify that:');
    console.error('1. MySQL server is running (e.g. "net start mysql" or via MySQL Notifier / XAMPP / Services)');
    console.error('2. Your .env file contains the correct DB_USER and DB_PASSWORD credentials.');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSetup();
