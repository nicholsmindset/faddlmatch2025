#!/bin/bash

echo "🚀 FADDL Match - Supabase Setup Script"
echo "======================================"
echo ""
echo "This script will help you set up your Supabase project."
echo ""
echo "Prerequisites:"
echo "1. Create a Supabase project at https://app.supabase.com"
echo "2. Have your project URL and keys ready"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "Step 1: Database Setup"
echo "---------------------"
echo "1. Go to your Supabase Dashboard"
echo "2. Click on 'SQL Editor' in the sidebar"
echo "3. Click 'New query'"
echo "4. Copy ALL content from: supabase/migrations/001_initial_schema.sql"
echo "5. Paste and click 'Run'"
echo ""
echo "Press Enter when complete..."
read

echo ""
echo "Step 2: Get Your API Keys"
echo "------------------------"
echo "Go to Settings → API in your Supabase dashboard"
echo ""
echo "Please enter your Supabase URL (e.g., https://xxxx.supabase.co):"
read SUPABASE_URL
echo ""
echo "Please enter your Supabase Anon Key:"
read SUPABASE_ANON_KEY
echo ""
echo "Please enter your Supabase Service Role Key:"
read SUPABASE_SERVICE_KEY

echo ""
echo "Step 3: Creating .env.local file"
echo "-------------------------------"
cat > apps/web/.env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Clerk (if you have it)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
CLERK_SECRET_KEY=your_clerk_secret_here

# Stripe (if you have it)
STRIPE_SECRET_KEY=your_stripe_secret_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
EOF

echo "✅ Created .env.local file"
echo ""

echo "Step 4: Update Netlify Environment Variables"
echo "------------------------------------------"
echo "Go to Netlify Dashboard → Site Settings → Environment Variables"
echo "Add these variables:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY"
echo ""
echo "Press Enter when complete..."
read

echo ""
echo "Step 5: Deploy Edge Functions to Supabase"
echo "---------------------------------------"
echo "To deploy edge functions to Supabase:"
echo ""
echo "1. Install Supabase CLI:"
echo "   brew install supabase/tap/supabase"
echo ""
echo "2. Login to Supabase:"
echo "   supabase login"
echo ""
echo "3. Link your project:"
echo "   supabase link --project-ref your-project-ref"
echo ""
echo "4. Deploy functions:"
echo "   supabase functions deploy match-algorithm"
echo ""

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Test your database connection by signing up a user"
echo "2. Check the profiles table in Supabase to see the user"
echo "3. Deploy the edge functions for matching"
echo ""
echo "Need help? Check supabase/README.md for detailed instructions."
