import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

export { createClient as createSupabaseClient, createAdminClient as createSupabaseAdminClient }
