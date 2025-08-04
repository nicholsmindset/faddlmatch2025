#!/bin/bash

# 🚀 FADDL Match Stripe Production Setup
# This script creates Stripe products and prices for production

set -e

echo "🚀 Setting up Stripe Products for FADDL Match Production"
echo "========================================================="

# Check if Stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if we're in live mode
echo "🔍 Checking Stripe mode..."
STRIPE_MODE=$(stripe config --list | grep "live_mode" | cut -d'=' -f2 | tr -d ' ')

if [ "$STRIPE_MODE" != "true" ]; then
    echo "⚠️  Warning: You are not in live mode!"
    echo "   Run: stripe login --live"
    echo "   Or continue with test mode for development"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📦 Creating FADDL Match subscription products..."

# Create Basic Product (Free - no Stripe product needed)
echo "✓ Basic (Intention) plan - Free tier (no Stripe product needed)"

# Create Premium Product
echo "📦 Creating Premium (Patience) product..."
PATIENCE_PRODUCT=$(stripe products create \
  --name="FADDL Match - Patience Plan" \
  --description="Premium Islamic matrimonial features with unlimited matches and advanced filters" \
  --metadata[plan_id]="patience" \
  --metadata[plan_name]="Patience" \
  --metadata[is_popular]="true" \
  --metadata[is_halal]="true" \
  --format=json | jq -r '.id')

echo "✓ Created Patience product: $PATIENCE_PRODUCT"

# Create Premium Price
PATIENCE_PRICE=$(stripe prices create \
  --product=$PATIENCE_PRODUCT \
  --unit-amount=2900 \
  --currency=sgd \
  --recurring[interval]=month \
  --recurring[interval_count]=1 \
  --metadata[plan_id]="patience" \
  --format=json | jq -r '.id')

echo "✓ Created Patience price: $PATIENCE_PRICE"

# Create VIP Product
echo "📦 Creating VIP (Reliance) product..."
RELIANCE_PRODUCT=$(stripe products create \
  --name="FADDL Match - Reliance Plan" \
  --description="Premium Islamic matrimonial experience with video calls and dedicated advisor" \
  --metadata[plan_id]="reliance" \
  --metadata[plan_name]="Reliance" \
  --metadata[is_popular]="false" \
  --metadata[is_halal]="true" \
  --format=json | jq -r '.id')

echo "✓ Created Reliance product: $RELIANCE_PRODUCT"

# Create VIP Price
RELIANCE_PRICE=$(stripe prices create \
  --product=$RELIANCE_PRODUCT \
  --unit-amount=5900 \
  --currency=sgd \
  --recurring[interval]=month \
  --recurring[interval_count]=1 \
  --metadata[plan_id]="reliance" \
  --format=json | jq -r '.id')

echo "✓ Created Reliance price: $RELIANCE_PRICE"

echo ""
echo "🎉 Stripe products created successfully!"
echo ""
echo "📝 Add these environment variables to your Netlify site:"
echo ""
echo "STRIPE_PATIENCE_PRICE_ID=$PATIENCE_PRICE"
echo "STRIPE_RELIANCE_PRICE_ID=$RELIANCE_PRICE"
echo ""
echo "🔗 Create webhook endpoint:"
echo "   URL: https://faddlmatch.com/api/webhooks/stripe"
echo "   Events:"
echo "   - customer.subscription.created"
echo "   - customer.subscription.updated" 
echo "   - customer.subscription.deleted"
echo "   - invoice.payment_succeeded"
echo "   - invoice.payment_failed"
echo "   - checkout.session.completed"
echo ""
echo "✅ Setup complete! Your Stripe is now production-ready."