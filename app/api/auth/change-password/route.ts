import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { changePasswordSchema } from '@/lib/utils/validation';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      
      // Validate input
      const validatedData = changePasswordSchema.parse(body);
      
      const supabase = createClient();
      
      // Verify current password by attempting to sign in
      const { error: verifyError } = await (await supabase).auth.signInWithPassword({
        email: user.email,
        password: validatedData.current_password,
      });
      
      if (verifyError) {
        return NextResponse.json(
          { error: 'Invalid password', message: 'Current password is incorrect' },
          { status: 401 }
        );
      }
      
      // Update password
      const { error: updateError } = await (await supabase).auth.updateUser({
        password: validatedData.new_password
      });
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Password change failed', message: updateError.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });
      
    } catch (error) {
      const apiError = handleApiError(error);
      return NextResponse.json(
        { error: apiError.code, message: apiError.message },
        { status: apiError.statusCode }
      );
    }
  });
}