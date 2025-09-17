/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {

  return withAuth(request, async (req, user) => {
    try {
      const supabase = createClient();
      
      const { error } = await (await supabase).auth.signOut();
      
      if (error) {
        return NextResponse.json(
          { error: 'Logout failed', message: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Logout successful'
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Logout failed', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  });
}