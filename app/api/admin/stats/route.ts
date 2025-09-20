import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/middleware/auth';

export async function GET(_request: NextRequest) {
  return withAdminAuth(_request, async () => {
    try {
      const supabase = await createClient();
      
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      // Get total posts count
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Get active users today (users who logged in today)
      const today = new Date().toISOString().split('T')[0];
      const { count: activeUsersToday } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('last_login', `${today}T00:00:00.000Z`)
        .lt('last_login', `${today}T23:59:59.999Z`);
      
      // Get total comments count
      const { count: totalComments } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Get total likes count
      const { count: totalLikes } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true });
      
      return NextResponse.json({
        success: true,
        data: {
          total_users: totalUsers || 0,
          total_posts: totalPosts || 0,
          active_users_today: activeUsersToday || 0,
          total_comments: totalComments || 0,
          total_likes: totalLikes || 0,
        }
      });
      
    } catch (_error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }
  });
}