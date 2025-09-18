// lib/supabase/server.ts - NO TYPES VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async (useServiceRole = false): Promise<any> => {
  const cookieStore = await cookies()
  
  // Choose the appropriate key based on the parameter
  const supabaseKey = useServiceRole 
    ? process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY! 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle cookie setting errors silently
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handle cookie removal errors silently
          }
        },
      },
    }
  )
  
  return client as any // Force any type to bypass all type checking
}