# Stripe Webhook Testing Guide

## Current Setup ✅

1. **Stripe CLI Listener**: Running on terminal `aa2cca58-071b-4a62-bc0b-83a99e98e306`
   - Forwarding to: `http://127.0.0.1:4100/v1/webhooks/stripe`
   - Webhook secret: `whsec_2035a7586e4459cbc065d1686bfc7ca0da07d869dd9d16c8656cc3439403d6ea`
   - Listening for: `payment_intent.succeeded` events

2. **Backend**: Running on port 4100
   - Webhook endpoint: `POST /v1/webhooks/stripe`
   - Environment variables configured in `.env.local`

3. **Stripe Test Credentials**: Configured
   - Secret Key: `sk_test_51SlrtL...`
   - Publishable Key: `pk_test_51SlrtL...`
   - Webhook Secret: `whsec_2035a75...`

## How Stripe Webhooks Work

### Option 1: Using Stripe CLI Trigger (Simulated Events)
```bash
# This creates a mock event and sends it directly to your webhook
stripe trigger payment_intent.succeeded
```
**Note**: This does NOT go through the listener. It's a direct simulation.

### Option 2: Real Webhook Flow (Production-Like)
```
1. Create real Stripe resource (PaymentIntent, Customer, etc.)
2. Stripe sends webhook to listener
3. Listener forwards to your local backend
4. Backend processes and responds
```

## Testing Methods

### Method 1: Manual Test with Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. Click "Create payment" 
3. Create a test payment with test card `4242 4242 4242 4242`
4. Stripe will send `payment_intent.succeeded` webhook
5. Check listener output for forwarding confirmation
6. Check backend logs for processing

### Method 2: Using Stripe API (Automated)

Create a test script that makes real API calls:

```javascript
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51SlrtL...');

// Create a payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
});

// Confirm it with test card
await stripe.paymentIntents.confirm(paymentIntent.id, {
  payment_method: 'pm_card_visa', // Test payment method
});
// This will trigger payment_intent.succeeded webhook
```

### Method 3: Direct Webhook Simulation (Testing Endpoint Only)

Send a properly signed webhook request:

```bash
# Get event from Stripe trigger
stripe trigger payment_intent.succeeded --print-event > event.json

# Send it with proper signature
stripe events resend evt_xxx --webhooks-secret whsec_2035a75...
```

## Current Status

### ✅ What's Working
- Backend running on port 4100
- Webhook endpoint registered and responding
- Stripe CLI listener active and ready
- Environment variables configured

### ⚠️ Why Events Aren't Showing
The `stripe trigger` command **bypasses the listener** - it's a direct test. For the listener to show activity, you need:
1. Real API events (creating PaymentIntents via API)
2. Or webhook events sent from Stripe dashboard
3. Or use `stripe events resend` to replay real events

## Next Steps to Verify Full Flow

### Quick Test (Recommended):
```bash
# In one terminal: Keep listener running (already running)
stripe listen --forward-to http://127.0.0.1:4100/v1/webhooks/stripe

# In another terminal: Trigger and watch
stripe trigger payment_intent.succeeded
```

**Expected output in listener:**
```
→ POST /v1/webhooks/stripe [200]
← payment_intent.succeeded
```

If you see `[200]`, your webhook is working! If you see `[400]` or `[500]`, check backend logs.

### Full Integration Test:
Run the test script in this directory:
```bash
node test-create-payment-intent.js
```

This will:
1. Create real PaymentIntent
2. Confirm payment with test card
3. Trigger real webhook event
4. Listener forwards to backend
5. Backend processes event

## Troubleshooting

### Issue: Listener shows no activity
**Solution**: Use `stripe events resend` instead of `trigger`, or create real API resources

### Issue: Backend returns 400/500
**Solutions**:
- Check webhook signature verification
- Verify `STRIPE_WEBHOOK_SECRET` matches listener secret
- Check backend logs for error details
- Ensure endpoint accepts raw body (not JSON-parsed)

### Issue: Events not reaching backend
**Solutions**:
- Verify backend is on correct port (4100)
- Check firewall/network settings
- Ensure listener URL matches backend endpoint
- Check if backend crashed (check logs)

## Production Setup

When deploying to production:
1. Create webhook endpoint in Stripe Dashboard
2. Point it to your public URL: `https://api.tripavail.com/v1/webhooks/stripe`
3. Copy webhook secret from dashboard
4. Set `STRIPE_WEBHOOK_SECRET` in production env
5. Never use CLI listener in production

## Security Notes
- ⚠️ Webhook secrets shown here are TEST MODE only
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Never log full webhook payloads (contains sensitive data)
- ✅ Implement idempotency to handle duplicate events
