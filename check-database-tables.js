// Check current database tables
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dvydbgjoagrzgpqdhqoq.supabase.co'
const supabaseServiceKey = 'sbp_d9f65fbeb9e2b0aded9fad42f9263bafbf4164f5'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  try {
    console.log('🔍 Checking existing database tables...\n')
    
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc('get_schema_tables', {})
    
    if (error) {
      // If the function doesn't exist, try a direct query to system tables
      console.log('Trying alternative method to check tables...')
      
      // Try to check if we can query any of our expected tables
      const tablesToCheck = ['users', 'user_profiles', 'matches', 'messages', 'conversations']
      
      for (const table of tablesToCheck) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true })
          
          if (!tableError) {
            console.log(`✅ Table '${table}' exists`)
          } else if (tableError.code === 'PGRST116') {
            console.log(`❌ Table '${table}' does not exist`)
          } else {
            console.log(`⚠️  Table '${table}': ${tableError.message}`)
          }
        } catch (err) {
          console.log(`❌ Error checking table '${table}':`, err.message)
        }
      }
    } else {
      console.log('📊 Database tables found:', data)
    }
    
  } catch (err) {
    console.log('❌ Error checking database:', err.message)
  }
}

checkTables().then(() => {
  console.log('\n📋 Next step: Apply migrations if tables are missing')
  process.exit(0)
})