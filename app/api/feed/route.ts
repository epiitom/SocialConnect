/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.POSTS_PER_PAGE.toString());
      
      const supabase = await createClient();
      
      // Get list of users that current user follows (including self)
      const { data: followingUsers } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      
      const followingIds = followingUsers?.map((f: { following_id: any; }) => f.following_id) || [];
      followingIds.push(currentUser.id); // Include own posts
      
      if (followingIds.length === 0) {
        // User doesn't follow anyone, return empty feed
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
          }
        });
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Get posts from followed users + own posts
      const { data: posts, error, count } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `, { count: 'exact' })
        .in('author_id', followingIds)
        .eq('is_active', true)
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch feed', message: error.message },
          { status: 500 }
        );
      }
      
      // Add like status and recent comments for each post
      const feedPosts = await Promise.all(
        (posts || []).map(async (post: any) => {
          // Check if current user liked this post
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('post_id', post.id)
            .single();
          
          // Get recent comments (latest 3)
          const { data: recentComments } = await supabase
            .from('comments')
            .select(`
              *,
              author:users!comments_author_id_fkey(
                id, username, first_name, last_name, avatar_url
              )
            `)
            .eq('post_id', post.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3);
          
          return {
            ...post,
            is_liked: !!likeData,
            recent_comments: recentComments || []
          };
        })
      );
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: feedPosts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch feed' },
        { status: 500 }
      );
    }
  });
}
