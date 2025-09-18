/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1')); // clamp to 1
      const limit = parseInt(
        searchParams.get('limit') || APP_CONFIG.POSTS_PER_PAGE.toString()
      );
      const q = (searchParams.get('q') || '').trim();

      const supabase = await createClient();

      // --- 1. Get list of followed users + self ---
      const { data: followingUsers, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      if (followsError) {
        console.error('followsError', followsError);
        return NextResponse.json(
          { error: 'Failed to fetch follow data' },
          { status: 500 }
        );
      }

      const followingIds = [
        ...(followingUsers?.map((f: { following_id: any }) => f.following_id) ||
          []),
        currentUser.id,
      ];
      const uniqueIds = [...new Set(followingIds)];

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // --- 2. Base query ---
      let query = supabase
        .from('posts')
        .select(
          `
          *,
          author:users!posts_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false }) as any;

      // If q present, search content and author fields, else filter by follow graph
      if (q) {
        const like = `%${q}%`;
        // match on post content
        query = query.ilike('content', like);
        // match on author fields by scoping OR to foreign table 'users'
        query = query.or(
          `username.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`,
          { foreignTable: 'users' }
        );
      } else if (uniqueIds.length > 0) {
        query = query.in('author_id', uniqueIds);
      }

      const { data: posts, error: postsError, count } = await query.range(from, to);

      if (postsError) {
        console.error('postsError', postsError);
        return NextResponse.json(
          { error: 'Failed to fetch feed', message: postsError.message },
          { status: 500 }
        );
      }

      const postIds = posts?.map((p: { id: any; }) => p.id) || [];

      if (postIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      // --- 3. Get likes for these posts (batch) ---
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', currentUser.id);

      if (likesError) {
        console.error('likesError', likesError);
      }

      // --- 4. Get recent comments for these posts (batch) ---
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(
          `
          *,
          author:users!comments_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `
        )
        .in('post_id', postIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('commentsError', commentsError);
      }

      // Group comments by postId (take latest 3 only)
      const commentsByPost =
        comments?.reduce((acc: Record<string, any[]>, c: any) => {
          if (!acc[c.post_id]) acc[c.post_id] = [];
          if (acc[c.post_id].length < 3) acc[c.post_id].push(c);
          return acc;
        }, {}) || {};

      // --- 5. Merge everything into feedPosts ---
      const feedPosts = (posts || []).map((post: { id: string | number; }) => ({
        ...post,
        is_liked: likes?.some((l: { post_id: string | number; }) => l.post_id === post.id) || false,
        recent_comments: commentsByPost[post.id] || [],
      }));

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
        },
      });
    } catch (error) {
      console.error('feedError', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch feed' },
        { status: 500 }
      );
    }
  });
}
