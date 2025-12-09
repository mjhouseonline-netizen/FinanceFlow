const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// ----------  MIDDLEWARE  ----------
app.use(express.json());

const corsOptions = {
  origin: [
    'https://financeflow.skillsoul.store',
    'http://localhost:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ----------  DATABASE (Postgres)  ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// NEW: auto-create users table on startup
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        plan TEXT NOT NULL DEFAULT 'starter',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ users table is ready');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

initDb();

// ----------  AUTH HELPERS  ----------
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ----------  HEALTH CHECK  ----------
app.get('/api/health', async (req, res) => {
  try {
    // Simple DB check
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      env: process.env.NODE_ENV || 'unknown',
      time: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health DB error:', err);
    res.status(500).json({ status: 'error', error: 'DB not reachable' });
  }
});

// ----------  AUTH ROUTES  ----------
// POST /api/register  { email, password }
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, plan)
       VALUES ($1, $2, 'user', 'starter')
       RETURNING id, email, role, plan`,
      [email, hash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);

    if (err.code === '23505') {
      // unique_violation
      return res.status(409).json({ error: 'Email already registered' });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/login  { email, password }
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, role, plan, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/me  (requires auth)
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, plan FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Could not load user' });
  }
});

// ----------  STRIPE CHECKOUT  ----------
// NOTE: we are not yet linking to user/plan here – that comes in a later step.
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId in request body' });
    }

    const DOMAIN = process.env.DOMAIN || 'https://financeflow.skillsoul.store';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${DOMAIN}/settings-checkout.html?status=success`,
      cancel_url: `${DOMAIN}/settings-checkout.html?status=cancel`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({
      error: 'Stripe checkout failed',
      details: err.message
    });
  }
});

// ----------  DASHBOARD DATA (still demo)  ----------
app.get('/api/dashboard', async (_req, res) => {
  // TODO in a later step: compute per-user metrics from DB
  res.json({
    revenue: 47250,
    subscriptions: 328,
    outstanding: 12300,
    budgetPercent: 68,
    taxDeductible: 8940
  });
});

// ----------  404 HANDLER  ----------
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ----------  START SERVER  ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 FinanceFlow API listening on port ${PORT}`);
});