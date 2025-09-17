/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { Database } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { userId } = params;
      
      // Can't follow yourself
      if (currentUser.id === userId) {
        return NextResponse.json(
          { error: 'Invalid action', message: 'You cannot follow yourself' },
          { status: 400 }
        );
      }
      
      const supabase = createClient();
      
      // Check if user exists
      const { data: targetUser } = await (await supabase)
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('is_active', true)
        .single();
      
      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found', message: 'Target user not found' },
          { status: 404 }
        );
      }
      
      // Check if already following
      const { data: existingFollow } = await (await supabase)
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();
      
      if (existingFollow) {
        return NextResponse.json(
          { error: 'Already following', message: 'You are already following this user' },
          { status: 400 }
        );
      }
      
      // Create follow relationship
     
const { error } = await ((await supabase).from('follows') as any)
  .insert({
    follower_id: currentUser.id,
    following_id: userId
  });

      
      if (error) {
        return NextResponse.json(
          { error: 'Follow failed', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Successfully followed user'
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to follow user' },
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
      const supabase = createClient();
      
      // Remove follow relationship
      const { error } = await (await supabase)
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);
      
      if (error) {
        return NextResponse.json(
          { error: 'Unfollow failed', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Successfully unfollowed user'
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to unfollow user' },
        { status: 500 }
      );
    }
  });
}