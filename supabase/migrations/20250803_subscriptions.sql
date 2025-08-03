-- 💳 FADDL Match Subscription System Migration
-- Creates tables for managing user subscriptions with Stripe integration

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled', 
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid',
    'paused'
);

-- Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM (
    'intention',
    'patience', 
    'reliance'
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    plan_id subscription_plan NOT NULL DEFAULT 'intention',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL, -- 'daily_matches', 'messages_sent', 'profile_views', etc.
    usage_count INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    amount_paid INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    payment_status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', etc.
    payment_method TEXT, -- 'card', 'bank_transfer', etc.
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'payment_succeeded', etc.
    event_data JSONB,
    stripe_event_id TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_feature_name ON subscription_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_status ON payment_history(payment_status);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at 
    BEFORE UPDATE ON subscription_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only view/edit their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own subscription usage" ON subscription_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role can manage all subscription data (for webhooks and admin operations)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscription usage" ON subscription_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment history" ON payment_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscription events" ON subscription_events
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    plan_id subscription_plan,
    status subscription_status,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.stripe_customer_id,
        us.stripe_subscription_id,
        us.stripe_price_id,
        us.plan_id,
        us.status,
        us.current_period_start,
        us.current_period_end,
        us.canceled_at,
        us.created_at,
        us.updated_at
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid::text
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    user_uuid UUID,
    feature TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    subscription_id_var UUID;
    period_start_var TIMESTAMPTZ;
    period_end_var TIMESTAMPTZ;
BEGIN
    -- Get current subscription
    SELECT id INTO subscription_id_var
    FROM user_subscriptions
    WHERE user_id = user_uuid::text
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF subscription_id_var IS NULL THEN
        RAISE EXCEPTION 'No active subscription found for user';
    END IF;

    -- Calculate current period (monthly)
    period_start_var := date_trunc('month', NOW());
    period_end_var := period_start_var + INTERVAL '1 month';

    -- Insert or update usage record
    INSERT INTO subscription_usage (
        user_id,
        subscription_id,
        feature_name,
        usage_count,
        period_start,
        period_end
    ) VALUES (
        user_uuid::text,
        subscription_id_var,
        feature,
        increment_by,
        period_start_var,
        period_end_var
    )
    ON CONFLICT (user_id, subscription_id, feature_name, period_start, period_end)
    DO UPDATE SET 
        usage_count = subscription_usage.usage_count + increment_by,
        updated_at = NOW()
    RETURNING usage_count INTO current_usage;

    RETURN current_usage;
END;
$$;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
    user_uuid UUID,
    feature TEXT,
    required_plan subscription_plan DEFAULT 'patience'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_plan subscription_plan;
    user_status subscription_status;
    plan_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's current plan and status
    SELECT plan_id, status INTO user_plan, user_status
    FROM user_subscriptions
    WHERE user_id = user_uuid::text
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no subscription found, default to intention plan
    IF user_plan IS NULL THEN
        user_plan := 'intention';
        user_status := 'active';
    END IF;

    -- Define plan hierarchy (higher number = more features)
    CASE user_plan
        WHEN 'intention' THEN plan_hierarchy := 1;
        WHEN 'patience' THEN plan_hierarchy := 2;
        WHEN 'reliance' THEN plan_hierarchy := 3;
    END CASE;

    CASE required_plan
        WHEN 'intention' THEN required_hierarchy := 1;
        WHEN 'patience' THEN required_hierarchy := 2;
        WHEN 'reliance' THEN required_hierarchy := 3;
    END CASE;

    -- Check if user's plan meets the requirement
    RETURN plan_hierarchy >= required_hierarchy AND user_status IN ('active', 'trialing');
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default free subscription for existing users (optional)
-- This can be run separately if needed to migrate existing users
/*
INSERT INTO user_subscriptions (user_id, stripe_customer_id, plan_id, status)
SELECT 
    id::text,
    'pending_' || id::text, -- Placeholder customer ID
    'intention'::subscription_plan,
    'active'::subscription_status
FROM auth.users
WHERE id::text NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT DO NOTHING;
*/

-- Comments for documentation
COMMENT ON TABLE user_subscriptions IS 'Stores user subscription information integrated with Stripe';
COMMENT ON TABLE subscription_usage IS 'Tracks feature usage per subscription period';
COMMENT ON TABLE payment_history IS 'Audit trail of all payments and transactions';
COMMENT ON TABLE subscription_events IS 'Logs all subscription-related events for debugging';

COMMENT ON FUNCTION get_user_subscription(UUID) IS 'Retrieves current subscription for a user';
COMMENT ON FUNCTION track_feature_usage(UUID, TEXT, INTEGER) IS 'Increments usage counter for a specific feature';
COMMENT ON FUNCTION check_feature_access(UUID, TEXT, subscription_plan) IS 'Checks if user has access to a feature based on their plan';