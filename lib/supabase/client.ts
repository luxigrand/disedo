import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient() {
  // Only create client when actually needed (not during build/prerender)
  if (typeof window === 'undefined') {
    // Server-side: return a dummy client or throw
    // This should not happen in client components, but just in case
    throw new Error(
      'Supabase client can only be used in client components. Use createClient() from @/lib/supabase/server for server components.'
    )
  }

  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    )
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Export as a getter to maintain backward compatibility
// This ensures the client is only created when accessed, not at module load time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
}) as SupabaseClient
