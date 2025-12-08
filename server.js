const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.origin}/success.html`,
    cancel_url: `${req.headers.origin}/index.html`,
  });
  res.json({ url: session.url });
});

// Stripe Webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature invalid', err);
    return res.status(400).send('Invalid signature');
  }
  console.log('✅ Webhook received', event.type);
  // TODO: save to DB, update dashboard, etc.
  res.json({ received: true });
});

// Dashboard data endpoint
app.get('/api/dashboard', async (_, res) => {
  // TODO: replace with real DB calls
  res.json({
    revenue: 47250,
    subscriptions: 328,
    outstanding: 12300,
    budgetPercent: 68,
    taxDeductible: 8940,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on ${PORT}`));