import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { notificationId } = params;
      const supabase = await createClient();
      
      // Check if notification exists and belongs to current user
      const { data: notification } = await supabase
        .from('notifications')
        .select('recipient_id')
        .eq('id', notificationId)
        .single();
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found', message: 'Notification not found' },
          { status: 404 }
        );
      }
      
      if (notification.recipient_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only mark your own notifications as read' },
          { status: 403 }
        );
      }
      
      // Mark notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark as read', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }
  });
}