/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string
}

 
interface Post {
  id: string
  author_id: string
  content: string
  created_at: string
  like_count: number
  comment_count: number
  is_public: boolean
  profiles?: Profile
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params // FIXED: Await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    const supabase = await createClient()
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    // FIXED: Check users table instead of profiles table
    const { data: userProfile, error: userError } = await supabase
      .from('users') // Changed from 'profiles' to 'users'
      .select('id, profile_visibility')
      .eq('id', userId)
      .single()
    
    if (userError || !userProfile) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if the current user can view the posts
    const isOwnProfile = session?.user?.id === userId
    
    let isFollowing = false
    if (session?.user?.id && !isOwnProfile) {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .maybeSingle()
      
      isFollowing = !!data && !error
    }
    
    // Check visibility
    if (!isOwnProfile && userProfile.profile_visibility === 'private') {
      return NextResponse.json({
        success: false,
        message: 'This profile is private',
      }, { status: 403 })
    }
    
    if (!isOwnProfile && userProfile.profile_visibility === 'followers_only' && !isFollowing) {
      return NextResponse.json({
        success: false,
        message: 'This profile is only visible to followers',
      }, { status: 403 })
    }
    
    // FIXED: Updated query to use 'users' table instead of 'profiles'
    const { data: posts, count, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users!posts_author_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('author_id', userId)
      .eq(isOwnProfile ? 'author_id' : 'is_public', isOwnProfile ? userId : true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Posts query error:', error)
      throw error
    }
    
    // Check if current user has liked each post
    const postIds = posts?.map((post: any) => post.id) || []
    let userLikes: { post_id: string }[] = []
    
    if (session?.user?.id && postIds.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', session.user.id)
      
      if (!likesError && likes) {
        userLikes = likes as { post_id: string }[]
      }
    }
    
    const postsWithLikes = (posts || []).map(post => ({
      ...post,
      is_liked: userLikes.some(like => like.post_id === post.id)
    }));

    return NextResponse.json({
      success: true,
      data: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count,
        hasNext: (offset + limit) < (count || 0)
      }
    })
    
  } catch (error) {
    console.error('Error in /api/users/[userId]/posts:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    )
  }
}