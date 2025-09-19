/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

interface FollowingUser {
  id: string
  username: string
  first_name: string
  last_name: string
  bio?: string
  avatar_url?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_following: boolean
  followed_at: string
}

interface FollowingResponse {
  success: boolean
  data?: FollowingUser[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  error?: string
  message?: string
}

interface UseFollowingOptions {
  userId: string
  initialPage?: number
  limit?: number
}

export function useFollowing({ userId, initialPage = 1, limit = 20 }: UseFollowingOptions) {
  const { user: currentUser } = useAuth()
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  const fetchFollowing = useCallback(async (page: number = pagination.page) => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/users/${userId}/following?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FollowingResponse = await response.json()

      if (data.success && data.data && data.pagination) {
        setFollowing(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.message || data.error || 'Failed to fetch following')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch following')
    } finally {
      setLoading(false)
    }
  }, [userId, currentUser, pagination.page, limit])

  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      fetchFollowing(pagination.page + 1)
    }
  }, [pagination.hasNext, loading, fetchFollowing])

  const refresh = useCallback(() => {
    fetchFollowing(1)
  }, [fetchFollowing])

  useEffect(() => {
    if (currentUser) {
      fetchFollowing()
    }
  }, [currentUser, userId, fetchFollowing])

  return {
    following,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
  }
}
