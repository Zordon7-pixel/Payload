const db = require('./index');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const existing = db.prepare('SELECT id FROM companies LIMIT 1').get();
if (existing) { console.log('DB already seeded.'); process.exit(0); }

const companyId = uuidv4();
db.prepare(`INSERT INTO companies (id, name, mc_number, dot_number, address, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(
  companyId, "PAYLOAD Demo Hauling LLC", "MC-1234567", "DOT-9876543", "123 Commerce Blvd", "(555) 800-0100"
);

const userId = uuidv4();
db.prepare(`INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`).run(
  userId, companyId, "Owner", "demo@haul.com", bcrypt.hashSync('demo1234', 10), "owner"
);

const trucks = [
  { name: "Truck 1", year: 2020, make: "Mack", model: "Granite", plate: "TRK-0011" },
  { name: "Truck 2", year: 2019, make: "Kenworth", model: "T370", plate: "TRK-0022" },
];
const truckIds = trucks.map(t => {
  const id = uuidv4();
  db.prepare(`INSERT INTO trucks (id, company_id, name, year, make, model, plate, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`).run(id, companyId, t.name, t.year, t.make, t.model, t.plate);
  return id;
});

const customers = [
  { name: "Coastal Paving Co.",    contact: "Mike Torres",  source: "aggtrans" },
  { name: "Midland Road Works",    contact: "Sandra Lee",   source: "aggdirect" },
  { name: "National Salt Dist.",   contact: "James Wu",     source: "direct" },
  { name: "Riverside Contractors", contact: "Dana Price",   source: "direct" },
];
const custIds = customers.map(c => {
  const id = uuidv4();
  db.prepare(`INSERT INTO customers (id, company_id, name, contact_name, source) VALUES (?, ?, ?, ?, ?)`).run(id, companyId, c.name, c.contact, c.source);
  return id;
});

const loads = [
  // delivered + paid — shows in revenue
  { truckId: truckIds[0], custId: custIds[0], material: "asphalt",  pickup: "Asphalt Plant, OH",   dropoff: "Columbus, OH",    tons: 22, miles: 45, rate_per_ton: 22, status: "delivered", source: "aggtrans",  paid: 1, pickupDate: "2026-02-10", delivDate: "2026-02-11" },
  // delivered + UNPAID — shows in unpaid invoices
  { truckId: truckIds[1], custId: custIds[1], material: "gravel",   pickup: "Stone Quarry, PA",    dropoff: "Pittsburgh, PA",  tons: 18, miles: 28, rate_per_ton: 18, status: "delivered", source: "aggdirect", paid: 0, pickupDate: "2026-02-11", delivDate: "2026-02-12" },
  // in transit
  { truckId: truckIds[0], custId: custIds[2], material: "salt",     pickup: "Salt Depot, IL",      dropoff: "Chicago, IL",     tons: 25, miles: 52, rate_per_ton: 20, status: "in_transit",source: "direct",    paid: 0, pickupDate: "2026-02-12", delivDate: null },
  // loaded (staged)
  { truckId: truckIds[1], custId: custIds[0], material: "sand",     pickup: "Sand Pit, TX",        dropoff: "Houston, TX",     tons: 20, miles: 22, rate_per_ton: 16, status: "loaded",    source: "aggtrans",  paid: 0, pickupDate: "2026-02-13", delivDate: null },
  // pending dispatch
  { truckId: truckIds[0], custId: custIds[3], material: "asphalt",  pickup: "Asphalt Plant, GA",   dropoff: "Atlanta, GA",     tons: 24, miles: 30, rate_per_ton: 24, status: "pending",   source: "direct",    paid: 0, pickupDate: "2026-02-14", delivDate: null },
  // delivered + UNPAID — second outstanding invoice
  { truckId: truckIds[1], custId: custIds[2], material: "topsoil",  pickup: "Farm Supply, IN",     dropoff: "Indianapolis, IN",tons: 15, miles: 20, rate_per_ton: 19, status: "delivered", source: "direct",    paid: 0, pickupDate: "2026-02-15", delivDate: "2026-02-16" },
];

loads.forEach((l, i) => {
  const id = uuidv4();
  const loadNum = `HC-2026-${String(i+1).padStart(4,'0')}`;
  const gross = l.tons * l.rate_per_ton;
  const fuel  = +(l.miles * 0.45).toFixed(2);
  const net   = +(gross - fuel - (gross * 0.15)).toFixed(2);
  db.prepare(`
    INSERT INTO loads (id, company_id, load_number, truck_id, driver_id, customer_id, source, material,
      pickup_location, dropoff_location, status, tons, miles, rate_per_ton, rate_type,
      gross_revenue, fuel_cost, net_profit, paid, pickup_date, delivery_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'per_ton', ?, ?, ?, ?, ?, ?)
  `).run(id, companyId, loadNum, l.truckId, userId, l.custId, l.source, l.material,
    l.pickup, l.dropoff, l.status, l.tons, l.miles, l.rate_per_ton,
    gross, fuel, net, l.paid ? 1 : 0, l.pickupDate, l.delivDate
  );
});

console.log('✅ PAYLOAD seeded.');
console.log('   Company: PAYLOAD Demo Hauling LLC');
console.log('   Login: demo@haul.com / demo1234');
console.log('   2 trucks | 4 customers | 6 loads (2 delivered+unpaid, 1 paid, 3 active)');
