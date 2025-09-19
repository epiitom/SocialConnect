/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import type { Database, User } from '@/types/database';
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return withAuth(request, async (req, currentUser) => {
    try {
      const { userId } = await  params;
      const supabase = createClient();
      
      // Get user profile
      const { data: user, error } = await (await supabase)
        .from('users')
        .select(`
          id, username, first_name, last_name, bio, avatar_url, website, location,
          followers_count, following_count, posts_count, created_at
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'User not found', message: 'User profile not found' },
          { status: 404 }
        );
      }
      
      // Check if current user follows this user
      const { data: followData } = await (await supabase)
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();
      
      const userWithFollowStatus = {
        ...(user as User),
        is_following: !!followData,
        is_own_profile: currentUser.id === userId
      };
      
      return NextResponse.json({
        success: true,
        data: userWithFollowStatus
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
  });
}
