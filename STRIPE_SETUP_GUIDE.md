# 🚀 Stripe Checkout Setup Guide for FinanceFlow

This guide will help you set up Stripe Checkout for your FinanceFlow platform to accept monthly subscription payments.

## 📋 Prerequisites

- ✅ Stripe account (sign up at [stripe.com](https://stripe.com))
- ✅ Basic backend server (Node.js, Python, PHP, etc.)
- ✅ Your domain name (for webhooks and redirects)

## 🎯 Quick Overview

Instead of complex Stripe Elements integration, we'll use **Stripe Checkout** which:
- ✅ Redirects users to Stripe's secure payment page
- ✅ Handles all PCI compliance
- ✅ Supports multiple payment methods
- ✅ Built-in fraud protection
- ✅ Mobile-optimized experience

---

## Step 1: Create Subscription Products

### 1.1 Go to Stripe Dashboard
- Login to [dashboard.stripe.com](https://dashboard.stripe.com)
- Navigate to **"Products & Pricing"**

### 1.2 Create Three Products

#### **Starter Plan - $9/month**
- **Name**: "FinanceFlow Starter"
- **Description**: "Perfect for beginners - Up to 10 clients"
- **Price**: $9.00
- **Billing period**: Monthly
- **Recurring**: Yes

#### **Professional Plan - $29/month**
- **Name**: "FinanceFlow Professional"
- **Description**: "Most popular choice - Unlimited clients & AI insights"
- **Price**: $29.00
- **Billing period**: Monthly
- **Recurring**: Yes

#### **Enterprise Plan - $99/month**
- **Name**: "FinanceFlow Enterprise"
- **Description**: "For established businesses - Multiple users & advanced features"
- **Price**: $99.00
- **Billing period**: Monthly
- **Recurring**: Yes

### 1.3 Copy Price IDs
After creating each product, copy their **Price IDs** (they look like `price_1234567890abcdef`)

---

## Step 2: Backend Integration

### 2.1 Install Stripe Library

**For Node.js:**
```bash
npm install stripe
```

**For Python:**
```bash
pip install stripe
```

### 2.2 Create Checkout Session Endpoint

**Node.js Example (Express):**
```javascript
const stripe = require('stripe')('sk_live_YOUR_SECRET_KEY');

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { plan } = req.body; // 'starter', 'professional', or 'enterprise'
    
    const priceIds = {
      starter: 'price_YOUR_STARTER_PRICE_ID',
      professional: 'price_YOUR_PROFESSIONAL_PRICE_ID',
      enterprise: 'price_YOUR_ENTERPRISE_PRICE_ID'
    };
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceIds[plan],
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'https://yourdomain.com/settings-checkout.html?success=true',
      cancel_url: 'https://yourdomain.com/settings-checkout.html?canceled=true',
      customer_email: 'user@example.com', // Get from your user session
    });
    
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Python Example (Flask):**
```python
import stripe
from flask import Flask, request, jsonify

stripe.api_key = "sk_live_YOUR_SECRET_KEY"

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        plan = data['plan']
        
        price_ids = {
            'starter': 'price_YOUR_STARTER_PRICE_ID',
            'professional': 'price_YOUR_PROFESSIONAL_PRICE_ID',
            'enterprise': 'price_YOUR_ENTERPRISE_PRICE_ID'
        }
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_ids[plan],
                'quantity': 1,
            }],
            mode='subscription',
            success_url='https://yourdomain.com/settings-checkout.html?success=true',
            cancel_url='https://yourdomain.com/settings-checkout.html?canceled=true',
            customer_email='user@example.com'  # Get from your user session
        )
        
        return jsonify({'url': session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## Step 3: Update Frontend

### 3.1 Update `settings-checkout.html`

Replace the checkout session URLs in the JavaScript section:

```javascript
// Replace with your actual backend endpoint
const checkoutSessions = {
    starter: '/create-checkout-session',
    professional: '/create-checkout-session', 
    enterprise: '/create-checkout-session'
};

// Update the startCheckout function to use your backend:
async function startCheckout(planType) {
    const btn = event.target;
    const originalText = btn.textContent;
    
    btn.classList.add('checkout-loading');
    btn.textContent = '';
    btn.disabled = true;

    try {
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: planType })
        });
        
        const data = await response.json();
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }
    } catch (error) {
        showNotification('Failed to start checkout: ' + error.message, 'error');
        btn.classList.remove('checkout-loading');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
```

### 3.2 Replace Stripe Publishable Key

In `settings-checkout.html`, replace:
```javascript
const stripe = Stripe('pk_test_your_stripe_publishable_key_here');
```

With your live publishable key:
```javascript
const stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY');
```

---

## Step 4: Set Up Webhooks

### 4.1 Create Webhook Endpoint

**Node.js Example:**
```javascript
app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = 'whsec_YOUR_WEBHOOK_SECRET';
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user's subscription status in your database
      console.log('Subscription created:', session.subscription);
      break;
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      // Update billing history
      console.log('Payment succeeded:', invoice.id);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      // Handle plan changes
      console.log('Subscription updated:', subscription.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.json({received: true});
});
```

### 4.2 Configure Webhook in Stripe Dashboard

1. Go to **Developers → Webhooks**
2. **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/webhook`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Copy the **Webhook signing secret** (`whsec_...`)

---

## Step 5: Test the Integration

### 5.1 Test Mode
Before going live:
1. Use test API keys (`pk_test_...` and `sk_test_...`)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0027 6000 3184`

### 5.2 Test the Flow
1. Go to Settings page
2. Click "Change Plan"
3. Select a plan
4. Complete payment on Stripe Checkout
5. Verify webhook receives the event
6. Check subscription status in your database

---

## Step 6: Go Live

### 6.1 Switch to Live Mode
1. Replace test API keys with live keys
2. Update webhook endpoint to live mode
3. Test with real card (small amount)

### 6.2 Update Your Platform
- Change all `pk_test_...` to `pk_live_...`
- Change all `sk_test_...` to `sk_live_...`
- Update webhook secret to live version

---

## 🔧 Troubleshooting

### Common Issues:

1. **"No such price" error**
   - Check your price IDs are correct
   - Ensure you're using the right API keys

2. **Webhook not receiving events**
   - Verify webhook URL is correct
   - Check webhook secret is properly set
   - Ensure webhook is listening to correct events

3. **CORS errors**
   - Add proper CORS headers to your backend
   - Ensure your domain is allowed

4. **Checkout session creation fails**
   - Verify your backend is running
   - Check API keys have proper permissions
   - Ensure price IDs are from the same account

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Subscription Guide](https://stripe.com/docs/billing/subscriptions/checkout)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)

---

## 🎉 Success!

Once complete, your FinanceFlow platform will:
- ✅ Accept monthly subscription payments
- ✅ Handle plan upgrades/downgrades
- ✅ Generate invoices automatically
- ✅ Send payment confirmations
- ✅ Manage billing history

**Need help?** Check the browser console on the settings page for detailed setup instructions!