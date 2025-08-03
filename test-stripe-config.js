#!/usr/bin/env node

// Test Stripe configuration and API connectivity
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Stripe Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('STRIPE_PRODUCT_1:', process.env.STRIPE_PRODUCT_1 ? '✅ Set' : '❌ Missing');
console.log('STRIPE_PRODUCT_2:', process.env.STRIPE_PRODUCT_2 ? '✅ Set' : '❌ Missing');

if (!process.env.STRIPE_SECRET_KEY) {
  console.log('\n❌ Stripe secret key not found. Please check your .env.local file.');
  process.exit(1);
}

async function testStripeConnection() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    console.log('\n🔗 Testing Stripe API Connection...');
    
    // Test account connection
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account connected:', account.display_name || account.id);
    
    // Test product retrieval
    console.log('\n📦 Testing Product Access...');
    const products = await stripe.products.list({ 
      ids: [process.env.STRIPE_PRODUCT_1, process.env.STRIPE_PRODUCT_2],
      expand: ['data.default_price']
    });
    
    console.log(`✅ Found ${products.data.length} products:`);
    products.data.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.id})`);
      if (product.default_price) {
        const price = product.default_price;
        const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'Free';
        console.log(`     Price: ${amount} ${price.currency || 'USD'} ${price.recurring ? '/' + price.recurring.interval : ''}`);
      }
    });
    
    // Test webhook endpoints (if any)
    console.log('\n🔗 Testing Webhook Endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 5 });
    console.log(`✅ Found ${webhooks.data.length} webhook endpoints:`);
    webhooks.data.forEach((webhook, index) => {
      console.log(`  ${index + 1}. ${webhook.url} (${webhook.status})`);
    });
    
    console.log('\n🎉 All Stripe tests passed! Integration is ready.');
    
  } catch (error) {
    console.error('\n❌ Stripe API Error:', error.message);
    if (error.type) {
      console.error('Error type:', error.type);
    }
    process.exit(1);
  }
}

// Run tests
testStripeConnection();