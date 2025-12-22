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

// NEW: auto-create all tables on startup
async function initDb() {
  try {
    // Users table
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

    // Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        revenue DECIMAL(10,2) DEFAULT 0,
        balance DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ clients table is ready');

    // Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        client TEXT,
        category TEXT,
        tax_deductible BOOLEAN DEFAULT false,
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ expenses table is ready');

    // Invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_name TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        due_date DATE NOT NULL,
        paid_date DATE,
        items JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ invoices table is ready');

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

// ----------  DASHBOARD DATA (user-specific)  ----------
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    // Get total expenses
    const expensesResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1',
      [req.user.id]
    );

    // Get total tax deductible expenses
    const taxResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1 AND tax_deductible = true',
      [req.user.id]
    );

    // Get total revenue from clients
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(revenue), 0) as total FROM clients WHERE user_id = $1',
      [req.user.id]
    );

    // Get outstanding invoices
    const outstandingResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );

    // Get count of active clients (clients with revenue > 0)
    const clientsResult = await pool.query(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = $1 AND revenue > 0',
      [req.user.id]
    );

    const totalExpenses = parseFloat(expensesResult.rows[0].total);
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Calculate budget percentage (expenses / revenue * 100)
    let budgetPercent = 0;
    if (totalRevenue > 0) {
      budgetPercent = Math.round((totalExpenses / totalRevenue) * 100);
    }

    res.json({
      revenue: totalRevenue,
      subscriptions: parseInt(clientsResult.rows[0].count),
      outstanding: parseFloat(outstandingResult.rows[0].total),
      budgetPercent: budgetPercent,
      taxDeductible: parseFloat(taxResult.rows[0].total)
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Could not load dashboard data' });
  }
});

// ----------  EXPENSES CRUD  ----------
// GET /api/expenses - Get all expenses for logged-in user
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Could not load expenses' });
  }
});

// POST /api/expenses - Create new expense
app.post('/api/expenses', requireAuth, async (req, res) => {
  try {
    const { amount, description, date, client, category, tax_deductible, receipt_url } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ error: 'Amount and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, description, date, client, category, tax_deductible, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, amount, description, date, client, category, tax_deductible || false, receipt_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Could not create expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Could not delete expense' });
  }
});

// ----------  CLIENTS CRUD  ----------
// GET /api/clients - Get all clients for logged-in user
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Could not load clients' });
  }
});

// POST /api/clients - Create new client
app.post('/api/clients', requireAuth, async (req, res) => {
  try {
    const { name, email, revenue, balance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const result = await pool.query(
      `INSERT INTO clients (user_id, name, email, revenue, balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name, email, revenue || 0, balance || 0]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Could not create client' });
  }
});

// DELETE /api/clients/:id - Delete client
app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Could not delete client' });
  }
});

// ----------  INVOICES CRUD  ----------
// GET /api/invoices - Get all invoices for logged-in user
app.get('/api/invoices', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY due_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Could not load invoices' });
  }
});

// POST /api/invoices - Create new invoice
app.post('/api/invoices', requireAuth, async (req, res) => {
  try {
    const { client_name, amount, status, due_date, paid_date, items } = req.body;

    if (!client_name || !amount || !due_date) {
      return res.status(400).json({ error: 'Client name, amount, and due date are required' });
    }

    const result = await pool.query(
      `INSERT INTO invoices (user_id, client_name, amount, status, due_date, paid_date, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, client_name, amount, status || 'pending', due_date, paid_date, items]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Could not create invoice' });
  }
});

// PUT /api/invoices/:id - Update invoice (e.g., mark as paid)
app.put('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, amount, status, due_date, paid_date, items } = req.body;

    const result = await pool.query(
      `UPDATE invoices
       SET client_name = COALESCE($1, client_name),
           amount = COALESCE($2, amount),
           status = COALESCE($3, status),
           due_date = COALESCE($4, due_date),
           paid_date = $5,
           items = COALESCE($6, items)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [client_name, amount, status, due_date, paid_date, items, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Could not update invoice' });
  }
});

// DELETE /api/invoices/:id - Delete invoice
app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Could not delete invoice' });
  }
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