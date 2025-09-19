// app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const supabase = await createClient();
      
      // Mark all notifications as read for current user
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', currentUser.id)
        .eq('is_read', false);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark all as read', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to mark all notifications as read' },
        { status: 500 }
      );
    }
  });
}
