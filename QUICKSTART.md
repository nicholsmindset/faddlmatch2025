# QUICK START - Get FADDL Match Working

## 1. Set Up Supabase Database (5 minutes)

### Step 1: Create Tables
1. Go to your Supabase dashboard
2. Click "SQL Editor" → "New query"
3. Copy ALL content from `supabase/migrations/001_initial_schema.sql`
4. Click "Run"

✅ This creates all tables needed for profiles, matches, and messages

### Step 2: Enable Email Auth
1. Go to Authentication → Providers
2. Toggle "Email" to ON
3. Save

✅ Now users can sign up with email/password

## 2. Connect Your App (2 minutes)

### Step 1: Get Your Keys
In Supabase: Settings → API
- Copy "Project URL"
- Copy "anon public" key

### Step 2: Add to Netlify
1. Go to Netlify → Site settings → Environment variables
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Trigger a redeploy

## 3. Test It Works

1. Go to your site
2. Sign up with email/password
3. Check Supabase → Table Editor → profiles
4. You should see the user!

## Common Issues & Fixes

### "Cannot read from profiles"
- Run the SQL migration again
- Make sure RLS policies were created

### "Auth not working"
- Check email provider is enabled
- Verify environment variables in Netlify

### "Still showing empty data"
- Clear browser cache
- Check browser console for errors
- Verify Supabase URL is correct

## Features That Will Work After Setup

✅ **User Registration** - Users can sign up
✅ **Profile Creation** - Users can fill profiles
✅ **Browse Profiles** - See other users
✅ **Send Interests** - Express interest in matches
✅ **Messaging** - Chat with mutual matches
✅ **Guardian System** - Wali approval flow

## Features That Need Additional Setup

❌ **Payment** - Needs Stripe configuration
❌ **Email Notifications** - Needs email service
❌ **SMS Verification** - Needs Twilio
❌ **Photo Upload** - Needs Supabase Storage setup

## Next Steps

After basic setup:
1. Configure Supabase Storage for photos
2. Set up Stripe for payments
3. Deploy edge functions for matching algorithm
