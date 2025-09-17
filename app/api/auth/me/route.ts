import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          website: user.website,
          location: user.location,
          is_admin: user.is_admin,
          followers_count: user.followers_count,
          following_count: user.following_count,
          posts_count: user.posts_count,
          created_at: user.created_at,
          last_login: user.last_login,
        }
      }
    });
  });
}