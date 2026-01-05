const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

async function testWebhookFlow() {
  console.log('🚀 Testing Stripe Webhook Flow\n');
  console.log('Prerequisites:');
  console.log('  ✅ Backend running on port 4100');
  console.log('  ✅ Stripe CLI listener running');
  console.log('  ✅ Forwarding to http://127.0.0.1:4100/v1/webhooks/stripe\n');

  try {
    // Step 1: Create a PaymentIntent
    console.log('Step 1: Creating PaymentIntent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test booking payment - TripAvail',
      metadata: {
        bookingId: 'test-booking-' + Date.now(),
        userId: 'test-user-123',
        packageType: 'HOTEL',
      },
    });
    console.log('   ✅ PaymentIntent created:', paymentIntent.id);
    console.log('   Status:', paymentIntent.status);

    // Step 2: Confirm the PaymentIntent with a test card
    console.log('\nStep 2: Confirming payment with test card...');
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa', // Stripe test card
      return_url: 'https://example.com/success', // Required for some payment methods
    });
    console.log('   ✅ Payment confirmed:', confirmed.id);
    console.log('   Status:', confirmed.status);
    console.log('   Amount:', '$' + (confirmed.amount / 100).toFixed(2));

    // Step 3: Check webhook delivery
    console.log('\n🎯 Expected Webhook Events:');
    console.log('   1. payment_intent.created');
    console.log('   2. payment_intent.succeeded ← This is what your backend should receive');
    
    console.log('\n📊 Check your Stripe CLI listener terminal for:');
    console.log('   → POST /v1/webhooks/stripe [200]');
    console.log('   ← payment_intent.succeeded');
    
    console.log('\n📋 Check your backend logs for:');
    console.log('   - Received webhook: payment_intent.succeeded');
    console.log('   - Event ID:', confirmed.id);
    
    console.log('\n✅ Test completed successfully!');
    console.log('   PaymentIntent:', confirmed.id);
    console.log('   View in dashboard: https://dashboard.stripe.com/test/payments/' + confirmed.id);

    return confirmed;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type) console.error('   Type:', error.type);
    if (error.code) console.error('   Code:', error.code);
    throw error;
  }
}

// Run the test
testWebhookFlow()
  .then(() => {
    console.log('\n🎉 Webhook test completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Test failed:', err.message);
    process.exit(1);
  });
