# 💳 FADDL Match Stripe Integration Setup Guide

Complete guide to configure Stripe payments for the Islamic matrimonial platform.

## 🎯 Overview

The Stripe integration provides:
- **Subscription Management**: Three-tier pricing (Intention/Free, Patience/$18, Reliance/$23)
- **Islamic Compliance**: Halal-compliant payment processing
- **Secure Processing**: PCI-compliant payment handling
- **Webhook Support**: Real-time subscription status updates
- **Customer Portal**: Self-service billing management

## 📋 Prerequisites

- [ ] Stripe account (sign up at [stripe.com](https://stripe.com))
- [ ] Supabase database access
- [ ] Netlify deployment environment
- [ ] Domain configured (https://faddlmatch2025.netlify.app)

## 🔧 Stripe Dashboard Configuration

### 1. Create Stripe Account & Get API Keys

1. **Sign up/Login** to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Navigate to Developers > API Keys**
3. **Copy your keys**:
   - `Publishable key` (starts with `pk_`)
   - `Secret key` (starts with `sk_`)

### 2. Create Subscription Products

#### **Patience Plan - $18/month**
```bash
# In Stripe Dashboard: Products > Create Product
Name: "Patience Plan"
Description: "Most popular choice for serious seekers"
Pricing: $18.00 USD / month
Price ID: Save this (e.g., price_1ABC123xyz)
```

#### **Reliance Plan - $23/month**
```bash
# In Stripe Dashboard: Products > Create Product  
Name: "Reliance Plan"
Description: "Premium experience for committed users"
Pricing: $23.00 USD / month
Price ID: Save this (e.g., price_2DEF456xyz)
```

### 3. Configure Webhook Endpoint

1. **Navigate to Developers > Webhooks**
2. **Create endpoint**: `https://faddlmatch2025.netlify.app/api/webhooks/stripe`
3. **Select events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. **Save webhook secret** (starts with `whsec_`)

### 4. Enable Customer Portal

1. **Navigate to Settings > Billing > Customer portal**
2. **Configure settings**:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to view invoice history
   - Set business information and terms

## 🌍 Environment Configuration

### Update `.env.local` file:

```bash
# 💳 Stripe Payment Integration (REQUIRED)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional: Product-specific price IDs
STRIPE_PATIENCE_PRICE_ID=price_your_patience_price_id
STRIPE_RELIANCE_PRICE_ID=price_your_reliance_price_id
```

### For Production (Netlify):

```bash
# In Netlify Dashboard > Site Settings > Environment Variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key  
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

## 🗄️ Database Setup

### Run Subscription Migration

```bash
# Apply the subscription migration
npx supabase db push

# Or manually execute the SQL file
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250803_subscriptions.sql
```

### Verify Tables Created

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%subscription%';

-- Expected tables:
-- user_subscriptions
-- subscription_usage  
-- payment_history
-- subscription_events
```

## 🚀 Deployment Steps

### 1. Deploy to Netlify

```bash
# Build and deploy
npm run build
netlify deploy --prod --dir=.next

# Verify environment variables are set
netlify env:list
```

### 2. Test Webhook Endpoint

```bash
# Test webhook URL is accessible
curl -X POST https://faddlmatch2025.netlify.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return: {"error": "Missing stripe-signature header"}
```

### 3. Configure Stripe Webhook

1. **Update webhook URL** in Stripe Dashboard
2. **Use production endpoint**: `https://faddlmatch2025.netlify.app/api/webhooks/stripe`
3. **Test webhook** with Stripe CLI:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login and test
stripe login
stripe trigger customer.subscription.created
```

## 🧪 Testing

### Test Mode Setup

```bash
# Use Stripe test mode for development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Test card numbers
4242 4242 4242 4242  # Visa
4000 0027 6000 3184  # Visa (3D Secure)
```

### Test Subscription Flow

1. **Create test subscription**:
   - Visit `/pricing`
   - Select "Patience" plan
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout

2. **Verify webhook processing**:
   - Check Netlify function logs
   - Verify database records created
   - Test subscription status API

3. **Test customer portal**:
   - Visit `/subscription`
   - Click "Manage Billing"
   - Verify portal opens correctly

## 🛡️ Security Checklist

- [ ] **Environment Variables**: All Stripe keys stored securely
- [ ] **Webhook Signatures**: All webhooks verify signatures
- [ ] **HTTPS Only**: Production uses HTTPS endpoints
- [ ] **Database Security**: RLS policies configured
- [ ] **API Protection**: Routes require authentication
- [ ] **Error Handling**: No sensitive data in error messages

## 🔍 Troubleshooting

### Common Issues

**1. Webhook Signature Verification Failed**
```bash
# Check webhook secret matches
echo $STRIPE_WEBHOOK_SECRET
# Verify endpoint URL in Stripe Dashboard
```

**2. Subscription Not Created in Database**
```bash
# Check webhook logs in Netlify
netlify functions:log stripe

# Verify database connection
npx supabase status
```

**3. Checkout Session Fails**
```bash
# Check API logs
# Verify Stripe price IDs are correct
# Ensure user is authenticated
```

**4. Customer Portal Access Denied**
```bash
# Verify customer has active subscription
# Check Stripe customer ID exists
# Confirm portal is enabled in Stripe
```

### Debug Commands

```bash
# Test database connection
npm run test:db

# Check Stripe configuration
npm run test:stripe

# Verify webhook endpoint
curl -I https://faddlmatch2025.netlify.app/api/webhooks/stripe
```

## 📊 Monitoring

### Key Metrics to Track

1. **Subscription Conversion Rate**
   - Free → Paid plan conversions
   - Plan upgrade rates

2. **Payment Success Rate**
   - Failed payment percentage
   - Retry success rates

3. **Churn Rate**
   - Monthly subscription cancellations
   - Retention by plan type

### Monitoring Tools

- **Stripe Dashboard**: Payment and subscription analytics
- **Supabase**: Database usage and performance
- **Netlify Analytics**: Function performance and errors

## 🎯 Go Live Checklist

- [ ] **Production Stripe Account**: Live mode activated
- [ ] **Live API Keys**: Production keys configured
- [ ] **Webhook Endpoint**: Production URL configured
- [ ] **Database Migration**: Applied to production
- [ ] **Environment Variables**: Set in Netlify
- [ ] **Domain Configuration**: HTTPS working
- [ ] **Test Transactions**: End-to-end testing complete
- [ ] **Customer Portal**: Configured and tested
- [ ] **Monitoring**: Alerts configured

## 📞 Support

### Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Netlify Support**: [docs.netlify.com](https://docs.netlify.com)

### Getting Help

1. **Check logs first**: Netlify functions and Stripe dashboard
2. **Test in development**: Use Stripe test mode
3. **Verify configuration**: Double-check all environment variables
4. **Contact support**: Include relevant log excerpts

---

🕌 **May Allah bless this implementation and help it serve the Muslim community in finding righteous marriages.**