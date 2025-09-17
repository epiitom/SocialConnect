import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { createCommentSchema } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/error';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.COMMENTS_PER_PAGE.toString());
      
      const supabase = await createClient();
      
      // Check if post exists
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .eq('is_active', true)
        .single();
      
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found', message: 'Post not found or has been deleted' },
          { status: 404 }
        );
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Get comments with author info
      const { data: comments, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `, { count: 'exact' })
        .eq('post_id', postId)
        .eq('is_active', true)
        .range(from, to)
        .order('created_at', { ascending: true }); // Oldest first for comments
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch comments', message: error.message },
          { status: 500 }
        );
      }
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: comments || [],
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
        { error: 'Internal server error', message: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { postId } = params;
      const body = await req.json();
      
      // Validate the data
      const validatedData = createCommentSchema.parse(body);
      
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
      
      // Create comment
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          content: validatedData.content,
          author_id: currentUser.id,
          post_id: postId
        })
        .select(`
          *,
          author:users!comments_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `)
        .single();
      
      if (commentError || !newComment) {
        return NextResponse.json(
          { error: 'Comment creation failed', message: commentError?.message || 'Failed to create comment' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Comment created successfully',
        data: newComment
      }, { status: 201 });
      
    } catch (error) {
      const apiError = handleApiError(error);
      return NextResponse.json(
        { error: apiError.code, message: apiError.message },
        { status: apiError.statusCode }
      );
    }
  });
}