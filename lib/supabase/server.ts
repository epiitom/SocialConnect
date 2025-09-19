// lib/supabase/server.ts
'use server'

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle the error during the render phase
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle the error during the render phase
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}