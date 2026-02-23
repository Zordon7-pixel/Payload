const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireOwner: requireAdmin } = require('../middleware/roles');
const db = require('../db');

// GET /api/diagnostics
router.get('/', auth, requireAdmin, (req, res) => {
  const checks = [];

  // 1. DB integrity
  try {
    const result = db.prepare('PRAGMA integrity_check').get();
    checks.push({ name: 'Database Integrity', ok: result.integrity_check === 'ok', detail: result.integrity_check });
  } catch (e) {
    checks.push({ name: 'Database Integrity', ok: false, detail: e.message });
  }

  // 2. Required tables
  const requiredTables = ['companies', 'users', 'trucks', 'loads', 'fuel_logs', 'drivers', 'maintenance_logs', 'posttrip_inspections'];
  for (const t of requiredTables) {
    try {
      db.prepare(`SELECT 1 FROM ${t} LIMIT 1`).get();
      checks.push({ name: `Table: ${t}`, ok: true, detail: 'exists' });
    } catch (e) {
      checks.push({ name: `Table: ${t}`, ok: false, detail: 'missing' });
    }
  }

  // 3. Seed data
  const compCount = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  checks.push({ name: 'Company Record', ok: compCount > 0, detail: `${compCount} company(s)` });
  checks.push({ name: 'User Records', ok: userCount > 0, detail: `${userCount} user(s)` });

  // 4. Invalid load statuses
  const validStatuses = ['pending', 'dispatched', 'loaded', 'in_transit', 'delivered', 'invoiced', 'paid'];
  try {
    const bad = db.prepare(`SELECT COUNT(*) as c FROM loads WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})`).get(...validStatuses);
    checks.push({ name: 'Load Status Validity', ok: bad.c === 0, detail: bad.c > 0 ? `${bad.c} invalid` : 'all valid' });
  } catch (e) {
    checks.push({ name: 'Load Status Validity', ok: false, detail: e.message });
  }

  // 5. Admin user
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('owner','admin')").get().c;
  checks.push({ name: 'Admin Account', ok: adminCount > 0, detail: `${adminCount} admin(s)` });

  res.json({ ok: checks.every((c) => c.ok), canHeal: checks.some((c) => !c.ok), checks });
});

// POST /api/diagnostics/heal
router.post('/heal', auth, requireAdmin, async (req, res) => {
  const actions = [];

  // Fix invalid load statuses
  const validStatuses = ['pending', 'dispatched', 'loaded', 'in_transit', 'delivered', 'invoiced', 'paid'];
  try {
    const r = db.prepare(`UPDATE loads SET status='pending' WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})`).run(...validStatuses);
    if (r.changes > 0) actions.push(`Fixed ${r.changes} invalid load status(es)`);
  } catch (e) {
    actions.push(`⚠️ Load status fix failed: ${e.message}`);
  }

  // Re-seed if missing
  const compCount = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (compCount === 0 || userCount === 0) {
    try {
      require('../db/seed').runSeed();
      actions.push('Re-seeded missing company and user data');
    } catch (e) {
      actions.push(`⚠️ Re-seed failed: ${e.message}`);
    }
  }

  try {
    db.exec('VACUUM');
    actions.push('Database compacted');
  } catch (e) {}

  // Log to Control Room
  try {
    const actPath = '/Users/zordon/.openclaw/workspace/second-brain/data/activity.json';
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(actPath, 'utf8'));
    data.activity.push({
      id: `act-heal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'diagnostic',
      icon: '🔧',
      message: `PAYLOAD self-heal ran: ${actions.length} action(s)`,
      detail: actions.join('; ')
    });
    fs.writeFileSync(actPath, JSON.stringify(data, null, 2));
  } catch (e) {}

  if (actions.length === 0) actions.push('No issues found — everything looks healthy');
  res.json({ ok: true, actions });
});

module.exports = router;
