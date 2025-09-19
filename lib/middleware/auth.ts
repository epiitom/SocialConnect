
// lib/middleware/auth.ts
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<Response>
): Promise<Response> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found', message: 'User profile not found' },
        { status: 404 }
      );
    }

    return handler(request, profile);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<Response>
): Promise<Response> {
  return withAuth(request, async (req, user) => {
    if (!user.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 } // Fixed syntax error
      );
    }
    return handler(req, user);
  });
}