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
    try {
      const body = await req.json(); // ✅ Expect JSON, not formData

      const supabase = await createClient();

      const { data, error } = await supabase
        .from("users")
        .update(body)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Privacy settings updated successfully",
        data,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }
  });
}


export async function PATCH(request: NextRequest) {
  return PUT(request); // PATCH same as PUT for this endpoint
}