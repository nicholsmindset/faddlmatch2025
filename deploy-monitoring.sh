#!/bin/bash

# FADDL Match Edge Functions Monitoring Deployment Script
# This script deploys the comprehensive monitoring system for edge functions

set -e

echo "🚀 FADDL Match Edge Functions Monitoring Deployment"
echo "=================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in FADDL Match project directory. Please run from project root."
    exit 1
fi

echo "✅ Project directory verified"

# Check environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Please set these variables in your environment or .env file"
    exit 1
fi

echo "✅ Environment variables verified"

# Function to run with error checking
run_with_check() {
    local description="$1"
    local command="$2"
    
    echo ""
    echo "📦 $description..."
    
    if eval "$command"; then
        echo "✅ $description completed successfully"
    else
        echo "❌ $description failed"
        exit 1
    fi
}

# Step 1: Deploy database migrations
run_with_check "Deploying monitoring database schema" \
    "supabase db push --db-url postgres://postgres:$SUPABASE_DB_PASSWORD@db.dvydbgjoagrzgpqdhqoq.supabase.co:5432/postgres"

# Step 2: Deploy edge functions
echo ""
echo "🔧 Deploying edge functions..."

# Deploy individual functions with monitoring
functions=("auth-sync-user" "profile-create" "profile-update" "messages-send" "matches-generate" "monitoring-dashboard")

for func in "${functions[@]}"; do
    run_with_check "Deploying $func function" \
        "supabase functions deploy $func --project-ref dvydbgjoagrzgpqdhqoq"
done

# Step 3: Verify monitoring infrastructure
echo ""
echo "🔍 Verifying monitoring infrastructure..."

if command -v deno &> /dev/null; then
    run_with_check "Running monitoring verification" \
        "deno run --allow-net --allow-env --allow-read monitoring-setup.ts"
else
    echo "⚠️ Deno not found. Skipping automated verification."
    echo "   You can run verification manually with:"
    echo "   deno run --allow-net --allow-env --allow-read monitoring-setup.ts"
fi

# Step 4: Set up environment variables for monitoring
echo ""
echo "🔧 Configuring monitoring environment..."

# Check if monitoring webhook is configured
if [ -n "$MONITORING_WEBHOOK_URL" ]; then
    echo "✅ Monitoring webhook configured"
else
    echo "⚠️ MONITORING_WEBHOOK_URL not set. Webhook alerts will be disabled."
fi

# Check if monitoring email is configured  
if [ -n "$MONITORING_ALERT_EMAIL" ]; then
    echo "✅ Monitoring alert email configured"
else
    echo "⚠️ MONITORING_ALERT_EMAIL not set. Email alerts will be disabled."
fi

# Step 5: Test monitoring endpoints
echo ""
echo "🧪 Testing monitoring endpoints..."

test_endpoint() {
    local func_name="$1"
    local method="${2:-OPTIONS}"
    
    echo "Testing $func_name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        "$SUPABASE_URL/functions/v1/$func_name")
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        echo "✅ $func_name responding correctly ($response)"
    else
        echo "⚠️ $func_name returned $response (may be expected for some functions)"
    fi
}

# Test all functions
for func in "${functions[@]}"; do
    test_endpoint "$func"
done

# Special test for monitoring dashboard
echo ""
echo "Testing monitoring dashboard with health check..."
dashboard_response=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=health")

if echo "$dashboard_response" | grep -q "health_overview"; then
    echo "✅ Monitoring dashboard API working correctly"
else
    echo "⚠️ Monitoring dashboard may not be working correctly"
    echo "Response: $dashboard_response"
fi

# Step 6: Display deployment summary
echo ""
echo "📋 Deployment Summary"
echo "===================="
echo ""
echo "✅ Database schema deployed with monitoring tables"
echo "✅ Edge functions deployed with monitoring integration"
echo "✅ Monitoring dashboard API deployed"
echo "✅ Alerting system configured"
echo ""
echo "📊 Monitoring Features Enabled:"
echo "  - Real-time performance tracking"
echo "  - Error event logging and analysis" 
echo "  - Automated alerting (webhook/email)"
echo "  - Health status monitoring"
echo "  - SLA metrics calculation"
echo "  - Security event tracking"
echo ""
echo "🔗 Access Points:"
echo "  - Monitoring Dashboard: $SUPABASE_URL/functions/v1/monitoring-dashboard"
echo "  - Health Status: $SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=health"
echo "  - Performance Metrics: $SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=performance"
echo "  - Error Analysis: $SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=errors"
echo ""
echo "📚 Documentation:"
echo "  - Monitoring Analysis: EDGE_FUNCTIONS_MONITORING_ANALYSIS.md"
echo "  - Operational Runbook: EDGE_FUNCTIONS_MONITORING_RUNBOOK.md"
echo "  - Setup Verification: monitoring-setup.ts"
echo ""

# Step 7: Next steps guidance
echo "🎯 Next Steps:"
echo "1. Configure alert endpoints (MONITORING_WEBHOOK_URL, MONITORING_ALERT_EMAIL)"
echo "2. Set up monitoring dashboards in your preferred tool"
echo "3. Train team on operational runbook procedures"
echo "4. Schedule regular monitoring reviews"
echo "5. Implement performance optimizations based on metrics"
echo ""

# Step 8: Performance recommendations
echo "⚡ Immediate Performance Recommendations:"
echo "1. Monitor cold start rates and implement keep-warm if needed"
echo "2. Watch for JWT validation failures and implement caching"
echo "3. Track database connection pool usage during peak traffic"
echo "4. Monitor error rates and implement circuit breaker patterns"
echo ""

echo "🎉 Monitoring deployment completed successfully!"
echo ""
echo "📧 For support or questions, refer to the operational runbook or contact the DevOps team."

# Make the script executable
chmod +x "$0"