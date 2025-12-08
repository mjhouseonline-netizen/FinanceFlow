const fs = require('fs');
if (process.env.MAIN_JS_OVERRIDE) {
  fs.writeFileSync(__dirname + '/main.js', process.env.MAIN_JS_OVERRIDE);
  console.log('✅ main.js overwritten from env');
}
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// CORS - allow your frontend
const corsOptions = {
  origin: ['https://financeflow.skillsoul.store', 'http://localhost:5500'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/webhook', express.raw({ type: 'application/json' })); // raw body for Stripe

// health
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ----------  CHECKOUT  ----------
app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/success.html`,
      cancel_url:  `${req.headers.origin}/index.html`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------  WEBHOOK  ----------
app.post('/api/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('⚠️  Webhook signature invalid', err.message);
    return res.status(400).send('Invalid signature');
  }
  console.log('✅ Webhook received', event.type, event.data.object.id);
  // TODO: save subscription / payment to DB
  res.json({ received: true });
});

// ----------  DASHBOARD DATA  ----------
app.get('/api/dashboard', async (_, res) => {
  // TODO: pull real Stripe data from DB
  res.json({
    revenue: 47250,
    subscriptions: 328,
    outstanding: 12300,
    budgetPercent: 68,
    taxDeductible: 8940,
  });
});

// ----------  START  ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API on port ${PORT}`));