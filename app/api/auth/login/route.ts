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
    
    // Use regular client for authentication (not service role)
    const supabase = await createClient(false);
    
    // Determine if input is email or username
    const isEmail = validatedData.email.includes('@');
    let email = validatedData.email;
    
    if (!isEmail) {
      // Look up email by username using service role to bypass RLS
      console.log('Looking up user by username:', validatedData.email);
      
      const supabaseAdmin = await createClient(true);
      const userLookup = await supabaseAdmin
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
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: validatedData.password,
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle email not confirmed error
      if (authError.message?.includes('email_not_confirmed') || authError.code === 'email_not_confirmed') {
        console.log('Email not confirmed, attempting to confirm user...');
        
        // Use admin client to confirm the user
        const supabaseAdmin = await createClient(true);
        
        // Get user by email to find their ID
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && users?.users) {
          // Fix: Handle undefined email property with proper type guard
          const userToConfirm = users.users.find((user) => user.email === email);
          
          if (userToConfirm) {
            console.log('Found user to confirm:', userToConfirm.id);
            
            // Confirm the user
            const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
              userToConfirm.id,
              { email_confirm: true }
            );
            
            if (!confirmError) {
              console.log('User confirmed, retrying login...');
              
              // Retry login after confirmation
              const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
                email,
                password: validatedData.password,
              });
              
              if (!retryAuthError && retryAuthData.user) {
                console.log('Login successful after confirmation');
                authData = retryAuthData;
                authError = null;
              } else {
                console.error('Retry login failed:', retryAuthError);
                return NextResponse.json(
                  { error: 'Login failed', message: 'Failed to login after email confirmation' },
                  { status: 401 }
                );
              }
            } else {
              console.error('Failed to confirm user:', confirmError);
              return NextResponse.json(
                { error: 'Email not confirmed', message: 'Please verify your email address' },
                { status: 401 }
              );
            }
          } else {
            console.error('User not found for confirmation');
            return NextResponse.json(
              { error: 'User not found', message: 'User account not found' },
              { status: 401 }
            );
          }
        } else {
          console.error('Failed to list users for confirmation:', listError);
          return NextResponse.json(
            { error: 'Email not confirmed', message: 'Please verify your email address' },
            { status: 401 }
          );
        }
      } else {
        // Other auth errors
        return NextResponse.json(
          { error: 'Invalid credentials', message: 'Email/username or password is incorrect' },
          { status: 401 }
        );
      }
    }
    
    if (!authData.user || !authData.session) {
      console.error('No user or session returned from auth');
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    console.log('Authentication successful for user:', authData.user.id);
    
    // Get user profile using service role to avoid RLS issues
    const supabaseAdmin = await createClient(true);
    const userProfileQuery = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    let userData = userProfileQuery.data as any;
    const userError = userProfileQuery.error as any;
    
    if (userError || !userData) {
      console.error('User profile fetch error:', userError);
      
      // Try to create a profile if it doesn't exist
      console.log('Creating missing user profile for:', authData.user.id);
      
      const baseName = (authData.user.user_metadata?.username
        || authData.user.email?.split('@')[0]
        || 'user')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);
      
      // Ensure username uniqueness
      const { data: existingByName } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', baseName)
        .maybeSingle();
      
      const finalUsername = existingByName ? `${baseName}_${String(Date.now()).slice(-4)}` : baseName;
      
      const createRes = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          username: finalUsername,
          first_name: authData.user.user_metadata?.first_name || baseName,
          last_name: authData.user.user_metadata?.last_name || '',
          is_active: true,
          is_admin: false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0
        })
        .select()
        .single();
      
      if (createRes.error) {
        console.error('Failed to create missing profile:', createRes.error);
        return NextResponse.json(
          { error: 'User profile error', message: 'Failed to create user profile' },
          { status: 500 }
        );
      }
      
      userData = createRes.data as any;
      console.log('Created missing user profile:', userData.id);
    }
    
    // Update last login
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('Failed to update last login:', updateError);
      // Don't fail the login for this
    }
    
    console.log('Login successful for user:', userData.username);
    
    // Set the session cookie
    const response = NextResponse.json({
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
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          followers_count: userData.followers_count,
          following_count: userData.following_count,
          posts_count: userData.posts_count
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      }
    });
    
    // Set session cookies for browser
    response.cookies.set('supabase-auth-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    response.cookies.set('supabase-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.code, message: apiError.message },
      { status: apiError.statusCode }
    );
  }
}