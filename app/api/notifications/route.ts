import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.NOTIFICATIONS_PER_PAGE.toString());
      const unreadOnly = searchParams.get('unread_only') === 'true';
      
      const supabase = await createClient();
      
      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:users!notifications_sender_id_fkey(
            id, username, first_name, last_name, avatar_url
          ),
          post:posts(
            id, content, image_url
          )
        `, { count: 'exact' })
        .eq('recipient_id', currentUser.id);
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data: notifications, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch notifications', message: error.message },
          { status: 500 }
        );
      }
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: notifications || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });
      
    } catch (_error) {
      console.error('Error fetching notifications:', _error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}