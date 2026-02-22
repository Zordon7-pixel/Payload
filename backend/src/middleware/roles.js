// PAYLOAD Role-Based Access Control
//
// owner         — full business access, never drives
// driver        — road only, their assigned loads, no financials
// owner_operator— full owner access + driver workflow (drives their own truck)

const OWNER_ROLES  = ['owner', 'owner_operator'];
const DRIVER_ROLES = ['driver', 'owner_operator'];

const requireOwner = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!OWNER_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Owner access required' });
  next();
};

// Driver OR owner can access (owner needs to see load details too)
const requireAny = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const isOwner     = (role) => OWNER_ROLES.includes(role);
const isDriver    = (role) => DRIVER_ROLES.includes(role);
const isPureDriver= (role) => role === 'driver';

module.exports = { requireOwner, requireAny, isOwner, isDriver, isPureDriver, OWNER_ROLES, DRIVER_ROLES };
