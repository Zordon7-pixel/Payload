const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/summary', auth, (req, res) => {
  const cid = req.user.company_id;
  const total = db.prepare('SELECT COUNT(*) as n FROM loads WHERE company_id = ?').get(cid).n;
  const active = db.prepare("SELECT COUNT(*) as n FROM loads WHERE company_id = ? AND status NOT IN ('delivered','invoiced','paid')").get(cid).n;
  const delivered = db.prepare("SELECT COUNT(*) as n FROM loads WHERE company_id = ? AND status IN ('delivered','invoiced','paid')").get(cid).n;
  const grossRev = db.prepare('SELECT COALESCE(SUM(gross_revenue),0) as r FROM loads WHERE company_id = ?').get(cid).r;
  const netProfit = db.prepare('SELECT COALESCE(SUM(net_profit),0) as p FROM loads WHERE company_id = ?').get(cid).p;
  const unpaid = db.prepare("SELECT COUNT(*) as n, COALESCE(SUM(gross_revenue),0) as amount FROM loads WHERE company_id = ? AND paid = 0 AND status IN ('delivered','invoiced')").get(cid);
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM loads WHERE company_id = ? GROUP BY status').all(cid);
  const byMaterial = db.prepare('SELECT material, COUNT(*) as count, SUM(gross_revenue) as revenue FROM loads WHERE company_id = ? GROUP BY material').all(cid);
  const byTruck = db.prepare(`
    SELECT t.name, t.plate, COUNT(l.id) as loads, COALESCE(SUM(l.gross_revenue),0) as revenue, COALESCE(SUM(l.net_profit),0) as profit
    FROM trucks t LEFT JOIN loads l ON l.truck_id = t.id
    WHERE t.company_id = ? GROUP BY t.id
  `).all(cid);
  const recent = db.prepare(`
    SELECT l.*, t.name as truck_name, c.name as customer_name
    FROM loads l LEFT JOIN trucks t ON t.id = l.truck_id LEFT JOIN customers c ON c.id = l.customer_id
    WHERE l.company_id = ? ORDER BY l.updated_at DESC LIMIT 10
  `).all(cid);
  res.json({ total, active, delivered, grossRev, netProfit, unpaid, byStatus, byMaterial, byTruck, recent });
});

module.exports = router;
