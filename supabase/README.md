# FADDL Match - Supabase Setup Instructions

## Quick Setup

1. **Copy the migration SQL**
   - Go to your Supabase dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"
   - Copy everything from `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to create all tables

2. **Enable Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Enable "Google" provider (optional)

3. **Get your API Keys**
   - Go to Settings → API
   - Copy your:
     - `Project URL` (looks like: https://xxxx.supabase.co)
     - `Anon/Public` key
     - `Service Role` key (keep this secret!)

4. **Add to Netlify Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

5. **Create Edge Functions in Supabase**
   - Copy the edge functions from `supabase/functions/`
   - Deploy them using Supabase CLI or dashboard

## Database Schema

The schema includes:

### Core Tables:
- **profiles** - User profiles with Islamic matrimonial fields
- **matches** - Match records and interest tracking
- **messages** - Halal messaging between matched users
- **guardian_relationships** - Wali/Guardian connections
- **subscription_history** - Payment and plan tracking
- **verification_requests** - Identity and Islamic verification

### Key Features:
- Row Level Security (RLS) enabled on all tables
- Gender-separated viewing (users only see opposite gender)
- Guardian approval system
- Islamic compliance checks
- Profile completion tracking
- Subscription tier management

## Next Steps

After setting up the database:

1. **Test Authentication**
   ```sql
   -- Check if auth is working
   SELECT * FROM auth.users;
   ```

2. **Create Test User**
   ```sql
   -- This will be done through your app's signup
   ```

3. **Verify RLS Policies**
   ```sql
   -- Check policies are active
   SELECT * FROM pg_policies;
   ```

## Supabase Edge Functions

Create these functions in Supabase (not Netlify):

1. **match-algorithm** - Calculates compatibility
2. **payment-webhook** - Handles Stripe webhooks
3. **send-notification** - Sends match notifications
4. **verify-islamic-knowledge** - Validates Islamic questions

## Important Notes

- All user data is stored in Supabase, not Netlify
- Netlify only hosts the frontend Next.js app
- API calls go directly to Supabase
- Edge functions should be in Supabase for database access
- Enable RLS to secure your data
