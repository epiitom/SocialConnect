"use client"

import { useState, useEffect } from "react"

interface PrivacyCheck {
  canViewProfile: boolean
  canViewPosts: boolean
  canViewFollowers: boolean
  canViewFollowing: boolean
}

interface UsePrivacyCheckReturn {
  privacyCheck: PrivacyCheck | null
  loading: boolean
  error: string | null
  canViewProfile: boolean
  canViewPosts: boolean
  canViewFollowers: boolean
  canViewFollowing: boolean
}

export function usePrivacyCheck(userId: string): UsePrivacyCheckReturn {
  const [privacyCheck, setPrivacyCheck] = useState<PrivacyCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrivacyCheck = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/users/${userId}/can-view`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to check privacy settings")
        }

        setPrivacyCheck(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check privacy settings")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchPrivacyCheck()
    }
  }, [userId])

  return {
    privacyCheck,
    loading,
    error,
    canViewProfile: privacyCheck?.canViewProfile || false,
    canViewPosts: privacyCheck?.canViewPosts || false,
    canViewFollowers: privacyCheck?.canViewFollowers || false,
    canViewFollowing: privacyCheck?.canViewFollowing || false,
  }
}
