/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextResponse,NextRequest} from "next/server"
import {createClient} from '@/lib/supabase/server';
import {registerSchema} from "@/lib/utils/validation"
import {handleApiError} from "@/lib/utils/error";

export async function POST(request: NextRequest) {
    try{
          const body = await request.json();
          //zod validation
          const validatedData = registerSchema.parse(body);
          const supabase = await createClient();

          //check username is already taken - FIXED
          const {data: existingUser, error: checkError} = await (supabase
           .from('users') as any)
          .select('username')
          .eq('username',validatedData.username)
          .maybeSingle(); // Changed from .single() to .maybeSingle()
          
          if (checkError) {
            return NextResponse.json(
              {error: 'Database error', message: 'Failed to check username'},
              {status: 500}
            );
          }

          if(existingUser){
            return NextResponse.json(
                    {error: 'Username already taken', message:"Please choose a different username"},
                    {status: 409} // Changed from 400 to 409
            );
          }

          //create user in supabase auth
          const {data: authData, error:authError} = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password
          });
                       
          if (authError) {
      return NextResponse.json(
        { error: 'Registration failed', message: authError.message },
        { status: 400 }
      );
       }

         if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed', message: 'Failed to create user' },
        { status: 400 }
      );
    }
    //create user profile in our users table - FIXED TYPING
    const {data: userData , error: userError} = await (supabase
       .from('users') as any)
      .insert({
        id:authData.user.id,
        email: validatedData.email,
        username : validatedData.username,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        is_active: true, // Added required fields with defaults
        is_admin: false,
        profile_visibility: 'public',
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      })
      .select()
      .single();

          if (userError) {
      // Removed admin.deleteUser - doesn't work in edge functions
      console.error('Profile creation failed:', userError);
      return NextResponse.json(
        { error: 'Registration failed', message: 'Failed to create user profile' },
        { status: 500 }
      );
    }

      return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
        }
      }
    });
    }
    catch(error){
     const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
    }
}