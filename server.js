require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// CORS configured for your custom domain
const corsOptions = {
  origin: [
    'https://financeflow.skillsoul.store',
    'https://www.financeflow.skillsoul.store',
    'http://localhost:5500',
    'http://localhost:4000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Raw body parser for Stripe webhooks
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// In-memory data store (replace with database in production)
let liveData = {
  revenue: 0,
  subscriptions: 0,
  outstanding: 0,
  budgetPercent: 68,
  taxDeductible: 8940,
  lastUpdated: new Date().toISOString()
};

// ========== STRIPE DATA FETCHER ==========
async function fetchStripeData() {
  try {
    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price']
    });

    // Calculate monthly revenue
    let monthlyRevenue = 0;
    let activeCount = 0;

    subscriptions.data.forEach(subscription => {
      if (subscription.items?.data) {
        subscription.items.data.forEach(item => {
          const price = item.price;
          if (price.recurring?.interval === 'month') {
            monthlyRevenue += (price.unit_amount || 0);
          } else if (price.recurring?.interval === 'year') {
            monthlyRevenue += (price.unit_amount || 0) / 12;
          }
        });
      }
      activeCount++;
    });

    // Get outstanding invoices
    const unpaidInvoices = await stripe.invoices.list({
      status: 'open',
      limit: 100
    });

    let outstanding = 0;
    unpaidInvoices.data.forEach(invoice => {
      outstanding += (invoice.amount_due || 0);
    });

    return {
      revenue: Math.round(monthlyRevenue / 100), // Convert cents to dollars
      subscriptions: activeCount,
      outstanding: Math.round(outstanding / 100),
      budgetPercent: 68, // You can implement expense tracking
      taxDeductible: 8940, // You can implement tax calculation
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Stripe fetch error:', error);
    return {
      revenue: 0,
      subscriptions: 0,
      outstanding: 0,
      budgetPercent: 0,
      taxDeductible: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// ========== WEBHOOK ENDPOINT ==========
app.post('/api/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed.`, err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook received:', event.type, '- ID:', event.data.object.id);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('💰 Checkout completed:', session.id);
        
        if (session.subscription) {
          liveData.subscriptions += 1;
          await updateDashboardData();
        }
        break;
        
      case 'customer.subscription.created':
        const createdSubscription = event.data.object;
        console.log('➕ Subscription created:', createdSubscription.id);
        liveData.subscriptions += 1;
        await updateDashboardData();
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('🔄 Subscription updated:', updatedSubscription.id);
        await updateDashboardData();
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        liveData.subscriptions -= 1;
        await updateDashboardData();
        break;
        
      case 'invoice.payment_succeeded':
        const paidInvoice = event.data.object;
        console.log('✅ Invoice paid:', paidInvoice.id);
        if (paidInvoice.status === 'paid') {
          liveData.outstanding -= (paidInvoice.amount_paid / 100);
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('❌ Payment failed:', failedInvoice.id);
        // Handle failed payment - you could email the customer
        break;
        
      default:
        console.log(`📝 Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
  }

  response.json({received: true});
});

// ========== HELPER FUNCTIONS ==========
async function updateDashboardData() {
  try {
    const newData = await fetchStripeData();
    liveData = newData;
    console.log('📊 Dashboard data updated:', newData);
  } catch (error) {
    console.error('❌ Error updating dashboard data:', error);
  }
}

// ========== CHECKOUT SESSION CREATION ==========
app.post('/api/create-checkout-session', async (req, res) => {
  const { plan } = req.body;
  
  const priceIds = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
  };
  
  if (!priceIds[plan]) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceIds[plan], quantity: 1 }],
      success_url: `${process.env.DOMAIN}/success.html`,
      cancel_url: `${process.env.DOMAIN}/index.html`,
      metadata: {
        plan: plan,
        domain: process.env.DOMAIN
      }
    });
    
    console.log('🎯 Checkout session created:', session.id, 'for plan:', plan);
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Checkout session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== API ENDPOINTS ==========
app.get('/api/dashboard', async (req, res) => {
  try {
    const data = await fetchStripeData();
    res.json(data);
  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    res.status(500).json({
      revenue: 0,
      subscriptions: 0,
      outstanding: 0,
      budgetPercent: 0,
      taxDeductible: 0,
      lastUpdated: new Date().toISOString()
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing',
    domain: process.env.DOMAIN,
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========== 404 HANDLER ==========
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
🚀 FinanceFlow Server Started!
📍 Domain: ${process.env.DOMAIN || 'http://localhost:' + PORT}
🔌 Port: ${PORT}
💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Missing'}
🔗 Webhook: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Missing'}
  `);
});