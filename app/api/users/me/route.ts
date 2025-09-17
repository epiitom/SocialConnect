/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { updateProfileSchema } from '@/lib/utils/validation';
import { storage } from '@/lib/supabase/storage';
import { handleApiError } from '@/lib/utils/error';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return NextResponse.json({
      success: true,
      data: user
    });
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const formData = await req.formData();
      
      // Extract form fields
      const updateData: any = {};
      const avatar = formData.get('avatar') as File | null;
      
      // Get text fields
      const fields = ['first_name', 'last_name', 'bio', 'website', 'location'];
      fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null) {
          updateData[field] = value.toString();
        }
      });
      
      // Validate the data
      const validatedData = updateProfileSchema.parse(updateData);
      
      const supabase = createClient();
      
      // Handle avatar upload if provided
      if (avatar && avatar.size > 0) {
        try {
          const avatarUrl = await storage.uploadAvatar(avatar, user.id);
          validatedData.avatar_url = avatarUrl;
        } catch (uploadError) {
          return NextResponse.json(
            { error: 'Avatar upload failed', message: 'Failed to upload avatar image' },
            { status: 400 }
          );
        }
      }
      
      // Update user profile
      const { data: updatedUser, error } = await ((await supabase)
            .from('users') as any) 
            .update(validatedData)
            .eq('id', user.id)
            .select()
            .single();

      if (error) {
        return NextResponse.json(
          { error: 'Update failed', message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
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

export async function PATCH(request: NextRequest) {
  return PUT(request); // PATCH same as PUT for this endpoint
}