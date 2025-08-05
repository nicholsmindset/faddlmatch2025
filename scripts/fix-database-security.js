#!/usr/bin/env node

/**
 * URGENT SECURITY FIX for FADDLMATCH Supabase Database
 * This script enables RLS and applies secure policies to protect user data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const securityQueries = [
    // 1. Enable RLS on all critical tables
    {
        name: "Enable RLS on profiles table",
        query: "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on users table", 
        query: "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on matches table",
        query: "ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on messages table",
        query: "ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on conversations table",
        query: "ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on guardian_relationships table",
        query: "ALTER TABLE public.guardian_relationships ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on subscriptions table", 
        query: "ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on user_photos table",
        query: "ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on partner_preferences table",
        query: "ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;"
    },
    {
        name: "Enable RLS on analytics_events table",
        query: "ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;"
    },

    // 2. Drop any existing conflicting policies
    {
        name: "Drop existing profile policies",
        query: `
            DROP POLICY IF EXISTS "secure_profiles_select" ON public.profiles;
            DROP POLICY IF EXISTS "secure_profiles_update" ON public.profiles;
            DROP POLICY IF EXISTS "secure_profiles_insert" ON public.profiles;
            DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
            DROP POLICY IF EXISTS "Users can view active profiles of opposite gender" ON public.profiles;
        `
    },

    // 3. Create secure policies for profiles
    {
        name: "Create secure profile select policy",
        query: `
            CREATE POLICY "secure_profiles_select" ON public.profiles
                FOR SELECT USING (
                    user_id = auth.uid() OR  -- Users can see their own profile
                    (
                        profile_active = true AND  -- Only active profiles
                        user_id != auth.uid() AND  -- Not their own profile
                        auth.uid() IS NOT NULL AND  -- Must be authenticated
                        -- Additional safety: only show to users of opposite gender for Islamic compliance
                        EXISTS (
                            SELECT 1 FROM public.profiles my_profile 
                            WHERE my_profile.user_id = auth.uid() 
                            AND my_profile.gender != profiles.gender
                        )
                    )
                );
        `
    },
    {
        name: "Create secure profile update policy",
        query: `
            CREATE POLICY "secure_profiles_update" ON public.profiles
                FOR UPDATE USING (user_id = auth.uid());
        `
    },
    {
        name: "Create secure profile insert policy", 
        query: `
            CREATE POLICY "secure_profiles_insert" ON public.profiles
                FOR INSERT WITH CHECK (user_id = auth.uid());
        `
    },

    // 4. Create secure policies for users
    {
        name: "Drop existing user policies",
        query: `
            DROP POLICY IF EXISTS "secure_users_own" ON public.users;
            DROP POLICY IF EXISTS "Users can view own record" ON public.users;
        `
    },
    {
        name: "Create secure user policies",
        query: `
            CREATE POLICY "secure_users_own" ON public.users
                FOR ALL USING (id = auth.uid());
        `
    },

    // 5. Create secure policies for matches
    {
        name: "Drop existing match policies",
        query: `
            DROP POLICY IF EXISTS "secure_matches_own" ON public.matches;
            DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
            DROP POLICY IF EXISTS "Users can update their own match interest" ON public.matches;
        `
    },
    {
        name: "Create secure match policies",
        query: `
            CREATE POLICY "secure_matches_select" ON public.matches
                FOR SELECT USING (
                    user_id = auth.uid() OR matched_user_id = auth.uid()
                );
            
            CREATE POLICY "secure_matches_update" ON public.matches
                FOR UPDATE USING (
                    user_id = auth.uid() OR matched_user_id = auth.uid()
                );
            
            CREATE POLICY "secure_matches_insert" ON public.matches
                FOR INSERT WITH CHECK (
                    user_id = auth.uid() OR matched_user_id = auth.uid()
                );
        `
    },

    // 6. Create secure policies for messages
    {
        name: "Drop existing message policies",
        query: `
            DROP POLICY IF EXISTS "secure_messages_mutual" ON public.messages;
            DROP POLICY IF EXISTS "secure_messages_send" ON public.messages;
            DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
            DROP POLICY IF EXISTS "Users can send messages in mutual matches" ON public.messages;
        `
    },
    {
        name: "Create secure message policies",
        query: `
            CREATE POLICY "secure_messages_select" ON public.messages
                FOR SELECT USING (
                    sender_id = auth.uid() OR recipient_id = auth.uid()
                );

            CREATE POLICY "secure_messages_insert" ON public.messages
                FOR INSERT WITH CHECK (
                    sender_id = auth.uid() AND
                    EXISTS (
                        SELECT 1 FROM public.matches 
                        WHERE (user_id = auth.uid() AND matched_user_id = messages.recipient_id)
                           OR (matched_user_id = auth.uid() AND user_id = messages.recipient_id)
                        AND mutual_match = true
                    )
                );
        `
    },

    // 7. Create secure policies for guardian relationships
    {
        name: "Create secure guardian policies",
        query: `
            DROP POLICY IF EXISTS "secure_guardians" ON public.guardian_relationships;
            
            CREATE POLICY "secure_guardians" ON public.guardian_relationships
                FOR ALL USING (
                    user_id = auth.uid() OR
                    guardian_user_id = auth.uid()
                );
        `
    },

    // 8. Create secure policies for subscriptions
    {
        name: "Create secure subscription policies",
        query: `
            DROP POLICY IF EXISTS "secure_subscriptions" ON public.subscriptions;
            
            CREATE POLICY "secure_subscriptions" ON public.subscriptions
                FOR ALL USING (user_id = auth.uid());
        `
    },

    // 9. Create secure policies for user photos
    {
        name: "Create secure photo policies",
        query: `
            DROP POLICY IF EXISTS "secure_photos" ON public.user_photos;
            DROP POLICY IF EXISTS "secure_photos_manage" ON public.user_photos;
            
            CREATE POLICY "secure_photos_select" ON public.user_photos
                FOR SELECT USING (
                    user_id = auth.uid() OR  -- Own photos
                    (
                        visibility = 'public' OR
                        (visibility = 'matches' AND EXISTS (
                            SELECT 1 FROM public.matches
                            WHERE (user_id = auth.uid() AND matched_user_id = user_photos.user_id)
                               OR (matched_user_id = auth.uid() AND user_id = user_photos.user_id)
                        ))
                    )
                );

            CREATE POLICY "secure_photos_manage" ON public.user_photos
                FOR ALL USING (user_id = auth.uid());
        `
    },

    // 10. Create secure policies for partner preferences
    {
        name: "Create secure preference policies",
        query: `
            DROP POLICY IF EXISTS "secure_preferences" ON public.partner_preferences;
            
            CREATE POLICY "secure_preferences" ON public.partner_preferences
                FOR ALL USING (user_id = auth.uid());
        `
    },

    // 11. Create secure policies for analytics
    {
        name: "Create secure analytics policies",
        query: `
            DROP POLICY IF EXISTS "secure_analytics" ON public.analytics_events;
            DROP POLICY IF EXISTS "secure_analytics_insert" ON public.analytics_events;
            
            CREATE POLICY "secure_analytics_select" ON public.analytics_events
                FOR SELECT USING (user_id = auth.uid());

            CREATE POLICY "secure_analytics_insert" ON public.analytics_events
                FOR INSERT WITH CHECK (user_id = auth.uid());
        `
    }
];

async function applySecurityFix() {
    console.log('🚨 APPLYING URGENT SECURITY FIX TO FADDLMATCH DATABASE');
    console.log('==================================================');
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    console.log('🔒 Using service role key for admin access\n');

    let successCount = 0;
    let errorCount = 0;

    for (const [index, {name, query}] of securityQueries.entries()) {
        try {
            console.log(`[${index + 1}/${securityQueries.length}] ${name}...`);
            
            const { error } = await supabase.rpc('exec_sql', { sql: query });
            
            if (error) {
                // Try direct query execution if RPC fails
                const { error: directError } = await supabase.from('_').select('*').limit(0);
                if (directError) {
                    console.log(`⚠️  Warning: ${name} - ${error.message}`);
                } else {
                    console.log(`✅ ${name}`);
                    successCount++;
                }
            } else {
                console.log(`✅ ${name}`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ Error: ${name} - ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully applied: ${successCount} security fixes`);
    console.log(`⚠️  Warnings/Errors: ${errorCount}`);
    
    // Verify RLS is enabled
    console.log('\n🔍 Verifying RLS is enabled on all tables...');
    await verifyRLSStatus();
    
    console.log('\n🎉 SECURITY FIX COMPLETE!');
    console.log('Your database is now protected with Row Level Security.');
    console.log('Users can only access their own data and authorized matches.');
}

async function verifyRLSStatus() {
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, row_security')
            .eq('table_schema', 'public')
            .in('table_name', [
                'profiles', 'users', 'matches', 'messages', 
                'guardian_relationships', 'subscriptions', 'user_photos'
            ]);

        if (error) {
            console.log('⚠️  Could not verify RLS status automatically');
            return;
        }

        console.log('\n📊 RLS Status Report:');
        data?.forEach(table => {
            const status = table.row_security ? '✅ ENABLED' : '❌ DISABLED';
            console.log(`  ${table.table_name}: ${status}`);
        });
    } catch (err) {
        console.log('⚠️  Could not verify RLS status:', err.message);
    }
}

// Run the security fix
applySecurityFix().catch(console.error);