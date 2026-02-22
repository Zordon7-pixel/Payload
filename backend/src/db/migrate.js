const fs = require('fs');
const path = require('path');
const pg = require('./postgres');

/**
 * Check if tables already exist in PostgreSQL
 * @returns {Promise<boolean>} - True if companies table exists
 */
async function tablesExist() {
  try {
    const result = await pg.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'companies'
      )`
    );
    return result.rows[0]?.exists || false;
  } catch (err) {
    console.error('Error checking if tables exist:', err);
    return false;
  }
}

/**
 * Run PostgreSQL migrations
 * Idempotent: only runs if tables don't already exist
 */
async function runMigrations() {
  const exists = await tablesExist();

  if (exists) {
    console.log('✅ PostgreSQL tables already exist — skipping migrations.');
    return;
  }

  console.log('📍 Running PostgreSQL migrations...');

  const schemaPath = path.join(__dirname, 'schema.pg.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    // Execute the entire schema file
    await pg.query(schema);
    console.log('✅ PostgreSQL migrations completed successfully.');
  } catch (err) {
    console.error('❌ Error running migrations:', err);
    throw err;
  }
}

// Allow running directly: node src/db/migrate.js
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations, tablesExist };
