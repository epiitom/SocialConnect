import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/middleware/auth';

export async function POST(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  const { userId } = context.params;
  return withAdminAuth(request, async (req, admin) => {
    try {
      const supabase = await createClient();
      
      // Check if user exists
      const { data: user } = await supabase
        .from('users')
        .select('id, is_active, is_admin')
        .eq('id', userId)
        .single();
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Can't deactivate another admin
      if (user.is_admin && userId !== admin.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Cannot deactivate another admin' },
          { status: 403 }
        );
      }
      
      // Toggle user active status
      const newStatus = !user.is_active;
      
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', userId);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to update user status', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        data: {
          is_active: newStatus
        }
      });
      
    } catch (_error) {
      console.error('Error deactivating user:', _error);
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to deactivate user' },
        { status: 500 }
      );
    }
  });
}