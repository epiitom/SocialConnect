/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const supabase = await createClient();
      
      // Check if user liked this post
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('post_id', postId)
        .maybeSingle();
      
      // Get current like count
      const { data: post } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      return NextResponse.json({
        success: true,
        data: {
          is_liked: !!likeData,
          like_count: post?.like_count || 0
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch like status' },
        { status: 500 }
      );
    }
  });
}