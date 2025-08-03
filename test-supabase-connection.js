// Test Supabase connection with real keys
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dvydbgjoagrzgpqdhqoq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2eWRiZ2pvYWdyemdwcWRocW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjMxNTYsImV4cCI6MjA2OTY5OTE1Nn0.b7__9KhpZ39XktPn8O2tL-vI6OscKg4F-S5jovqxu6o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Connection successful! Database tables need to be created.')
      console.log('📋 Error details:', error.message)
      return true
    } else if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    } else {
      console.log('✅ Connection successful! Tables exist:', data)
      return true
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎯 Ready to apply database migrations!')
  } else {
    console.log('\n❌ Fix connection issues before proceeding.')
  }
  process.exit(0)
})