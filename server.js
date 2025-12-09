// server.js - FinanceFlow API (backend)

// Core dependencies
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create app
const app = express();

// Parse JSON request bodies
app.use(express.json());

// ---------------------------------------------
// CORS – allow your static frontend + local dev
// ---------------------------------------------
const corsOptions = {
  origin: [
    'https://financeflow.skillsoul.store', // your static site
    'http://localhost:5500'                // optional local dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ---------------------------------------------
// Simple health-check route
// ---------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'unknown',
    time: new Date().toISOString()
  });
});

// ---------------------------------------------
// Dashboard data (dummy values for now)
// ---------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  // Later you can replace this with real Stripe / DB data.
  res.json({
    revenue: 47250,
    subscriptions: 328,
    outstanding: 12300,
    budgetPercent: 68,
    taxDeductible: 8940
  });
});

// ---------------------------------------------
// Stripe Checkout – create session
// POST /api/create-checkout-session
// body: { priceId: "price_xxx" }
// ---------------------------------------------
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId in request body' });
    }

    // Frontend domain for redirect URLs
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

// ---------------------------------------------
// 404 handler for unknown routes
// ---------------------------------------------
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------
// Start server
// ---------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 FinanceFlow API listening on port ${PORT}`);
});
