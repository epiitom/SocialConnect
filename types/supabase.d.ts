import { Database } from '@/lib/supabase/database.types'

declare global {
  type SupabaseClient = ReturnType<typeof import('@/lib/supabase/server').createClient>
  
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      NEXT_SUPABASE_SERVICE_ROLE_KEY: string
    }
  }
}
