const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const auth    = require('../middleware/auth');
const { requireOwner } = require('../middleware/roles');
const { v4: uuidv4 }   = require('uuid');

const ROLE_META = {
  owner:          { label: 'Owner',          desc: 'Full access. Manages all loads, trucks, drivers, and financials.' },
  owner_operator: { label: 'Owner-Operator', desc: 'Drives their own truck AND runs the business. Full access + driver workflow.' },
  driver:         { label: 'Driver',         desc: 'Road only. Sees and updates their assigned loads. No financials.' },
};

// GET all team members
router.get('/', auth, requireOwner, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.phone, u.truck_id,
           t.name as truck_name, t.plate as truck_plate,
           COUNT(l.id) as total_loads,
           COALESCE(SUM(l.driver_pay),0) as total_earned
    FROM users u
    LEFT JOIN trucks t ON t.id = u.truck_id
    LEFT JOIN loads l ON l.driver_id = u.id
    WHERE u.company_id = ?
    GROUP BY u.id
    ORDER BY CASE u.role WHEN 'owner' THEN 1 WHEN 'owner_operator' THEN 2 ELSE 3 END, u.name
  `).all(req.user.company_id);
  res.json({ users, roleMeta: ROLE_META });
});

// POST create team member
router.post('/', auth, requireOwner, (req, res) => {
  const { name, email, password, role, phone, truck_id } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'name, email, password required' });
  if (!ROLE_META[role]) return res.status(400).json({ error: `role must be: ${Object.keys(ROLE_META).join(', ')}` });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const id = uuidv4();
  db.prepare(`INSERT INTO users (id, company_id, name, email, password_hash, role, phone, truck_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.company_id, name.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10), role, phone||null, truck_id||null);

  res.status(201).json(db.prepare('SELECT id, name, email, role, phone, truck_id FROM users WHERE id = ?').get(id));
});

// PUT update team member
router.put('/:id', auth, requireOwner, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const ALLOWED_USER_FIELDS = ['name','phone','role','email','password'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED_USER_FIELDS.includes(k)));
  const fields = []; const vals = [];
  if (updates.name)     { fields.push('name = ?');          vals.push(updates.name.trim()); }
  if (updates.email)    { fields.push('email = ?');         vals.push(updates.email.trim().toLowerCase()); }
  if (updates.password) { fields.push('password_hash = ?'); vals.push(bcrypt.hashSync(updates.password, 10)); }
  if (updates.role)     { fields.push('role = ?');          vals.push(updates.role); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); vals.push(updates.phone || null); }
  if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });
  vals.push(req.params.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT id, name, email, role, phone, truck_id FROM users WHERE id = ?').get(req.params.id));
});

// DELETE
router.delete('/:id', auth, requireOwner, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  db.prepare('DELETE FROM users WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.json({ ok: true });
});

module.exports = router;
