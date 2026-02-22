const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { requireOwner } = require('../middleware/roles');

router.get('/summary', auth, requireOwner, (req, res) => {
  const cid = req.user.company_id;

  const total     = db.prepare('SELECT COUNT(*) as n FROM loads WHERE company_id = ?').get(cid).n;
  const active    = db.prepare("SELECT COUNT(*) as n FROM loads WHERE company_id = ? AND status NOT IN ('delivered','invoiced','paid')").get(cid).n;
  const delivered = db.prepare("SELECT COUNT(*) as n FROM loads WHERE company_id = ? AND status IN ('delivered','invoiced','paid')").get(cid).n;
  const grossRev  = db.prepare('SELECT COALESCE(SUM(gross_revenue),0) as r FROM loads WHERE company_id = ?').get(cid).r;
  const netProfit = db.prepare('SELECT COALESCE(SUM(net_profit),0) as p FROM loads WHERE company_id = ?').get(cid).p;
  const unpaid    = db.prepare("SELECT COUNT(*) as n, COALESCE(SUM(gross_revenue),0) as amount FROM loads WHERE company_id = ? AND paid = 0 AND status IN ('delivered','invoiced')").get(cid);

  // Expense breakdown
  const totalFuel       = db.prepare('SELECT COALESCE(SUM(fuel_cost),0) as s FROM loads WHERE company_id = ?').get(cid).s;
  const totalDriverPay  = db.prepare('SELECT COALESCE(SUM(driver_pay),0) as s FROM loads WHERE company_id = ?').get(cid).s;
  const totalFuelSpend  = db.prepare('SELECT COALESCE(SUM(total_cost),0) as s FROM fuel_logs WHERE company_id = ?').get(cid).s;
  const totalMaintCost  = db.prepare('SELECT COALESCE(SUM(cost),0) as s FROM maintenance_logs WHERE company_id = ?').get(cid).s;

  // Source profitability — the Aggtrans/AggDirect killer stat
  const bySource = db.prepare(`
    SELECT source,
      COUNT(*) as loads,
      COALESCE(SUM(gross_revenue),0) as gross,
      COALESCE(SUM(net_profit),0) as net,
      COALESCE(SUM(driver_pay),0) as driver_cost,
      COALESCE(SUM(fuel_cost),0) as fuel_cost,
      CASE WHEN SUM(gross_revenue) > 0
        THEN ROUND(SUM(net_profit)/SUM(gross_revenue)*100, 1)
        ELSE 0
      END as margin_pct
    FROM loads WHERE company_id = ? GROUP BY source ORDER BY gross DESC
  `).all(cid);

  const byStatus   = db.prepare('SELECT status, COUNT(*) as count FROM loads WHERE company_id = ? GROUP BY status').all(cid);
  const byMaterial = db.prepare('SELECT material, COUNT(*) as count, COALESCE(SUM(gross_revenue),0) as revenue, COALESCE(SUM(net_profit),0) as profit FROM loads WHERE company_id = ? GROUP BY material ORDER BY revenue DESC').all(cid);

  const byTruck = db.prepare(`
    SELECT t.id, t.name, t.plate, t.current_mileage, t.dot_inspection_date, t.registration_expiry,
      COUNT(l.id) as loads,
      COALESCE(SUM(l.gross_revenue),0) as revenue,
      COALESCE(SUM(l.net_profit),0) as profit,
      COALESCE(SUM(l.fuel_cost),0) as fuel,
      COALESCE(SUM(l.driver_pay),0) as driver_pay,
      CASE WHEN SUM(l.gross_revenue) > 0
        THEN ROUND(SUM(l.net_profit)/SUM(l.gross_revenue)*100,1)
        ELSE 0 END as margin_pct
    FROM trucks t LEFT JOIN loads l ON l.truck_id = t.id
    WHERE t.company_id = ? GROUP BY t.id
  `).all(cid);

  const byDriver = db.prepare(`
    SELECT d.id, d.name, d.pay_type, d.pay_rate,
      COUNT(l.id) as loads,
      COALESCE(SUM(l.gross_revenue),0) as revenue,
      COALESCE(SUM(l.driver_pay),0) as earned
    FROM drivers d LEFT JOIN loads l ON l.driver_id = d.id
    WHERE d.company_id = ? GROUP BY d.id ORDER BY earned DESC
  `).all(cid);

  const recent = db.prepare(`
    SELECT l.*, t.name as truck_name, c.name as customer_name
    FROM loads l
    LEFT JOIN trucks t ON t.id = l.truck_id
    LEFT JOIN customers c ON c.id = l.customer_id
    WHERE l.company_id = ? ORDER BY l.updated_at DESC LIMIT 10
  `).all(cid);

  res.json({
    total, active, delivered, grossRev, netProfit, unpaid,
    expenses: { fuel: totalFuel, driverPay: totalDriverPay, fuelActual: totalFuelSpend, maintenance: totalMaintCost },
    bySource, byStatus, byMaterial, byTruck, byDriver, recent
  });
});

module.exports = router;
