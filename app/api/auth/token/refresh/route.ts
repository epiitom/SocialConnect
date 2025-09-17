/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { session }, error } = await (await supabase).auth.refreshSession();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Token refresh failed', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Token refresh failed', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
