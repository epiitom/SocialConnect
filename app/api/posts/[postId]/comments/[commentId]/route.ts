import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { commentId } = params;
      const supabase = await createClient();
      
      // Check if comment exists and user owns it (or is admin)
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('author_id, post_id')
        .eq('id', commentId)
        .eq('is_active', true)
        .single();
      
      if (fetchError || !existingComment) {
        return NextResponse.json(
          { error: 'Comment not found', message: 'Comment not found or has been deleted' },
          { status: 404 }
        );
      }
      
      if (existingComment.author_id !== currentUser.id && !currentUser.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only delete your own comments' },
          { status: 403 }
        );
      }
      
      // Soft delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .update({ is_active: false })
        .eq('id', commentId);
      
      if (deleteError) {
        return NextResponse.json(
          { error: 'Delete failed', message: deleteError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully'
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to delete comment' },
        { status: 500 }
      );
    }
  });
}