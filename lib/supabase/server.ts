/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/supabase/server.ts
'use server'

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations
 * @param _serverSide - Kept for backward compatibility, no longer used
 * @returns Supabase client instance
 */
export async function createClient(_serverSide: boolean = true) {
  const cookieStore = cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          try {
            (await cookieStore).set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: any) {
          try {
            (await cookieStore).set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}