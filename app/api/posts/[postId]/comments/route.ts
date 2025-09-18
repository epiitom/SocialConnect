/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCommentSchema } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/error';

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = await createClient(true); // Use service role

    // Get comments with author information
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        author_id,
        users!author_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('post_id', params.postId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error('Comments fetch error:', commentsError);
      return NextResponse.json(
        { error: 'Fetch failed', message: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedComments = comments.map((comment: { id: any; content: any; created_at: any; users: { id: any; username: any; first_name: any; last_name: any; avatar_url: any; }; }) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author: {
        id: comment.users.id,
        username: comment.users.username,
        first_name: comment.users.first_name,
        last_name: comment.users.last_name,
        avatar_url: comment.users.avatar_url
      }
    }));

    // Check if there are more comments
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', params.postId)
      .eq('is_active', true);

    const hasNext = offset + limit < (count || 0);

    return NextResponse.json({
      success: true,
      data: transformedComments,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext
      }
    });

  } catch (error) {
    console.error('Comments GET error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

// POST new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient(false); // Regular client for auth

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    const supabaseAdmin = await createClient(true); // Service role for database operations

    // Verify post exists and is active
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, is_active')
      .eq('id', params.postId)
      .eq('is_active', true)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found', message: 'Post not found or inactive' },
        { status: 404 }
      );
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        content: validatedData.content,
        author_id: user.id,
        post_id: params.postId,
        is_active: true
      })
      .select(`
        id,
        content,
        created_at,
        author_id,
        users!author_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Comment creation error:', commentError);
      return NextResponse.json(
        { error: 'Comment creation failed', message: commentError.message },
        { status: 500 }
      );
    }

    // Transform the response data
    const transformedComment = {
      id: newComment.id,
      content: newComment.content,
      created_at: newComment.created_at,
      author: {
        id: newComment.users.id,
        username: newComment.users.username,
        first_name: newComment.users.first_name,
        last_name: newComment.users.last_name,
        avatar_url: newComment.users.avatar_url
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: transformedComment
    }, { status: 201 });

  } catch (error) {
    console.error('Comment POST error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}