const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool from DATABASE_URL env var
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a query against PostgreSQL
 * @param {string} text - SQL query text
 * @param {array} params - Query parameters (optional)
 * @returns {Promise<object>} - Query result { rows, rowCount }
 */
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Get a single row
 * @param {string} text - SQL query text
 * @param {array} params - Query parameters (optional)
 * @returns {Promise<object|null>} - First row or null
 */
async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Get all rows
 * @param {string} text - SQL query text
 * @param {array} params - Query parameters (optional)
 * @returns {Promise<array>} - Array of rows
 */
async function getAll(text, params) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * Execute and return rowCount
 * @param {string} text - SQL query text
 * @param {array} params - Query parameters (optional)
 * @returns {Promise<number>} - Row count affected
 */
async function run(text, params) {
  const result = await query(text, params);
  return result.rowCount;
}

/**
 * Close the pool
 */
async function close() {
  await pool.end();
}

module.exports = {
  query,
  getOne,
  getAll,
  run,
  close,
  pool,
};
