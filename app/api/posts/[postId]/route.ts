/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { updatePostSchema } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/error';
import { storage } from '@/lib/supabase/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const supabase: any = await createClient();
      
      // Get post with author info
      const postResult: any = await (supabase.from('posts') as any)
        .select(`
          *,
          author:users!posts_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `)
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      const post: any = postResult.data;
      const error: any = postResult.error;
      
      if (error || !post) {
        console.error('Post fetch error:', error);
        return NextResponse.json(
          { error: 'Post not found', message: 'Post not found or has been deleted' },
          { status: 404 }
        );
      }
      
      // Check if current user liked this post
      const likeResult: any = await (supabase.from('likes') as any)
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('post_id', postId)
        .maybeSingle();
      
      const likeData: any = likeResult.data;
      
      return NextResponse.json({
        success: true,
        data: {
          ...post,
          is_liked: !!likeData
        }
      });
      
    } catch (error: any) {
      console.error('GET post error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch post' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const body = await req.json();
      
      // Validate the data
      const validatedData = updatePostSchema.parse(body);
      
      const supabase: any = await createClient();
      
      // Check if post exists and user owns it
      const existingPostResult: any = await (supabase.from('posts') as any)
        .select('author_id')
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      const existingPost: any = existingPostResult.data;
      const fetchError: any = existingPostResult.error;
      
      if (fetchError || !existingPost) {
        console.error('Post fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Post not found', message: 'Post not found or has been deleted' },
          { status: 404 }
        );
      }
      
      if (existingPost.author_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only edit your own posts' },
          { status: 403 }
        );
      }
      
      // Update the post
      const updateResult: any = await (supabase.from('posts') as any)
        .update(validatedData)
        .eq('id', postId)
        .select(`
          *,
          author:users!posts_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `)
        .single();
      
      const updatedPost: any = updateResult.data;
      const updateError: any = updateResult.error;
      
      if (updateError) {
        console.error('Post update error:', updateError);
        return NextResponse.json(
          { error: 'Update failed', message: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Post updated successfully',
        data: {
          ...updatedPost,
          is_liked: false // We don't need to check like status for update
        }
      });
      
    } catch (error: any) {
      console.error('PUT post error:', error);
      
      // Handle validation errors
      if (error?.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', message: 'Invalid input data', details: error.errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal error', message: error?.message || 'Failed to update post' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest, context: any) {
  return PUT(request, context); // PATCH same as PUT
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const supabase: any = await createClient();
      
      // Check if post exists and user owns it (or is admin)
      const existingPostResult: any = await (supabase.from('posts') as any)
        .select('author_id, image_url')
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      const existingPost: any = existingPostResult.data;
      const fetchError: any = existingPostResult.error;
      
      if (fetchError || !existingPost) {
        console.error('Post fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Post not found', message: 'Post not found or has been deleted' },
          { status: 404 }
        );
      }
      
      if (existingPost.author_id !== currentUser.id && !currentUser.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only delete your own posts' },
          { status: 403 }
        );
      }
      
      // Soft delete the post
      const deleteResult: any = await (supabase.from('posts') as any)
        .update({ is_active: false })
        .eq('id', postId);
      
      const deleteError: any = deleteResult.error;
      
      if (deleteError) {
        console.error('Post delete error:', deleteError);
        return NextResponse.json(
          { error: 'Delete failed', message: deleteError.message },
          { status: 500 }
        );
      }
      
      // Optional: Delete image from storage if exists
      if (existingPost.image_url) {
        try {
          const imagePath = existingPost.image_url.split('/').pop();
          if (imagePath) {
            await storage.deleteFile(`posts/${imagePath}`);
          }
        } catch (storageError: any) {
          console.error('Failed to delete image from storage:', storageError);
          // Don't fail the request if storage deletion fails
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully'
      });
      
    } catch (error: any) {
      console.error('DELETE post error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to delete post' },
        { status: 500 }
      );
    }
  });
}