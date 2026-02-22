const db = require('./index');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function runSeed() {
  const existing = db.prepare('SELECT id FROM companies LIMIT 1').get();
  if (existing) { console.log('DB already seeded — skipping.'); return; }

  const companyId = uuidv4();
  db.prepare(`INSERT INTO companies (id, name, mc_number, dot_number, address, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(
    companyId, "PAYLOAD Demo Transport LLC", "MC-7654321", "DOT-1234567", "100 Freight Way", "(555) 900-0200"
  );

  const userId = uuidv4();
  db.prepare(`INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`).run(
    userId, companyId, "Owner", "demo@haul.com", bcrypt.hashSync('demo1234', 10), "owner"
  );

  const trucks = [
    { name: "Truck 1", year: 2021, make: "Freightliner", model: "Cascadia", plate: "TRK-1001" },
    { name: "Truck 2", year: 2020, make: "Kenworth",     model: "T680",     plate: "TRK-1002" },
  ];
  const truckIds = trucks.map(t => {
    const id = uuidv4();
    db.prepare(`INSERT INTO trucks (id, company_id, name, year, make, model, plate, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`).run(id, companyId, t.name, t.year, t.make, t.model, t.plate);
    return id;
  });

  // Drivers — CDL/medical card compliance demo (one expiring soon each)
  const driver1Id = uuidv4();
  db.prepare(`INSERT INTO drivers (id, company_id, name, phone, email, cdl_number, cdl_expiry, medical_card_expiry, pay_type, pay_rate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    driver1Id, companyId, "Marcus Johnson", "(555) 210-4401", "marcus@demo.com",
    "CDL-A-881234", "2026-05-15", "2026-03-07", "percent", 28, "active"
  );
  const driver2Id = uuidv4();
  db.prepare(`INSERT INTO drivers (id, company_id, name, phone, email, cdl_number, cdl_expiry, medical_card_expiry, pay_type, pay_rate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    driver2Id, companyId, "Carlos Rivera", "(555) 330-7782", "carlos@demo.com",
    "CDL-A-992847", "2026-03-18", "2026-08-20", "per_mile", 0.45, "active"
  );

  const cust0 = uuidv4(); db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(cust0, companyId, "Heartland Foods Co.",      "Maria Gonzalez", "direct");
  const cust1 = uuidv4(); db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(cust1, companyId, "National Parts Depot",     "Eric Thompson",  "dat");
  const cust2 = uuidv4(); db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(cust2, companyId, "Summit Retail Group",      "Ashley Kim",     "truckstop");
  const cust3 = uuidv4(); db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(cust3, companyId, "Atlas Building Materials", "Dan Fisher",     "broker");

  const loads = [
    { truck: truckIds[0], cust: cust0, freight: "Packaged Food",               pickup: "Kansas City, MO", dropoff: "Nashville, TN",  miles: 530,  rpm: 2.20, type: "per_mile",  flat: 0,    tons: 0, rpt: 0, fuel: 265, dpay: 160, status: "delivered",  source: "direct",    paid: 1, pd: "2026-02-08", dd: "2026-02-09" },
    { truck: truckIds[1], cust: cust3, freight: "Steel Beams",                  pickup: "Cincinnati, OH",  dropoff: "Charlotte, NC",  miles: 490,  rpm: 0,    type: "flat_rate", flat: 1800, tons: 0, rpt: 0, fuel: 245, dpay: 400, status: "delivered",  source: "broker",    paid: 0, pd: "2026-02-11", dd: "2026-02-12" },
    { truck: truckIds[0], cust: cust1, freight: "Auto Parts",                   pickup: "Detroit, MI",     dropoff: "Memphis, TN",    miles: 620,  rpm: 2.10, type: "per_mile",  flat: 0,    tons: 0, rpt: 0, fuel: 310, dpay: 185, status: "in_transit", source: "dat",       paid: 0, pd: "2026-02-14", dd: null },
    { truck: truckIds[1], cust: cust3, freight: "Lumber / Building Materials",  pickup: "Portland, OR",    dropoff: "Boise, ID",      miles: 320,  rpm: 0,    type: "flat_rate", flat: 1200, tons: 0, rpt: 0, fuel: 160, dpay: 280, status: "loaded",     source: "broker",    paid: 0, pd: "2026-02-15", dd: null },
    { truck: truckIds[0], cust: cust2, freight: "General Retail Freight",       pickup: "Columbus, OH",    dropoff: "Atlanta, GA",    miles: 700,  rpm: 2.30, type: "per_mile",  flat: 0,    tons: 0, rpt: 0, fuel: 350, dpay: 210, status: "pending",    source: "truckstop", paid: 0, pd: "2026-02-17", dd: null },
    { truck: truckIds[1], cust: cust1, freight: "Electronics / Palletized",     pickup: "Dallas, TX",      dropoff: "Phoenix, AZ",    miles: 1020, rpm: 2.50, type: "per_mile",  flat: 0,    tons: 0, rpt: 0, fuel: 510, dpay: 306, status: "delivered",  source: "dat",       paid: 0, pd: "2026-02-13", dd: "2026-02-15" },
  ];

  loads.forEach((l, i) => {
    const id = uuidv4();
    const loadNum = `HC-2026-${String(i+1).padStart(4,'0')}`;
    let gross = 0;
    if (l.type === 'per_mile')   gross = l.miles * l.rpm;
    else if (l.type === 'flat_rate') gross = l.flat;
    else gross = l.tons * l.rpt;
    const net = +(gross - l.fuel - l.dpay).toFixed(2);
    db.prepare(`
      INSERT INTO loads (id, company_id, load_number, truck_id, driver_id, customer_id, source, material,
        pickup_location, dropoff_location, status, tons, miles, rate_per_ton, rate_per_mile, flat_rate, rate_type,
        gross_revenue, fuel_cost, driver_pay, net_profit, paid, pickup_date, delivery_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, companyId, loadNum, l.truck, userId, l.cust, l.source, l.freight,
      l.pickup, l.dropoff, l.status, l.tons, l.miles, l.rpt, l.rpm, l.flat, l.type,
      gross, l.fuel, l.dpay, net, l.paid ? 1 : 0, l.pd, l.dd
    );
  });

  // Fuel logs — demo fill-up history for both trucks
  const fuelEntries = [
    { truck: truckIds[0], driver: driver1Id, date: "2026-02-08", gallons: 87.4, ppg: 3.799, odo: 47200, location: "Pilot Flying J - Exit 42" },
    { truck: truckIds[1], driver: driver2Id, date: "2026-02-11", gallons: 92.1, ppg: 3.849, odo: 62100, location: "Love's Travel Stop - I-77" },
    { truck: truckIds[0], driver: driver1Id, date: "2026-02-14", gallons: 95.8, ppg: 3.819, odo: 48650, location: "TA Petro - I-94 Exit 15" },
    { truck: truckIds[1], driver: driver2Id, date: "2026-02-15", gallons: 78.3, ppg: 3.929, odo: 63400, location: "Pilot Flying J - I-84" },
    { truck: truckIds[0], driver: driver1Id, date: "2026-02-17", gallons: 102.6, ppg: 3.769, odo: 49900, location: "Love's Travel Stop - Exit 210" },
  ];
  fuelEntries.forEach(f => {
    const total = +(f.gallons * f.ppg).toFixed(2);
    db.prepare(`INSERT INTO fuel_logs (id, company_id, truck_id, driver_id, log_date, gallons, price_per_gallon, total_cost, odometer, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), companyId, f.truck, f.driver, f.date, f.gallons, f.ppg, total, f.odo, f.location
    );
  });

  console.log('✅ PAYLOAD seeded.');
  console.log('   Company: PAYLOAD Demo Transport LLC');
  console.log('   Login: demo@haul.com / demo1234');
  console.log('   2 trucks | 2 drivers | 4 customers | 6 loads | 5 fuel entries');
}

// Allow running directly: node src/db/seed.js
if (require.main === module) {
  runSeed();
  process.exit(0);
}

module.exports = { runSeed };
