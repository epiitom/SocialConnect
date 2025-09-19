"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { UserProfile } from "@/components/users/user-profile"
import { usePrivacyCheck } from "@/hooks/use-privacy-check"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  bio?: string
  avatar_url?: string
  website?: string
  location?: string
  profile_visibility: "public" | "private" | "followers_only"
  followers_count: number
  following_count: number
   is_following: boolean
  posts_count: number
  is_admin: boolean
  created_at: string
}

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  const { canViewProfile, canViewPosts, loading: privacyLoading } = usePrivacyCheck(params.userId)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/users/${params.userId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch user")
        }

        setUser(data.data.user)
        setIsFollowing(data.data.isFollowing || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user")
      } finally {
        setLoading(false)
      }
    }

    if (params.userId) {
      fetchUser()
    }
  }, [params.userId])

  if (loading || privacyLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </MainLayout>
    )
  }

  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.id === user.id

  if (!canViewProfile && !isOwnProfile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">This profile is private</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <UserProfile
        user={user}
        isFollowing={isFollowing}
        canViewPosts={canViewPosts || isOwnProfile}
        onFollowChange={setIsFollowing}
      />
    </MainLayout>
  )
}
