/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }>}
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { userId } = await context.params;
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.USERS_PER_PAGE.toString());
      
      const supabase = createClient();
      
      // Check if user exists
      const { data: targetUser } = await (await supabase)
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found', message: 'User not found' },
          { status: 404 }
        );
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Get following with user details
      const { data: following, error, count } = await (await supabase)
        .from('follows')
        .select(`
          following_id,
          created_at,
          following:users!follows_following_id_fkey(
            id, username, first_name, last_name, bio, avatar_url,
            followers_count, following_count, posts_count
          )
        `, { count: 'exact' })
        .eq('follower_id', userId)
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch following', message: error.message },
          { status: 500 }
        );
      }
      
      // Add follow status for current user
      const followingWithStatus = await Promise.all(
        (following || []).map(async (follow: any) => {
          const { data: isFollowing } = await (await supabase)
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', follow.following.id)
            .single();
          
          return {
            ...follow.following,
            is_following: !!isFollowing,
            followed_at: follow.created_at
          };
        })
      );
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: followingWithStatus,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch following' },
        { status: 500 }
      );
    }
  });
}