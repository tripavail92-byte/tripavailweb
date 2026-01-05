/**
 * Test script to trigger real Stripe webhook events
 * Run with: node test-stripe-webhook.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

async function testPaymentIntentWebhook() {
  console.log('🚀 Creating a test PaymentIntent...');
  
  try {
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test booking payment for webhook',
      metadata: {
        bookingId: 'test-booking-123',
        userId: 'test-user-456',
      },
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);
    console.log('   Status:', paymentIntent.status);
    console.log('   Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());

    // Simulate payment success (in test mode)
    // Note: In test mode, you would typically use a test card to complete the payment
    // For webhook testing, we can use the Stripe CLI trigger command
    
    console.log('\n💡 To trigger the webhook:');
    console.log('   1. The Stripe listener should be running');
    console.log('   2. In test mode, events are automatically forwarded');
    console.log('   3. Check your backend logs for webhook processing');
    
    return paymentIntent;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Alternative: Use Stripe CLI to trigger event with specific payment intent
async function triggerWebhookWithCLI(paymentIntentId) {
  const { exec } = require('child_process');
  const command = `D:\\tripavailweb\\.stripe-cli\\stripe.exe trigger payment_intent.succeeded --override payment_intent:id=${paymentIntentId}`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ CLI Error:', error.message);
        reject(error);
        return;
      }
      console.log('✅ Webhook triggered:', stdout);
      resolve(stdout);
    });
  });
}

// Run the test
testPaymentIntentWebhook()
  .then((pi) => {
    console.log('\n🎯 Summary:');
    console.log('   - PaymentIntent ID:', pi.id);
    console.log('   - Check your Stripe Dashboard: https://dashboard.stripe.com/test/payments');
    console.log('   - Check your backend logs for webhook events');
  })
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
