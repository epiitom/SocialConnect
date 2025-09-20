/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

type Post = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.POSTS_PER_PAGE.toString());
      const status = searchParams.get('status'); // 'active', 'inactive', or null for all
      
      const supabase = await createClient(true); // true indicates server-side usage
      
      let query = supabase
        .from('posts')
        .select(
          `
            *,
            author:users!posts_author_id_fkey(
              id, username, first_name, last_name, avatar_url
            )
          `,
          { count: 'exact' }
        );
      
      // Add status filter if provided
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data: posts, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch posts', message: error.message },
          { status: 500 }
        );
      }
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: (posts as Post[]) || [],
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
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : 'Failed to fetch posts' 
        },
        { status: 500 }
      );
    }
  });
}