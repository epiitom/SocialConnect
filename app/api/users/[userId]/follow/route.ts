import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { userId } = params;
      console.log('Follow request for userId:', userId, 'currentUser:', currentUser.id);
      const supabase = await createClient();

      // Can't follow yourself
      if (userId === currentUser.id) {
        return NextResponse.json(
          { error: 'Invalid action', message: 'Cannot follow yourself' },
          { status: 400 }
        );
      }

      // Check if user exists
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (userError || !targetUser) {
        return NextResponse.json(
          { error: 'User not found', message: 'User not found or inactive' },
          { status: 404 }
        );
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (existingFollow) {
        return NextResponse.json(
          { error: 'Already following', message: 'You are already following this user' },
          { status: 400 }
        );
      }

      // Create follow relationship
      console.log('Creating follow relationship:', { follower_id: currentUser.id, following_id: userId });
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.id,
          following_id: userId
        });

      if (followError) {
        console.error('Follow creation error:', followError);
        return NextResponse.json(
          { error: 'Follow failed', message: followError.message || 'Failed to follow user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `You are now following ${targetUser.first_name || targetUser.username}`,
        data: {
          is_following: true,
          user: {
            id: targetUser.id,
            username: targetUser.username,
            first_name: targetUser.first_name,
            last_name: targetUser.last_name,
          }
        }
      });

    } catch (error) {
      console.error('Follow error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Failed to follow user' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { userId } = params;
      const supabase = await createClient();

      // Can't unfollow yourself
      if (userId === currentUser.id) {
        return NextResponse.json(
          { error: 'Invalid action', message: 'Cannot unfollow yourself' },
          { status: 400 }
        );
      }

      // Check if user exists
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (userError || !targetUser) {
        return NextResponse.json(
          { error: 'User not found', message: 'User not found or inactive' },
          { status: 404 }
        );
      }

      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);

      if (unfollowError) {
        console.error('Unfollow error:', unfollowError);
        return NextResponse.json(
          { error: 'Unfollow failed', message: unfollowError.message || 'Failed to unfollow user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `You are no longer following ${targetUser.first_name || targetUser.username}`,
        data: {
          is_following: false,
          user: {
            id: targetUser.id,
            username: targetUser.username,
            first_name: targetUser.first_name,
            last_name: targetUser.last_name,
          }
        }
      });

    } catch (error) {
      console.error('Unfollow error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Failed to unfollow user' },
        { status: 500 }
      );
    }
  });
}