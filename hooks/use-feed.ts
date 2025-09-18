"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"

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

interface UseFeedReturn {
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

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const searchParams = useSearchParams()
  const q = (searchParams.get("q") || "").trim()

  const fetchFeed = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setError(null)
      if (pageNum === 1) setLoading(true)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      })
      if (q) params.set("q", q)

      const response = await fetch(`/api/feed?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch feed")
      }

      const newPosts = data.data || []
      setPosts((prev) => (reset || pageNum === 1 ? newPosts : [...prev, ...newPosts]))
      setHasMore(data.pagination?.hasNext || false)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feed")
    } finally {
      setLoading(false)
    }
  }, [q])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchFeed(page + 1)
  }, [fetchFeed, hasMore, loading, page])

  const refresh = useCallback(async () => {
    await fetchFeed(1, true)
  }, [fetchFeed])

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
    fetchFeed(1, true)
  }, [fetchFeed])

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
