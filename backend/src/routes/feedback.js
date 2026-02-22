const router = require('express').Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    app TEXT DEFAULT 'haulcommand',
    tester_name TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    message TEXT NOT NULL,
    expected TEXT,
    page TEXT,
    status TEXT DEFAULT 'new',
    routed_to TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

router.post('/', (req, res) => {
  const { tester_name, category, priority, message, expected, page, routed_to } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO feedback (id, app, tester_name, category, priority, message, expected, page, routed_to) VALUES (?, 'haulcommand', ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, tester_name || 'Anonymous', category || 'general', priority || 'medium', message.trim(), expected || null, page || null, routed_to || null);
  res.status(201).json({ ok: true, id });
});

router.get('/', (req, res) => {
  const feedback = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
  res.json({ feedback });
});

module.exports = router;
