const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all drivers
router.get('/', auth, (req, res) => {
  const drivers = db.prepare(`
    SELECT d.*,
      COUNT(l.id) as total_loads,
      COALESCE(SUM(l.gross_revenue),0) as total_revenue,
      COALESCE(SUM(l.driver_pay),0) as total_pay
    FROM drivers d
    LEFT JOIN loads l ON l.driver_id = d.id
    WHERE d.company_id = ?
    GROUP BY d.id
    ORDER BY d.name ASC
  `).all(req.user.company_id);
  res.json({ drivers });
});

// GET single driver
router.get('/:id', auth, (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!driver) return res.status(404).json({ error: 'Not found' });
  const loads = db.prepare(`
    SELECT l.*, t.name as truck_name
    FROM loads l LEFT JOIN trucks t ON t.id = l.truck_id
    WHERE l.driver_id = ? ORDER BY l.pickup_date DESC LIMIT 20
  `).all(req.params.id);
  res.json({ driver, loads });
});

// POST create driver
router.post('/', auth, (req, res) => {
  const { name, phone, email, cdl_number, cdl_expiry, medical_card_expiry, pay_type, pay_rate, notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO drivers (id, company_id, name, phone, email, cdl_number, cdl_expiry, medical_card_expiry, pay_type, pay_rate, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, name.trim(), phone||null, email||null, cdl_number||null, cdl_expiry||null, medical_card_expiry||null, pay_type||'percent', parseFloat(pay_rate)||25, notes||null);
  res.status(201).json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(id));
});

// PUT update driver
router.put('/:id', auth, (req, res) => {
  const d = db.prepare('SELECT id FROM drivers WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  const fields = ['name','phone','email','cdl_number','cdl_expiry','medical_card_expiry','pay_type','pay_rate','status','notes'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id);
  db.prepare(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
});

// DELETE driver
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM drivers WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

module.exports = router;
