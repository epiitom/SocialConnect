import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { commentId } = await context.params; // FIXED: Await params
      const supabase = await createClient(true); // true for server-side usage
     
      // Check if comment exists and user owns it (or is admin)
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('author_id, post_id')
        .eq('id', commentId)
        .eq('is_active', true)
        .single();
     
      if (fetchError || !existingComment) {
        console.error('Comment fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Comment not found', message: 'Comment not found or has been deleted' },
          { status: 404 }
        );
      }
     
      // Authorization check
      if (existingComment.author_id !== currentUser.id && !currentUser.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only delete your own comments' },
          { status: 403 }
        );
      }
     
      // Soft delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', commentId);
     
      if (deleteError) {
        console.error('Comment delete error:', deleteError);
        return NextResponse.json(
          { error: 'Delete failed', message: deleteError.message },
          { status: 500 }
        );
      }
     
      // Update comment count on the post
      const { error: countError } = await supabase
        .rpc('decrement_comment_count', { post_id: existingComment.post_id });
     
      if (countError) {
        console.warn('Failed to update comment count:', countError);
        // Don't fail the request for this
      }
     
      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully'
      });
     
    } catch (error) {
      console.error('Comment deletion error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to delete comment' },
        { status: 500 }
      );
    }
  });
}

// Also add GET method for fetching user's search results
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get('q');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      
      if (!query || query.trim().length < 2) {
        return NextResponse.json(
          { error: 'Invalid query', message: 'Search query must be at least 2 characters' },
          { status: 400 }
        );
      }
      
      const supabase = await createClient(true); // true for server-side usage
      const offset = (page - 1) * limit;
      
      // Search users by username, first_name, or last_name
      const { data: users, error, count } = await supabase
        .from('users')
        .select(`
          id, username, first_name, last_name, avatar_url, bio,
          followers_count, following_count, posts_count, created_at
        `, { count: 'exact' })
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .eq('is_active', true)
        .neq('id', currentUser.id) // Exclude current user
        .order('followers_count', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('User search error:', error);
        return NextResponse.json(
          { error: 'Search failed', message: error.message },
          { status: 500 }
        );
      }
      
      // Check follow status for each user
      if (users && users.length > 0) {
        const userIds = users.map(user => user.id);
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id)
          .in('following_id', userIds);
        
        const followingIds = new Set(follows?.map(f => f.following_id) || []);
        
        // Add is_following property to each user
        const usersWithFollowStatus = users.map(user => ({
          ...user,
          is_following: followingIds.has(user.id)
        }));
        
        return NextResponse.json({
          success: true,
          data: usersWithFollowStatus,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit),
            totalItems: count,
            hasNext: (offset + limit) < (count || 0)
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNext: false
        }
      });
      
    } catch (error) {
      console.error('Search route error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Search failed' },
        { status: 500 }
      );
    }
  });
}