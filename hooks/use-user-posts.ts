"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
}

interface Comment {
  id: string
  content: string
  author_id: string
  author: User
  post_id: string
  created_at: string
}

interface Post {
  id: string
  content: string
  author_id: string
  author: User
  image_url?: string
  category: "general" | "announcement" | "question"
  like_count: number
  comment_count: number
  is_liked: boolean
  created_at: string
  updated_at: string
  recent_comments?: Comment[]
}

interface UseUserPostsProps {
  userId: string
}

interface UseUserPostsReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  removePost: (postId: string) => void
}

export function useUserPosts({ userId }: UseUserPostsProps): UseUserPostsReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchUserPosts = useCallback(async (pageNum = 1, reset = false) => {
    if (!userId) return
    
    try {
      setError(null)
      if (pageNum === 1) setLoading(true)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      })

      const response = await fetch(`/api/users/${userId}/posts?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user posts")
      }

      const newPosts = data.data || []
      setPosts((prev) => (reset || pageNum === 1 ? newPosts : [...prev, ...newPosts]))
      setHasMore(data.pagination?.hasNext || false)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user posts")
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !userId) return
    await fetchUserPosts(page + 1)
  }, [fetchUserPosts, hasMore, loading, page, userId])

  const refresh = useCallback(async () => {
    await fetchUserPosts(1, true)
  }, [fetchUserPosts])

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev])
  }, [])

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, ...updates } : post))
    )
  }, [])

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUserPosts(1, true)
    }
  }, [fetchUserPosts, userId])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addPost,
    updatePost,
    removePost,
  }
}
