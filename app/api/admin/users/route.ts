import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { APP_CONFIG } from '@/lib/utils/constant';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || APP_CONFIG.USERS_PER_PAGE.toString());
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status'); // 'active', 'inactive', or null for all
      
      const supabase = await createClient();
      
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });
      
      // Add search filter if provided
      if (search) {
        query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      // Add status filter if provided
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data: users, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch users', message: error.message },
          { status: 500 }
        );
      }
      
      const totalPages = Math.ceil((count || 0) / limit);
      
      return NextResponse.json({
        success: true,
        data: users || [],
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
        { error: 'Internal server error', message: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  });
}
