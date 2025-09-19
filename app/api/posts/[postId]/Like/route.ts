// app/api/posts/[postId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    postId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Please log in to like posts' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, like_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Already liked', message: 'Post already liked' },
        { status: 400 }
      )
    }

    // Create like
    const { error: likeError } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: postId
      })

    if (likeError) {
      console.error('Like creation error:', likeError)
      return NextResponse.json(
        { success: false, error: 'Database error', message: likeError.message },
        { status: 500 }
      )
    }

    // Get updated post with like count (the trigger should have updated it)
    const { data: updatedPost } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        is_liked: true,
        like_count: updatedPost?.like_count || post.like_count + 1
      }
    })

  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Failed to like post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Please log in to unlike posts' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, like_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete like
    const { error: unlikeError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (unlikeError) {
      console.error('Unlike error:', unlikeError)
      return NextResponse.json(
        { success: false, error: 'Database error', message: unlikeError.message },
        { status: 500 }
      )
    }

    // Get updated post with like count (the trigger should have updated it)
    const { data: updatedPost } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        is_liked: false,
        like_count: updatedPost?.like_count || Math.max(0, post.like_count - 1)
      }
    })

  } catch (error) {
    console.error('Unlike API error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Failed to unlike post' },
      { status: 500 }
    )
  }
}