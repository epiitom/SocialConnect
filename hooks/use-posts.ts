"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
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
}

interface UsePostsOptions {
  authorId?: string
  category?: string
  limit?: number
}

interface UsePostsReturn {
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

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const { authorId, category, limit = 20 } = options

  const fetchPosts = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        setError(null)
        if (pageNum === 1) setLoading(true)

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
        })

        if (authorId) params.append("author_id", authorId)
        if (category) params.append("category", category)

        const response = await fetch(`/api/posts?${params}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch posts")
        }

        const newPosts = data.data || []
        setPosts((prev) => (reset || pageNum === 1 ? newPosts : [...prev, ...newPosts]))
        setHasMore(data.pagination?.hasNext || false)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts")
      } finally {
        setLoading(false)
      }
    },
    [authorId, category, limit],
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchPosts(page + 1)
  }, [fetchPosts, hasMore, loading, page])

  const refresh = useCallback(async () => {
    await fetchPosts(1, true)
  }, [fetchPosts])

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev])
  }, [])

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }, [])

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }, [])

  useEffect(() => {
    fetchPosts(1, true)
  }, [fetchPosts])

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
