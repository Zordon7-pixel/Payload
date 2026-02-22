const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(path.resolve(__dirname, '../../haulcommand.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mc_number TEXT,
    dot_number TEXT,
    address TEXT,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'driver',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trucks (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    name TEXT,
    year INTEGER,
    make TEXT,
    model TEXT,
    plate TEXT,
    vin TEXT,
    status TEXT DEFAULT 'active',
    current_mileage INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    source TEXT DEFAULT 'direct',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loads (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    load_number TEXT UNIQUE,
    truck_id TEXT REFERENCES trucks(id),
    driver_id TEXT REFERENCES users(id),
    customer_id TEXT REFERENCES customers(id),
    source TEXT DEFAULT 'direct',
    source_ref TEXT,
    material TEXT,
    pickup_location TEXT,
    dropoff_location TEXT,
    pickup_date TEXT,
    delivery_date TEXT,
    status TEXT DEFAULT 'pending',
    tons REAL DEFAULT 0,
    miles REAL DEFAULT 0,
    rate_per_ton REAL DEFAULT 0,
    rate_per_mile REAL DEFAULT 0,
    flat_rate REAL DEFAULT 0,
    rate_type TEXT DEFAULT 'per_ton',
    gross_revenue REAL DEFAULT 0,
    fuel_cost REAL DEFAULT 0,
    driver_pay REAL DEFAULT 0,
    other_expenses REAL DEFAULT 0,
    net_profit REAL DEFAULT 0,
    paid INTEGER DEFAULT 0,
    invoice_sent INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    load_id TEXT REFERENCES loads(id),
    truck_id TEXT REFERENCES trucks(id),
    category TEXT,
    amount REAL,
    description TEXT,
    date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
