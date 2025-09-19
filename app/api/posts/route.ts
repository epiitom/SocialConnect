/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/posts/route.ts - Fixed version with correct column names
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('=== Posts API called ===')
  
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Please log in to create posts' },
        { status: 401 }
      )
    }
    
    console.log('User authenticated:', user.id)

    // Parse FormData
    const formData = await request.formData()
    const content = formData.get('content') as string
    const category = formData.get('category') as string
    const imageFile = formData.get('image') as File | null

    console.log('FormData parsed:', {
      content: content?.substring(0, 50) + '...',
      category,
      hasImage: !!imageFile,
      imageSize: imageFile?.size
    })

    // Validation
    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Post content is required' },
        { status: 400 }
      )
    }

    if (content.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Post must be less than 280 characters' },
        { status: 400 }
      )
    }

    const validCategories = ['general', 'announcement', 'question']
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Invalid category' },
        { status: 400 }
      )
    }

    let imageUrl = null

    // Handle image upload
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      console.log('Processing image upload...')
      
      try {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`post-images/${fileName}`, imageFile)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
        } else {
          // Get the public URL
          const { data } = supabase.storage
            .from('images')
            .getPublicUrl(`post-images/${fileName}`)
          
          imageUrl = data.publicUrl
          console.log('Image uploaded successfully:', imageUrl)
        }
      } catch (error) {
        console.error('Image processing error:', error)
        // Continue without image if upload fails
      }
    }

    // Create the post with correct column name (author_id instead of user_id)
    console.log('Creating post in database...')
    
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: user.id, // Changed from user_id to author_id
        content: content.trim(),
        category,
        image_url: imageUrl
      })
      .select()
      .single()

    if (postError) {
      console.error('Post creation error:', postError)
      return NextResponse.json(
        { success: false, error: 'Database error', message: postError.message },
        { status: 500 }
      )
    }

    console.log('Post created, now fetching with user data...')

    // Fetch the created post with user information using correct foreign key
    const { data: postWithUser, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        users!posts_author_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('id', postData.id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch post with user data:', fetchError)
      // Still return success since post was created, just without user data
      return NextResponse.json({
        success: true,
        message: 'Post created successfully',
        data: {
          ...postData,
          is_liked: false,
          author: {
            id: null,
            username: "Unknown",
            first_name: "",
            last_name: "",
            avatar_url: "/placeholder.svg"
          }
        }
      })
    }

    console.log('Post created successfully with user data:', postWithUser.id)

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: {
        ...postWithUser,
        is_liked: false,
        author: postWithUser.users || {
          id: null,
          username: "Unknown",
          first_name: "",
          last_name: "",
          avatar_url: "/placeholder.svg"
        }
      }
    })

  } catch (error) {
    console.error('=== API Error ===')
    console.error('Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server Error', 
        message: error instanceof Error ? error.message : 'Unknown server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit

    // Fetch posts with user data using correct foreign key
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users!posts_author_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          is_admin
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedPosts = posts?.map((post: { users: any }) => ({
      ...post,
      author: post.users || {
        id: null,
        username: "Unknown",
        first_name: "",
        last_name: "",
        avatar_url: "/placeholder.svg"
      },
      users: undefined, // Remove the original users property
      is_liked: false // TODO: Add like status check for authenticated users
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          hasMore: (posts?.length || 0) === limit
        }
      }
    })

  } catch (error) {
    console.error('Posts GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}