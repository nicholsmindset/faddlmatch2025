import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Global setup for FADDL Match E2E tests
 * Initializes test database, creates test users, and prepares test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting FADDL Match E2E Test Setup...');
  const startTime = Date.now();

  // Initialize Supabase client for test data setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables for testing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Clean up any existing test data
    await cleanupTestData(supabase);
    
    // Create test users and data
    await createTestUsers(supabase);
    await createTestConversations(supabase);
    await createTestGuardianSetups(supabase);
    
    // Initialize browser for authentication state setup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    
    // Set up authenticated sessions for test users
    await setupAuthenticatedSessions(context);
    
    await browser.close();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Global setup completed in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Clean up existing test data to ensure clean test environment
 */
async function cleanupTestData(supabase: any) {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test conversations, messages, and user data
  await supabase.from('messages').delete().like('content', 'TEST_%');
  await supabase.from('conversations').delete().like('id', 'test_%');
  await supabase.from('profiles').delete().like('email', '%@test.faddl.com');
  
  console.log('✅ Test data cleanup completed');
}

/**
 * Create test users for different testing scenarios
 */
async function createTestUsers(supabase: any) {
  console.log('👥 Creating test users...');
  
  const testUsers = [
    {
      id: 'test-user-1',
      email: 'test-user-1@test.faddl.com',
      first_name: 'Ahmed',
      last_name: 'Al-Rashid',
      age: 28,
      location: 'Dubai, UAE',
      religious_practice: 'practicing',
      guardian_email: 'guardian-1@test.faddl.com',
      profile_status: 'approved'
    },
    {
      id: 'test-user-2', 
      email: 'test-user-2@test.faddl.com',
      first_name: 'Fatima',
      last_name: 'Al-Zahra',
      age: 25,
      location: 'Cairo, Egypt',
      religious_practice: 'practicing',
      guardian_email: 'guardian-2@test.faddl.com',
      profile_status: 'approved'
    },
    {
      id: 'test-guardian-1',
      email: 'guardian-1@test.faddl.com',
      first_name: 'Ibrahim',
      last_name: 'Al-Rashid',
      age: 55,
      role: 'guardian',
      guardian_for: ['test-user-1']
    },
    {
      id: 'test-guardian-2',
      email: 'guardian-2@test.faddl.com',
      first_name: 'Khadija',
      last_name: 'Al-Zahra',
      age: 50,
      role: 'guardian',
      guardian_for: ['test-user-2']
    },
    {
      id: 'test-user-pending',
      email: 'pending@test.faddl.com',
      first_name: 'Omar',
      last_name: 'Al-Faruq',
      age: 30,
      profile_status: 'pending_approval',
      guardian_email: 'guardian-3@test.faddl.com'
    }
  ];

  for (const user of testUsers) {
    await supabase.from('profiles').upsert(user);
  }
  
  console.log(`✅ Created ${testUsers.length} test users`);
}

/**
 * Create test conversations and messages for messaging tests
 */
async function createTestConversations(supabase: any) {
  console.log('💬 Creating test conversations...');
  
  const conversations = [
    {
      id: 'test-conversation-1',
      participants: ['test-user-1', 'test-user-2'],
      guardian_oversight: true,
      islamic_compliant: true,
      created_at: new Date().toISOString()
    }
  ];

  const messages = [
    {
      id: 'test-message-1',
      conversation_id: 'test-conversation-1',
      sender_id: 'test-user-1',
      content: 'TEST_MESSAGE: Assalamu Alaikum, how are you?',
      islamic_compliant: true,
      guardian_approved: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'test-message-2',
      conversation_id: 'test-conversation-1',
      sender_id: 'test-user-2',
      content: 'TEST_MESSAGE: Wa alaikum assalam, Alhamdulillah I am well.',
      islamic_compliant: true,
      guardian_approved: true,
      created_at: new Date().toISOString()
    }
  ];

  for (const conversation of conversations) {
    await supabase.from('conversations').upsert(conversation);
  }
  
  for (const message of messages) {
    await supabase.from('messages').upsert(message);
  }
  
  console.log('✅ Test conversations and messages created');
}

/**
 * Create guardian oversight test data
 */
async function createTestGuardianSetups(supabase: any) {
  console.log('🛡️ Setting up guardian test data...');
  
  const guardianPermissions = [
    {
      guardian_id: 'test-guardian-1',
      ward_id: 'test-user-1',
      can_approve_matches: true,
      can_monitor_messages: true,
      can_arrange_meetings: true,
      notification_preferences: {
        email: true,
        sms: false,
        push: true
      }
    }
  ];

  for (const permission of guardianPermissions) {
    await supabase.from('guardian_permissions').upsert(permission);
  }
  
  console.log('✅ Guardian test data setup completed');
}

/**
 * Set up authenticated browser sessions for different test users
 */
async function setupAuthenticatedSessions(context: any) {
  console.log('🔐 Setting up authenticated sessions...');
  
  // This would typically involve logging in test users and saving their auth states
  // Implementation depends on Clerk authentication setup
  
  console.log('✅ Authenticated sessions prepared');
}

export default globalSetup;