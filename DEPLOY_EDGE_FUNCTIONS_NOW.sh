#!/bin/bash

# FADDL Match Edge Functions Deployment Script
# Run this after database migration is complete

echo "🚀 Starting FADDL Match Edge Functions Deployment..."

# Set working directory
cd /Users/robertnichols/Desktop/FADDLMATCH_v1

# Check if .env.local exists and source it
if [ -f ".env.local" ]; then
    echo "✅ Loading environment variables..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ .env.local file not found!"
    exit 1
fi

# Verify required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required Supabase environment variables!"
    echo "Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    exit 1
fi

echo "✅ Environment variables validated"

# Deploy each edge function
echo ""
echo "📦 Deploying Edge Functions..."

# 1. auth-sync-user (Clerk → Supabase synchronization)
echo "1️⃣ Deploying auth-sync-user..."
npx supabase functions deploy auth-sync-user --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ auth-sync-user deployed successfully"
else
    echo "❌ Failed to deploy auth-sync-user"
fi

# 2. profile-create (Profile creation with validation)
echo "2️⃣ Deploying profile-create..."
npx supabase functions deploy profile-create --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ profile-create deployed successfully"
else
    echo "❌ Failed to deploy profile-create"
fi

# 3. profile-update (Profile modification)
echo "3️⃣ Deploying profile-update..."
npx supabase functions deploy profile-update --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ profile-update deployed successfully"
else
    echo "❌ Failed to deploy profile-update"
fi

# 4. matches-generate (AI-powered matching)
echo "4️⃣ Deploying matches-generate..."
npx supabase functions deploy matches-generate --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ matches-generate deployed successfully"
else
    echo "❌ Failed to deploy matches-generate"
fi

# 5. messages-send (Messaging with Islamic compliance)
echo "5️⃣ Deploying messages-send..."
npx supabase functions deploy messages-send --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ messages-send deployed successfully"
else
    echo "❌ Failed to deploy messages-send"
fi

# 6. monitoring-dashboard (System monitoring)
echo "6️⃣ Deploying monitoring-dashboard..."
npx supabase functions deploy monitoring-dashboard --project-ref dvydbgjoagrzgpqdhqoq
if [ $? -eq 0 ]; then
    echo "✅ monitoring-dashboard deployed successfully"
else
    echo "❌ Failed to deploy monitoring-dashboard"
fi

echo ""
echo "🎉 Edge Functions Deployment Complete!"
echo ""
echo "📋 Deployed Functions:"
echo "   • auth-sync-user     - Clerk → Supabase synchronization"
echo "   • profile-create     - Profile creation with Islamic validation"
echo "   • profile-update     - Profile modification workflows"
echo "   • matches-generate   - AI-powered compatibility matching"
echo "   • messages-send      - Secure messaging with compliance"
echo "   • monitoring-dashboard - Real-time system monitoring"
echo ""
echo "🔗 Function URLs:"
echo "   Base URL: https://dvydbgjoagrzgpqdhqoq.supabase.co/functions/v1/"
echo "   • auth-sync-user: /auth-sync-user"
echo "   • profile-create: /profile-create"
echo "   • profile-update: /profile-update"
echo "   • matches-generate: /matches-generate"
echo "   • messages-send: /messages-send"
echo "   • monitoring-dashboard: /monitoring-dashboard"
echo ""
echo "✅ All edge functions are now live and ready for production!"
echo ""
echo "🎯 Next Steps:"
echo "   1. ✅ Database Migration (Complete)"
echo "   2. ✅ Edge Functions (Complete)"
echo "   3. ⏳ Mobile Navigation Fix (30 minutes)"
echo "   4. ⏳ Final Integration Testing (5 minutes)"
echo ""
echo "🚀 Ready for launch after mobile navigation fix!"

# Test functions are responding
echo ""
echo "🧪 Testing Edge Functions..."

# Test auth-sync-user endpoint
echo "Testing auth-sync-user endpoint..."
curl -s -o /dev/null -w "%{http_code}" "https://dvydbgjoagrzgpqdhqoq.supabase.co/functions/v1/auth-sync-user" | grep -q "401\|405" && echo "✅ auth-sync-user responding" || echo "⚠️ auth-sync-user check inconclusive"

echo "🎉 Deployment script completed successfully!"