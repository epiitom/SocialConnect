import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get('q') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
      const excludeCurrentUser = searchParams.get('exclude_current') === 'true';
      const excludeFollowing = searchParams.get('exclude_following') === 'true';
      const excludeFollowers = searchParams.get('exclude_followers') === 'true';

      if (!query || query.length < 2) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      const supabase = await createClient(true); // true for server-side usage
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Search users by username, first_name, last_name
      const searchQuery = `%${query}%`;
      
      const { data: users, error, count } = await supabase
        .from('users')
        .select(`
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          bio,
          followers_count,
          following_count,
          posts_count,
          created_at
        `, { count: 'exact' })
        .or(`username.ilike.${searchQuery},first_name.ilike.${searchQuery},last_name.ilike.${searchQuery}`)
        .eq('is_active', true)
        .neq('id', currentUser.id) // Exclude current user
        .range(from, to)
        .order('followers_count', { ascending: false }); // Sort by popularity

      if (error) {
        console.error('User search error:', error);
        return NextResponse.json(
          { error: 'Search failed', message: error.message },
          { status: 500 }
        );
      }

      // Get follow status for each user
      const userIds = users?.map((u: { id: any; }) => u.id) || [];
      let followStatuses: Record<string, boolean> = {};

      if (userIds.length > 0) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id)
          .in('following_id', userIds);

        followStatuses = (follows || []).reduce((acc: { [x: string]: boolean; }, f: { following_id: string | number; }) => {
          acc[f.following_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      // Add follow status to each user
      const usersWithFollowStatus = (users || []).map((user: { id: string | number; }) => ({
        ...user,
        is_following: followStatuses[user.id] || false,
      }));

      const totalPages = Math.ceil((count || 0) / limit);

      return NextResponse.json({
        success: true,
        data: usersWithFollowStatus,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });

    } catch (error) {
      console.error('User search error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to search users' },
        { status: 500 }
      );
    }
  });
}

