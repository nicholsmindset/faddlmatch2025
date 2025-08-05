# FADDLMATCH Production Environment Setup

## 📋 Required Environment Variables for Netlify

Copy these variables to your Netlify site settings at: https://app.netlify.com/projects/faddlmatch2025

### 🔐 Clerk Authentication (REQUIRED)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZGVjaWRpbmctcmF0dGxlci00NS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_bD9J1QaCkVyO3X63T8WCiu0dbnankH91xP0aKrJzMl
CLERK_WEBHOOK_SECRET=whsec_production_key_needed
```

### 🗄️ Supabase Database (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=https://dvydbgjoagrzgpqdhqoq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2eWRiZ2pvYWdyemdwcWRocW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjMxNTYsImV4cCI6MjA2OTY5OTE1Nn0.b7__9KhpZ39XktPn8O2tL-vI6OscKg4F-S5jovqxu6o
SUPABASE_SERVICE_ROLE_KEY=sbp_d9f65fbeb9e2b0aded9fad42f9263bafbf4164f5
```

### 💳 Stripe Payment Integration (REQUIRED)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET
```

### 🌍 App Configuration (REQUIRED)
```
NEXT_PUBLIC_APP_URL=https://faddlmatch.com
NODE_ENV=production
```

### 🛡️ Security Configuration (Production)
```
RATE_LIMIT_ENABLED=true
SESSION_MAX_AGE=86400000
WEBHOOK_TIMESTAMP_TOLERANCE=300
```

### 🤖 OpenAI (Optional - for AI features)
```
OPENAI_API_KEY=your_openai_api_key_if_needed
```

## 🚀 Deployment Steps

### Step 1: Set Environment Variables in Netlify
1. Go to https://app.netlify.com/projects/faddlmatch2025
2. Navigate to Site settings > Environment variables
3. Add all the required variables above

### Step 2: Update Clerk Settings
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Update allowed origins to include: https://faddlmatch.com
3. Update webhook URLs to: https://faddlmatch.com/api/webhooks/clerk

### Step 3: Update Stripe Settings (if configured)
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Create webhook endpoint: https://faddlmatch.com/api/webhooks/stripe
3. Copy webhook secret to STRIPE_WEBHOOK_SECRET

### Step 4: Deploy
Run: `netlify deploy --prod`

## ✅ Production Checklist

- [ ] All environment variables added to Netlify
- [ ] Clerk domain settings updated
- [ ] Stripe webhook configured (if using payments)
- [ ] SSL certificate active (handled by Netlify)
- [ ] Domain faddlmatch.com configured
- [ ] Test all critical functionality after deployment

## 🔗 Important URLs

- **Live Site**: https://faddlmatch.com
- **Netlify Admin**: https://app.netlify.com/projects/faddlmatch2025
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Supabase Dashboard**: https://supabase.com/dashboard

## 🚨 Security Notes

- Clerk keys shown are test keys - use production keys for live site
- Generate strong webhook secrets for production
- Enable rate limiting and proper session management
- Monitor logs for any security issues