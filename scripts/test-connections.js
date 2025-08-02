#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    return false
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test connection by querying the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
    
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message)
    return false
  }
}

async function testClerkConfiguration() {
  console.log('🔍 Testing Clerk configuration...')
  
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const clerkSecretKey = process.env.CLERK_SECRET_KEY
  
  if (!clerkPublishableKey || !clerkSecretKey) {
    console.error('❌ Missing Clerk environment variables')
    return false
  }
  
  if (!clerkPublishableKey.startsWith('pk_')) {
    console.error('❌ Invalid Clerk publishable key format')
    return false
  }
  
  if (!clerkSecretKey.startsWith('sk_')) {
    console.error('❌ Invalid Clerk secret key format')
    return false
  }
  
  console.log('✅ Clerk configuration valid')
  return true
}

async function testOpenAIConfiguration() {
  console.log('🔍 Testing OpenAI configuration...')
  
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    console.error('❌ Missing OpenAI API key')
    return false
  }
  
  if (!openaiApiKey.startsWith('sk-')) {
    console.error('❌ Invalid OpenAI API key format')
    return false
  }
  
  console.log('✅ OpenAI configuration valid')
  return true
}

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceKey) {
    console.error('❌ Missing Supabase service role key')
    return false
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test if our custom types exist
    const { data: types, error: typesError } = await supabase
      .rpc('get_type_names')
      .select()
    
    // Test if our tables exist
    const tables = [
      'users',
      'user_profiles', 
      'partner_preferences',
      'user_photos',
      'guardians',
      'matches',
      'conversations',
      'messages',
      'analytics_events'
    ]
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        console.error(`❌ Table ${table} not accessible:`, error.message)
        return false
      }
    }
    
    console.log('✅ Database schema accessible')
    return true
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message)
    return false
  }
}

async function testRLSPolicies() {
  console.log('🔍 Testing RLS policies...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test that anonymous users can't access protected data
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    // We expect this to either return no data or fail due to RLS
    if (data && data.length > 0) {
      console.error('❌ RLS policies may not be working - anonymous user can access profiles')
      return false
    }
    
    console.log('✅ RLS policies appear to be working')
    return true
    
  } catch (error) {
    console.error('❌ RLS policy test failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting FADDL Match connection tests...\n')
  
  const tests = [
    testSupabaseConnection,
    testClerkConfiguration,
    testOpenAIConfiguration,
    testDatabaseSchema,
    testRLSPolicies
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`❌ Test failed with exception:`, error.message)
      failed++
    }
    console.log('') // Add spacing between tests
  }
  
  console.log('📊 Test Results:')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your FADDL Match setup is ready.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.')
    process.exit(1)
  }
}

// Run the tests
runAllTests().catch(console.error)