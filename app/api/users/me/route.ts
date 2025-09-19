/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { updateProfileSchema } from '@/lib/utils/validation';
import { storage } from '@/lib/supabase/storage';
import { handleApiError } from '@/lib/utils/error';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const supabase = createClient();

    // Fetch full user profile from "users" table
    const { data: profile, error } = await (await supabase)
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const supabase = await createClient();

    try {
      // Check if content-type is multipart/form-data
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // Create a new FormData instance
        const formData = await req.formData();
        const file = formData.get('avatar') as File | null;
        const updateData: Record<string, unknown> = {};

        // Extract other form fields
        formData.forEach((value, key) => {
          if (key !== 'avatar' && typeof value === 'string') {
            updateData[key] = value.trim() || null;
          }
        });

        // Handle file upload if present
        if (file && file instanceof File) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `uploads/avatars/${fileName}`;
            
            // Convert file to ArrayBuffer
            const fileBuffer = await file.arrayBuffer();
            const fileUint8Array = new Uint8Array(fileBuffer);
            
            // Upload file to storage
            const { error: uploadError } = await supabase.storage
              .from('uploads')
              .upload(filePath, fileUint8Array, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
              });

            if (uploadError) {
              console.error('File upload error:', uploadError);
              return NextResponse.json(
                { success: false, message: 'Failed to upload avatar' },
                { status: 500 }
              );
            }

            // Get public URL
            const { data: { publicUrl } } = await supabase.storage
              .from('uploads')
              .getPublicUrl(filePath);

            updateData.avatar_url = publicUrl;
          } catch (error) {
            console.error('File processing error:', error);
            return NextResponse.json(
              { success: false, message: 'Error processing file upload' },
              { status: 500 }
            );
          }
        }

        // Update user data
        updateData.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data,
        });
      } else {
        // Handle JSON request (existing logic)
        const body = await req.json();
        
        // Only allow updating fields that exist in the database schema
        const allowedFields = [
          'first_name', 'last_name', 'bio', 'avatar_url', 'website', 'location',
          'profile_visibility', 'allow_search_engines', 'show_online_status',
          'allow_direct_messages', 'require_approval_for_followers',
          'show_follower_count', 'show_following_count', 'allow_tagging', 'show_email'
        ];

        // Filter out any fields that don't exist in the database
        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (field in body) {
            updateData[field] = body[field];
          }
        }

        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data,
        });
      }
    } catch (error) {
      console.error('Error in PUT /api/users/me:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: error instanceof Error ? error.message : 'Failed to update profile' 
        },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return PUT(request); // PATCH same as PUT for this endpoint
}