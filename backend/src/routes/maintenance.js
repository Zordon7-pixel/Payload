const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all maintenance logs + upcoming alerts
router.get('/', auth, (req, res) => {
  const cid = req.user.company_id;

  const logs = db.prepare(`
    SELECT m.*, t.name as truck_name, t.plate as truck_plate
    FROM maintenance_logs m
    LEFT JOIN trucks t ON t.id = m.truck_id
    WHERE m.company_id = ?
    ORDER BY m.service_date DESC
    LIMIT 50
  `).all(cid);

  // Compliance status per truck (DOT, registration, insurance)
  const trucks = db.prepare(`
    SELECT id, name, plate, current_mileage, dot_inspection_date, registration_expiry, insurance_expiry
    FROM trucks WHERE company_id = ? AND status = 'active'
  `).all(cid);

  const today = new Date().toISOString().split('T')[0];
  const in60days = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  const compliance = trucks.map(t => {
    const flags = [];
    if (t.dot_inspection_date  && t.dot_inspection_date  < in60days) flags.push({ type: 'DOT Inspection', due: t.dot_inspection_date });
    if (t.registration_expiry  && t.registration_expiry  < in60days) flags.push({ type: 'Registration',   due: t.registration_expiry });
    if (t.insurance_expiry     && t.insurance_expiry     < in60days) flags.push({ type: 'Insurance',      due: t.insurance_expiry });
    return { ...t, flags };
  });

  res.json({ logs, compliance });
});

// GET logs for a specific truck
router.get('/truck/:truckId', auth, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM maintenance_logs WHERE truck_id = ? AND company_id = ?
    ORDER BY service_date DESC
  `).all(req.params.truckId, req.user.company_id);
  const truck = db.prepare('SELECT * FROM trucks WHERE id = ? AND company_id = ?').get(req.params.truckId, req.user.company_id);
  res.json({ truck, logs });
});

// POST log a maintenance event
router.post('/', auth, (req, res) => {
  const { truck_id, service_type, service_date, mileage, cost, vendor, notes, next_service_date, next_service_mileage } = req.body;
  if (!truck_id || !service_type) return res.status(400).json({ error: 'truck_id and service_type required' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO maintenance_logs (id, company_id, truck_id, service_type, service_date, mileage, cost, vendor, notes, next_service_date, next_service_mileage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, truck_id, service_type, service_date || new Date().toISOString().split('T')[0],
    mileage || null, parseFloat(cost) || 0, vendor || null, notes || null,
    next_service_date || null, next_service_mileage || null
  );
  // Update truck mileage if provided
  if (mileage) db.prepare('UPDATE trucks SET current_mileage = ? WHERE id = ? AND company_id = ?').run(mileage, truck_id, req.user.company_id);
  res.status(201).json(db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id));
});

// PUT update compliance dates on truck
router.put('/truck/:truckId/compliance', auth, (req, res) => {
  const { dot_inspection_date, registration_expiry, insurance_expiry, current_mileage } = req.body;
  const fields = []; const vals = [];
  if (dot_inspection_date != null) { fields.push('dot_inspection_date = ?'); vals.push(dot_inspection_date); }
  if (registration_expiry != null) { fields.push('registration_expiry = ?'); vals.push(registration_expiry); }
  if (insurance_expiry    != null) { fields.push('insurance_expiry = ?');    vals.push(insurance_expiry); }
  if (current_mileage     != null) { fields.push('current_mileage = ?');     vals.push(current_mileage); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.truckId, req.user.company_id);
  db.prepare(`UPDATE trucks SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM trucks WHERE id = ?').get(req.params.truckId));
});

// DELETE log entry
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM maintenance_logs WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

module.exports = router;
