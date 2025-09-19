import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const supabase = await createClient();
      
      // Test basic connection
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .limit(1);
      
      if (usersError) {
        console.error('Users table error:', usersError);
        return NextResponse.json({ error: 'Users table error', message: usersError.message });
      }
      
      // Test follows table
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('id')
        .limit(1);
      
      if (followsError) {
        console.error('Follows table error:', followsError);
        return NextResponse.json({ error: 'Follows table error', message: followsError.message });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database connection working',
        data: {
          users: users?.length || 0,
          follows: follows?.length || 0,
          currentUser: currentUser.id
        }
      });
      
    } catch (error) {
      console.error('Test DB error:', error);
      return NextResponse.json(
        { error: 'Test failed', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

