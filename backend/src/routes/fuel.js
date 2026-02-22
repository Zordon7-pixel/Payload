const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all fuel logs + per-truck MPG summary
router.get('/', auth, (req, res) => {
  const cid = req.user.company_id;
  const logs = db.prepare(`
    SELECT f.*, t.name as truck_name, t.plate as truck_plate
    FROM fuel_logs f
    LEFT JOIN trucks t ON t.id = f.truck_id
    WHERE f.company_id = ?
    ORDER BY f.log_date DESC LIMIT 100
  `).all(cid);

  const summary = db.prepare(`
    SELECT t.id, t.name, t.plate,
      COUNT(f.id) as fill_ups,
      COALESCE(SUM(f.gallons),0) as total_gallons,
      COALESCE(SUM(f.total_cost),0) as total_spend,
      CASE WHEN SUM(f.gallons) > 0 THEN ROUND(SUM(f.total_cost)/SUM(f.gallons),3) ELSE 0 END as avg_price_per_gallon
    FROM trucks t
    LEFT JOIN fuel_logs f ON f.truck_id = t.id
    WHERE t.company_id = ?
    GROUP BY t.id
    ORDER BY t.name
  `).all(cid);

  const totalSpend = db.prepare(`SELECT COALESCE(SUM(total_cost),0) as s FROM fuel_logs WHERE company_id = ?`).get(cid).s;
  res.json({ logs, summary, totalSpend });
});

// POST log a fuel fill-up
router.post('/', auth, (req, res) => {
  const { truck_id, driver_id, log_date, gallons, price_per_gallon, total_cost, odometer, location, notes } = req.body;
  if (!truck_id || !gallons) return res.status(400).json({ error: 'truck_id and gallons required' });
  const id = uuidv4();
  const totalCost = total_cost || (parseFloat(gallons) * parseFloat(price_per_gallon || 0));
  db.prepare(`
    INSERT INTO fuel_logs (id, company_id, truck_id, driver_id, log_date, gallons, price_per_gallon, total_cost, odometer, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, truck_id, driver_id||null,
    log_date || new Date().toISOString().split('T')[0],
    parseFloat(gallons), parseFloat(price_per_gallon||0), parseFloat(totalCost),
    odometer||null, location||null, notes||null
  );
  if (odometer) db.prepare('UPDATE trucks SET current_mileage = ? WHERE id = ? AND company_id = ?').run(odometer, truck_id, req.user.company_id);
  res.status(201).json(db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(id));
});

// DELETE
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM fuel_logs WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

module.exports = router;
