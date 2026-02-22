const db = require('./index');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const existing = db.prepare('SELECT id FROM companies LIMIT 1').get();
if (existing) { console.log('DB already seeded.'); process.exit(0); }

const companyId = uuidv4();
db.prepare(`INSERT INTO companies (id, name, mc_number, dot_number, address, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(
  companyId, "Calvo Hauling LLC", "MC-1234567", "DOT-9876543", "Washington, DC Metro Area", "(202) 555-0100"
);

const userId = uuidv4();
db.prepare(`INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`).run(
  userId, companyId, "Bryan (Owner)", "demo@haul.com", bcrypt.hashSync('demo1234', 10), "owner"
);

const trucks = [
  { name: "Truck 1", year: 2020, make: "Mack", model: "Granite", plate: "DC-TRK-01" },
  { name: "Truck 2", year: 2019, make: "Kenworth", model: "T370", plate: "DC-TRK-02" },
];
const truckIds = trucks.map(t => {
  const id = uuidv4();
  db.prepare(`INSERT INTO trucks (id, company_id, name, year, make, model, plate, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`).run(id, companyId, t.name, t.year, t.make, t.model, t.plate);
  return id;
});

const customers = [
  { name: "DC Paving Co.", contact: "Mike Torres", source: "aggtrans" },
  { name: "Metro Road Works", contact: "Sandra Lee", source: "aggdirect" },
  { name: "Virginia Salt Authority", contact: "James Wu", source: "direct" },
];
const custIds = customers.map(c => {
  const id = uuidv4();
  db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(id, companyId, c.name, c.contact, c.source);
  return id;
});

const loads = [
  { truckId: truckIds[0], custId: custIds[0], material: "asphalt", pickup: "Baltimore, MD", dropoff: "Washington, DC", tons: 22, miles: 45, rate_per_ton: 12, status: "delivered", source: "aggtrans", paid: 1 },
  { truckId: truckIds[1], custId: custIds[1], material: "gravel", pickup: "Quarry, VA", dropoff: "Arlington, VA", tons: 18, miles: 28, rate_per_ton: 10, status: "in_transit", source: "aggdirect", paid: 0 },
  { truckId: truckIds[0], custId: custIds[2], material: "salt", pickup: "Port of Baltimore", dropoff: "Fairfax, VA", tons: 25, miles: 52, rate_per_ton: 11, status: "loaded", source: "direct", paid: 0 },
  { truckId: truckIds[1], custId: custIds[0], material: "sand", pickup: "Sand Pit, MD", dropoff: "Bethesda, MD", tons: 20, miles: 22, rate_per_ton: 9, status: "pending", source: "aggtrans", paid: 0 },
  { truckId: truckIds[0], custId: custIds[1], material: "asphalt", pickup: "Plant, MD", dropoff: "Silver Spring, MD", tons: 24, miles: 30, rate_per_ton: 13, status: "delivered", source: "aggdirect", paid: 1 },
];

loads.forEach((l, i) => {
  const id = uuidv4();
  const loadNum = `HC-2026-${String(i+1).padStart(4,'0')}`;
  const gross = l.tons * l.rate_per_ton;
  const fuel = l.miles * 0.45;
  const net = gross - fuel - (gross * 0.15);
  db.prepare(`
    INSERT INTO loads (id, company_id, load_number, truck_id, driver_id, customer_id, source, material,
      pickup_location, dropoff_location, status, tons, miles, rate_per_ton, rate_type,
      gross_revenue, fuel_cost, net_profit, paid, pickup_date, delivery_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'per_ton', ?, ?, ?, ?, ?, ?)
  `).run(id, companyId, loadNum, l.truckId, userId, l.custId, l.source, l.material,
    l.pickup, l.dropoff, l.status, l.tons, l.miles, l.rate_per_ton,
    gross, fuel.toFixed(2), net.toFixed(2), l.paid ? 1 : 0,
    `2026-02-${10+i}`, l.status === 'delivered' ? `2026-02-${11+i}` : null
  );
});

console.log('✅ HaulCommand seeded.');
console.log('   Company: Calvo Hauling LLC');
console.log('   Login: demo@haul.com / demo1234');
console.log('   2 trucks, 3 customers, 5 sample loads');
