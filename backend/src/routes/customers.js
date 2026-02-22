const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, (req, res) => {
  const customers = db.prepare('SELECT * FROM customers WHERE company_id = ? ORDER BY name').all(req.user.company_id);
  res.json({ customers });
});

router.post('/', auth, (req, res) => {
  const { name, contact_name, phone, email, address, source } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO customers (id, company_id, name, contact_name, phone, email, address, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, req.user.company_id, name, contact_name || null, phone || null, email || null, address || null, source || 'direct');
  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id));
});

module.exports = router;
