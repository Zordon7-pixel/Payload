require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Refuse to start without JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('[SECURITY] JWT_SECRET env var not set. Refusing to start.');
  process.exit(1);
}

// Seed demo data on first run (safe to call every startup — skips if already seeded)
try { require('./db/seed').runSeed(); } catch (e) { console.error('Seed error:', e.message); }

const app = express();

// CORS — restrict to known origin in production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002',
     'http://localhost:5173', 'http://100.102.219.60:4000', 'http://100.102.219.60:4001', 'http://100.102.219.60:4002'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow same-origin requests (no origin header) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting — auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/loads', require('./routes/loads'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/feedback',    require('./routes/feedback'));
app.use('/api/drivers',    require('./routes/drivers'));
app.use('/api/maintenance',require('./routes/maintenance'));
app.use('/api/fuel',       require('./routes/fuel'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/logbook',    require('./routes/logbook'));
app.use('/api/diagnostics', require('./routes/diagnostics'));

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

const PORT = process.env.PORT || 4001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚛 PAYLOAD running on http://localhost:${PORT}`);
  console.log(`   LAN: http://192.168.1.52:${PORT}`);
});
