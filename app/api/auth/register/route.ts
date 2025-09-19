import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/error';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Use service role client for all operations
    const supabaseAdmin = await createClient();
    
    // Check if username is already taken
    const { data: existingUser, error: usernameCheckError } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', validatedData.username)
      .maybeSingle();
    
    if (usernameCheckError) {
      console.error('Username check error:', usernameCheckError);
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken', message: 'Please choose a different username' },
        { status: 400 }
      );
    }
    
    // Check if email is already taken
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', validatedData.email)
      .maybeSingle();
    
    if (emailCheckError) {
      console.error('Email check error:', emailCheckError);
    }
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already taken', message: 'This email is already registered' },
        { status: 400 }
      );
    }
    
    // Create user in Supabase Auth with metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false,
      user_metadata: {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        username: validatedData.username
      }
    });
    
    if (authError) {
      console.error('Auth Error:', authError);
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
    
    console.log('Auth user created:', authData.user.id);
    
    // FIRST: Check if user profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('Profile check error:', profileCheckError);
    }
    
    let userProfile;
    
    if (existingProfile) {
      // Profile already exists (maybe from a trigger), use it
      console.log('User profile already exists, using existing profile');
      userProfile = existingProfile;
    } else {
      // Profile doesn't exist, create it
      console.log('Creating new user profile');
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: validatedData.email,
          username: validatedData.username,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        })
        .select()
        .single();
      
      if (userError) {
        console.error('User Profile Error:', userError);
        console.error('Full error details:', JSON.stringify(userError, null, 2));
        
        // Clean up auth user if profile creation fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          console.log('Successfully cleaned up auth user');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        return NextResponse.json(
          { 
            error: 'Registration failed', 
            message: 'Failed to create user profile',
            details: process.env.NODE_ENV === 'development' ? userError.message : undefined
          },
          { status: 500 }
        );
      }
      
      userProfile = userData;
    }
    
    console.log('User profile ready:', userProfile);
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          username: userProfile.username,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
        }
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration Error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}