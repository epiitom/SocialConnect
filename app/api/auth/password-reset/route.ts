import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/error';

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = passwordResetSchema.parse(body);
    
    const supabase = createClient();
    
    // Check if user exists
    const { data: userData } = await (await supabase)
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();
    
    if (!userData) {
      // Don't reveal if email doesn't exist for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Send password reset email
    const { error } = await (await supabase).auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    });
    
    if (error) {
      return NextResponse.json(
        { error: 'Password reset failed', message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });
    
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}