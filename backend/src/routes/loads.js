const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const STATUSES = ['pending','dispatched','loaded','in_transit','delivered','invoiced','paid'];

function calcProfit(load) {
  let gross = 0;
  if (load.rate_type === 'per_ton') gross = (load.tons || 0) * (load.rate_per_ton || 0);
  else if (load.rate_type === 'per_mile') gross = (load.miles || 0) * (load.rate_per_mile || 0);
  else gross = load.flat_rate || 0;
  const expenses = (load.fuel_cost || 0) + (load.driver_pay || 0) + (load.other_expenses || 0);
  return { gross, net: gross - expenses };
}

function enrichLoad(l) {
  if (!l) return null;
  const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(l.truck_id);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(l.customer_id);
  const driver = l.driver_id ? db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(l.driver_id) : null;
  return { ...l, truck, customer, driver };
}

router.get('/', auth, (req, res) => {
  const loads = db.prepare(`
    SELECT l.*, t.name as truck_name, t.plate, c.name as customer_name, u.name as driver_name
    FROM loads l
    LEFT JOIN trucks t ON t.id = l.truck_id
    LEFT JOIN customers c ON c.id = l.customer_id
    LEFT JOIN users u ON u.id = l.driver_id
    WHERE l.company_id = ? ORDER BY l.created_at DESC
  `).all(req.user.company_id);
  res.json({ loads });
});

router.get('/:id', auth, (req, res) => {
  const load = db.prepare('SELECT * FROM loads WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!load) return res.status(404).json({ error: 'Not found' });
  res.json(enrichLoad(load));
});

router.post('/', auth, (req, res) => {
  const { truck_id, customer_id, driver_id, source, source_ref, material, pickup_location, dropoff_location, pickup_date, tons, miles, rate_per_ton, rate_per_mile, flat_rate, rate_type, fuel_cost, driver_pay, other_expenses, notes } = req.body;
  const count = db.prepare('SELECT COUNT(*) as n FROM loads WHERE company_id = ?').get(req.user.company_id);
  const loadNumber = `HC-2026-${String(count.n + 1).padStart(4, '0')}`;
  const id = uuidv4();
  const mockLoad = { tons, miles, rate_per_ton, rate_per_mile, flat_rate, rate_type, fuel_cost, driver_pay, other_expenses };
  const { gross, net } = calcProfit(mockLoad);
  db.prepare(`
    INSERT INTO loads (id, company_id, load_number, truck_id, driver_id, customer_id, source, source_ref, material, pickup_location, dropoff_location, pickup_date, tons, miles, rate_per_ton, rate_per_mile, flat_rate, rate_type, gross_revenue, fuel_cost, driver_pay, other_expenses, net_profit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, loadNumber, truck_id || null, driver_id || null, customer_id || null, source || 'direct', source_ref || null, material || null, pickup_location || null, dropoff_location || null, pickup_date || null, tons || 0, miles || 0, rate_per_ton || 0, rate_per_mile || 0, flat_rate || 0, rate_type || 'per_ton', gross, fuel_cost || 0, driver_pay || 0, other_expenses || 0, net, notes || null);
  res.status(201).json(enrichLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(id)));
});

router.put('/:id', auth, (req, res) => {
  const load = db.prepare('SELECT * FROM loads WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!load) return res.status(404).json({ error: 'Not found' });
  const updatable = ['truck_id','driver_id','customer_id','source','source_ref','material','pickup_location','dropoff_location','pickup_date','delivery_date','tons','miles','rate_per_ton','rate_per_mile','flat_rate','rate_type','fuel_cost','driver_pay','other_expenses','notes','paid','invoice_sent'];
  const updates = {};
  updatable.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (Object.keys(updates).length) {
    const merged = { ...load, ...updates };
    const { gross, net } = calcProfit(merged);
    updates.gross_revenue = gross;
    updates.net_profit = net;
    updates.updated_at = new Date().toISOString();
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE loads SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  }
  res.json(enrichLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id)));
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const extra = {};
  if (status === 'delivered') extra.delivery_date = new Date().toISOString().split('T')[0];
  if (status === 'paid') extra.paid = 1;
  db.prepare(`UPDATE loads SET status = ?, updated_at = ? ${Object.keys(extra).map(k => ', ' + k + ' = ?').join('')} WHERE id = ? AND company_id = ?`).run(status, new Date().toISOString(), ...Object.values(extra), req.params.id, req.user.company_id);
  res.json(enrichLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM loads WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

module.exports = router;
