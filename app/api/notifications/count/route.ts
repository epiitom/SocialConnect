import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const supabase = await createClient();
      
      // Get unread notifications count
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', currentUser.id)
        .eq('is_read', false);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch notification count', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          unread_count: count || 0
        }
      });
      
    } catch (_error) {
      console.error('Error fetching unread count:', _error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}