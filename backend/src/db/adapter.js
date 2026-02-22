require('dotenv').config();

/**
 * Database Adapter
 * Automatically switches between SQLite (sync) and PostgreSQL (async)
 * based on DATABASE_URL environment variable
 *
 * DATABASE_URL set → PostgreSQL
 * DATABASE_URL not set → SQLite (wrapped in async for compatibility)
 */

const usePostgres = !!process.env.DATABASE_URL;

let db;
let isAsync = false;

if (usePostgres) {
  // ============================================
  // PostgreSQL Mode (Async)
  // ============================================
  const pgModule = require('./postgres');
  isAsync = true;

  db = {
    // Generic query
    query: (text, params) => pgModule.query(text, params),

    // Get single row
    getOne: (text, params) => pgModule.getOne(text, params),

    // Get all rows
    getAll: (text, params) => pgModule.getAll(text, params),

    // Execute and return rowCount
    run: (text, params) => pgModule.run(text, params),

    // Close connection
    close: () => pgModule.close(),

    // Metadata
    isAsync: () => true,
  };
} else {
  // ============================================
  // SQLite Mode (Sync, wrapped in async)
  // ============================================
  const sqliteDb = require('./index');
  isAsync = true;

  db = {
    // Generic query - wraps sync in Promise
    query: async (text, params) => {
      try {
        const stmt = sqliteDb.prepare(text);
        const result = stmt.all(...(params || []));
        return { rows: result, rowCount: result.length };
      } catch (err) {
        throw err;
      }
    },

    // Get single row
    getOne: async (text, params) => {
      try {
        const stmt = sqliteDb.prepare(text);
        return stmt.get(...(params || [])) || null;
      } catch (err) {
        throw err;
      }
    },

    // Get all rows
    getAll: async (text, params) => {
      try {
        const stmt = sqliteDb.prepare(text);
        return stmt.all(...(params || []));
      } catch (err) {
        throw err;
      }
    },

    // Execute and return rowCount
    run: async (text, params) => {
      try {
        const stmt = sqliteDb.prepare(text);
        const result = stmt.run(...(params || []));
        return result.changes;
      } catch (err) {
        throw err;
      }
    },

    // SQLite doesn't need explicit close
    close: async () => {
      try {
        if (sqliteDb && sqliteDb.close) {
          sqliteDb.close();
        }
      } catch (err) {
        console.error('Error closing database:', err);
      }
    },

    // Metadata
    isAsync: () => true,
  };
}

console.log(
  usePostgres
    ? '🐘 Using PostgreSQL (DATABASE_URL set)'
    : '🗂️  Using SQLite (DATABASE_URL not set)'
);

module.exports = db;
