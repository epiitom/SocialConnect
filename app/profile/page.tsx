/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { UserProfile } from "@/components/users/user-profile"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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

  return (
    <MainLayout>
      <UserProfile user={user as any} canViewPosts={true} />
    </MainLayout>
  )
}
