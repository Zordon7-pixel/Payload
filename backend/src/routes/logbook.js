const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');
const { isPureDriver } = require('../middleware/roles');
const { v4: uuidv4 }   = require('uuid');

// ─────────────────────────────────────────
//  DAILY LOGS
// ─────────────────────────────────────────

// GET daily logs — drivers see their own, owners see all
router.get('/logs', auth, (req, res) => {
  const driverFilter = isPureDriver(req.user.role) ? 'AND l.driver_id = ?' : '';
  const params = isPureDriver(req.user.role)
    ? [req.user.company_id, req.user.id]
    : [req.user.company_id];

  const logs = db.prepare(`
    SELECT l.*, u.name as driver_name, t.name as truck_name, t.plate as truck_plate
    FROM daily_logs l
    LEFT JOIN users u ON u.id = l.driver_id
    LEFT JOIN trucks t ON t.id = l.truck_id
    WHERE l.company_id = ? ${driverFilter}
    ORDER BY l.log_date DESC, l.created_at DESC
    LIMIT 60
  `).all(...params);

  res.json({ logs });
});

// POST create daily log
router.post('/logs', auth, (req, res) => {
  const { truck_id, log_date, start_mileage, end_mileage, loads_completed, weather, notes, incidents } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO daily_logs (id, company_id, driver_id, truck_id, log_date, start_mileage, end_mileage, loads_completed, weather, notes, incidents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, req.user.id, truck_id||null,
    log_date || new Date().toISOString().split('T')[0],
    start_mileage||null, end_mileage||null,
    parseInt(loads_completed)||0, weather||null, notes||null, incidents||null
  );
  // Update truck mileage
  if (end_mileage && truck_id) {
    db.prepare('UPDATE trucks SET current_mileage = ? WHERE id = ? AND company_id = ?').run(end_mileage, truck_id, req.user.company_id);
  }
  res.status(201).json(db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(id));
});

// DELETE daily log
router.delete('/logs/:id', auth, (req, res) => {
  db.prepare('DELETE FROM daily_logs WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────
//  PRE-TRIP INSPECTIONS
// ─────────────────────────────────────────

// GET inspections — drivers see their own, owners see all
router.get('/inspections', auth, (req, res) => {
  const driverFilter = isPureDriver(req.user.role) ? 'AND i.driver_id = ?' : '';
  const params = isPureDriver(req.user.role)
    ? [req.user.company_id, req.user.id]
    : [req.user.company_id];

  const inspections = db.prepare(`
    SELECT i.*, u.name as driver_name, t.name as truck_name, t.plate as truck_plate
    FROM pretrip_inspections i
    LEFT JOIN users u ON u.id = i.driver_id
    LEFT JOIN trucks t ON t.id = i.truck_id
    WHERE i.company_id = ? ${driverFilter}
    ORDER BY i.inspection_date DESC, i.created_at DESC
    LIMIT 60
  `).all(...params);

  // Parse JSON items field
  const parsed = inspections.map(i => ({ ...i, items: JSON.parse(i.items || '{}') }));
  res.json({ inspections: parsed });
});

// POST submit a pre-trip inspection
router.post('/inspections', auth, (req, res) => {
  const { truck_id, inspection_date, inspection_time, odometer, items, defects_noted, driver_signature } = req.body;
  if (!items || typeof items !== 'object') return res.status(400).json({ error: 'items object required' });
  if (!truck_id) return res.status(400).json({ error: 'truck_id required' });

  // overall_pass = false if ANY item is 'fail'
  const overall_pass = !Object.values(items).some(v => v === 'fail') ? 1 : 0;
  const id = uuidv4();
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  db.prepare(`
    INSERT INTO pretrip_inspections (id, company_id, driver_id, truck_id, inspection_date, inspection_time, odometer, items, overall_pass, defects_noted, driver_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, req.user.id, truck_id,
    inspection_date || today, inspection_time || now,
    odometer||null, JSON.stringify(items), overall_pass,
    defects_noted||null, driver_signature||null
  );

  if (odometer && truck_id) {
    db.prepare('UPDATE trucks SET current_mileage = ? WHERE id = ? AND company_id = ?').run(odometer, truck_id, req.user.company_id);
  }

  res.status(201).json({ id, overall_pass: overall_pass === 1, defects_noted });
});

// ─────────────────────────────────────────
//  POST-TRIP INSPECTIONS
// ─────────────────────────────────────────

// GET post-trip inspections
router.get('/posttrip', auth, (req, res) => {
  const driverFilter = isPureDriver(req.user.role) ? 'AND i.driver_id = ?' : '';
  const params = isPureDriver(req.user.role)
    ? [req.user.company_id, req.user.id]
    : [req.user.company_id];

  const inspections = db.prepare(`
    SELECT i.*, u.name as driver_name, t.name as truck_name, t.plate as truck_plate
    FROM posttrip_inspections i
    LEFT JOIN users u ON u.id = i.driver_id
    LEFT JOIN trucks t ON t.id = i.truck_id
    WHERE i.company_id = ? ${driverFilter}
    ORDER BY i.inspection_date DESC, i.created_at DESC
    LIMIT 60
  `).all(...params);

  const parsed = inspections.map(i => ({ ...i, items: JSON.parse(i.items || '{}') }));
  res.json({ inspections: parsed });
});

// POST submit a post-trip inspection
router.post('/posttrip', auth, (req, res) => {
  const { truck_id, inspection_date, odometer, items, defects_noted, driver_signature } = req.body;
  if (!items || typeof items !== 'object') return res.status(400).json({ error: 'items object required' });
  if (!truck_id) return res.status(400).json({ error: 'truck_id required' });

  const overall_pass = !Object.values(items).some(v => v === 'fail') ? 1 : 0;
  const id = uuidv4();
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const repair_status = overall_pass ? 'none' : 'pending';

  db.prepare(`
    INSERT INTO posttrip_inspections (id, company_id, driver_id, truck_id, inspection_date, inspection_time, odometer, items, overall_pass, defects_noted, driver_signature, repair_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.company_id, req.user.id, truck_id,
    inspection_date || today, now,
    odometer || null, JSON.stringify(items), overall_pass,
    defects_noted || null, driver_signature || null, repair_status
  );

  if (odometer && truck_id) {
    db.prepare('UPDATE trucks SET current_mileage = ? WHERE id = ? AND company_id = ?').run(odometer, truck_id, req.user.company_id);
  }

  res.status(201).json({ id, overall_pass: overall_pass === 1, repair_status, defects_noted });
});

// PATCH update repair status (owner only)
router.patch('/posttrip/:id/repair', auth, (req, res) => {
  const { repair_status, repair_notes } = req.body;
  const valid = ['pending', 'scheduled', 'repaired'];
  if (!valid.includes(repair_status)) return res.status(400).json({ error: 'Invalid repair_status' });

  db.prepare(`
    UPDATE posttrip_inspections SET repair_status = ?, repair_notes = ? WHERE id = ? AND company_id = ?
  `).run(repair_status, repair_notes || null, req.params.id, req.user.company_id);

  res.json({ ok: true });
});

module.exports = router;
