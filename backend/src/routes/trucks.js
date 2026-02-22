const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, (req, res) => {
  const trucks = db.prepare(`
    SELECT t.*, COUNT(l.id) as total_loads, COALESCE(SUM(l.net_profit),0) as total_revenue
    FROM trucks t LEFT JOIN loads l ON l.truck_id = t.id
    WHERE t.company_id = ? GROUP BY t.id
  `).all(req.user.company_id);
  res.json({ trucks });
});

router.post('/', auth, (req, res) => {
  const { name, year, make, model, plate, vin } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO trucks (id, company_id, name, year, make, model, plate, vin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, req.user.company_id, name, year, make, model, plate, vin || null);
  res.status(201).json(db.prepare('SELECT * FROM trucks WHERE id = ?').get(id));
});

router.put('/:id', auth, (req, res) => {
  const { name, year, make, model, plate, vin, status, current_mileage } = req.body;
  db.prepare('UPDATE trucks SET name=?, year=?, make=?, model=?, plate=?, vin=?, status=?, current_mileage=? WHERE id=? AND company_id=?').run(name, year, make, model, plate, vin, status, current_mileage, req.params.id, req.user.company_id);
  res.json(db.prepare('SELECT * FROM trucks WHERE id = ?').get(req.params.id));
});

module.exports = router;
