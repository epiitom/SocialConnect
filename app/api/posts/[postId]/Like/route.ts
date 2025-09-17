/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const supabase = await createClient();
      
      // Check if post exists
      const { data: post } = await supabase
        .from('posts')
        .select('id, author_id')
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found', message: 'Post not found or has been deleted' },
          { status: 404 }
        );
      }
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('post_id', postId)
        .single();
      
      if (existingLike) {
        return NextResponse.json(
          { error: 'Already liked', message: 'You have already liked this post' },
          { status: 400 }
        );
      }
      
      // Create like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUser.id,
          post_id: postId
        });
      
      if (error) {
        return NextResponse.json(
          { error: 'Like failed', message: error.message },
          { status: 500 }
        );
      }
      
      // Get updated like count
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single();
      
      return NextResponse.json({
        success: true,
        message: 'Post liked successfully',
        data: {
          like_count: updatedPost?.like_count || 0,
          is_liked: true
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to like post' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const supabase = await createClient();
      
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('post_id', postId);
      
      if (error) {
        return NextResponse.json(
          { error: 'Unlike failed', message: error.message },
          { status: 500 }
        );
      }
      
      // Get updated like count
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single();
      
      return NextResponse.json({
        success: true,
        message: 'Post unliked successfully',
        data: {
          like_count: updatedPost?.like_count || 0,
          is_liked: false
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to unlike post' },
        { status: 500 }
      );
    }
  });
}
