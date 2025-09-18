/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/error';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    const supabase = await createClient();
    
    // Determine if input is email or username
    const isEmail = validatedData.email.includes('@');
    let email = validatedData.email;
    
    if (!isEmail) {
      // Look up email by username
      console.log('Looking up user by username:', validatedData.email);
      
      const userLookup = await supabase
        .from('users')
        .select('email, is_active')
        .eq('username', validatedData.email)
        .maybeSingle();
      
      const userData = userLookup.data as any;
      const lookupError = userLookup.error as any;
      
      if (lookupError) {
        console.error('Database lookup error:', lookupError);
        return NextResponse.json(
          { error: 'Database error', message: 'Failed to lookup user' },
          { status: 500 }
        );
      }
      
      if (!userData) {
        console.log('User not found with username:', validatedData.email);
        return NextResponse.json(
          { error: 'Invalid credentials', message: 'Username or password is incorrect' },
          { status: 401 }
        );
      }
      
      if (!userData.is_active) {
        return NextResponse.json(
          { error: 'Account disabled', message: 'Your account has been disabled' },
          { status: 401 }
        );
      }
      
      email = userData.email;
      console.log('Found email for username:', email);
    }
    
    // Authenticate user
    console.log('Attempting to authenticate user with email:', email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: validatedData.password,
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Email/username or password is incorrect' },
        { status: 401 }
      );
    }
    
    if (!authData.user) {
      console.error('No user returned from auth');
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Get user profile, create if missing
    let userData: any = null;
    let userError: any = null;
    const userProfileQuery = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    userData = userProfileQuery.data as any;
    userError = userProfileQuery.error as any;

    if (userError) {
      console.error('User profile fetch error:', userError);
      return NextResponse.json(
        { error: 'User not found', message: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!userData) {
      // Create minimal profile if missing
      const baseName = (authData.user.user_metadata?.username
        || authData.user.email?.split('@')[0]
        || 'user')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);

      // Ensure username uniqueness by appending short suffix if needed
      const { data: existingByName } = await supabase
        .from('users')
        .select('id')
        .eq('username', baseName)
        .maybeSingle();

      const finalUsername = existingByName ? `${baseName}_${String(Date.now()).slice(-4)}` : baseName;

      const createRes = await (supabase.from('users') as any)
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          username: finalUsername,
          first_name: baseName, // better default so UI shows a name
          last_name: '',
          is_active: true,
          is_admin: false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0
        }, { onConflict: 'id' })
        .select()
        .single();

      if (createRes.error) {
        console.error('Failed to create missing profile:', createRes.error);
        return NextResponse.json(
          { error: 'User not found', message: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      userData = createRes.data as any;
    }
    
    // Update last login
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('Failed to update last login:', updateError);
      // Don't fail the login for this
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          is_admin: userData.is_admin,
        },
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}