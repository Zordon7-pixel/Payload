-- PAYLOAD PostgreSQL Schema
-- Converted from SQLite with UUIDs, TIMESTAMPTZ, and proper indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mc_number TEXT,
  dot_number TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================================================
-- Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'driver',
  truck_id UUID,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_truck_id ON users(truck_id);

-- ============================================================================
-- Trucks
-- ============================================================================
CREATE TABLE IF NOT EXISTS trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  plate TEXT,
  vin TEXT,
  status TEXT DEFAULT 'active',
  current_mileage INTEGER DEFAULT 0,
  dot_inspection_date TEXT,
  registration_expiry TEXT,
  insurance_expiry TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trucks_company_id ON trucks(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_plate ON trucks(plate);

-- ============================================================================
-- Customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  source TEXT DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ============================================================================
-- Drivers
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cdl_number TEXT,
  cdl_expiry TEXT,
  medical_card_expiry TEXT,
  pay_type TEXT DEFAULT 'percent',
  pay_rate REAL DEFAULT 25,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);

-- ============================================================================
-- Loads
-- ============================================================================
CREATE TABLE IF NOT EXISTS loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  load_number TEXT UNIQUE,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loads_company_id ON loads(company_id);
CREATE INDEX IF NOT EXISTS idx_loads_truck_id ON loads(truck_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_load_number ON loads(load_number);

-- ============================================================================
-- Expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  category TEXT,
  amount REAL,
  description TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_load_id ON expenses(load_id);
CREATE INDEX IF NOT EXISTS idx_expenses_truck_id ON expenses(truck_id);

-- ============================================================================
-- Maintenance Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_date TEXT,
  mileage INTEGER,
  cost REAL DEFAULT 0,
  vendor TEXT,
  notes TEXT,
  next_service_date TEXT,
  next_service_mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_company_id ON maintenance_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_truck_id ON maintenance_logs(truck_id);

-- ============================================================================
-- Fuel Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  log_date TEXT,
  gallons REAL DEFAULT 0,
  price_per_gallon REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  odometer INTEGER,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_company_id ON fuel_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_truck_id ON fuel_logs(truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver_id ON fuel_logs(driver_id);

-- ============================================================================
-- Daily Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  start_mileage INTEGER,
  end_mileage INTEGER,
  loads_completed INTEGER DEFAULT 0,
  weather TEXT,
  notes TEXT,
  incidents TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_company_id ON daily_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_driver_id ON daily_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_truck_id ON daily_logs(truck_id);

-- ============================================================================
-- Pre-Trip Inspections
-- ============================================================================
CREATE TABLE IF NOT EXISTS pretrip_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  inspection_date TEXT NOT NULL,
  inspection_time TEXT,
  odometer INTEGER,
  items TEXT NOT NULL,
  overall_pass INTEGER DEFAULT 1,
  defects_noted TEXT,
  driver_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pretrip_inspections_company_id ON pretrip_inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_pretrip_inspections_driver_id ON pretrip_inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_pretrip_inspections_truck_id ON pretrip_inspections(truck_id);

-- ============================================================================
-- Post-Trip Inspections
-- ============================================================================
CREATE TABLE IF NOT EXISTS posttrip_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  inspection_date TEXT NOT NULL,
  inspection_time TEXT,
  odometer INTEGER,
  items TEXT NOT NULL,
  overall_pass INTEGER DEFAULT 1,
  defects_noted TEXT,
  driver_signature TEXT,
  repair_status TEXT DEFAULT 'none',
  repair_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posttrip_inspections_company_id ON posttrip_inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_posttrip_inspections_driver_id ON posttrip_inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_posttrip_inspections_truck_id ON posttrip_inspections(truck_id);
