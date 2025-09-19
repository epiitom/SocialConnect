"use client"

import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "./use-avatar"
import { FollowButton } from "./follow-button"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow, isValid, parseISO } from "date-fns"

interface User {
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
  followed_at?: string
}

interface UserListProps {
  users: User[]
  loading?: boolean
  error?: string | null
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  emptyMessage?: string
  showFollowButton?: boolean
  showFollowDate?: boolean
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return null
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.warn('Invalid date format:', dateString, error)
    return null
  }
}

function UserListItem({ 
  user, 
  showFollowButton = true, 
  showFollowDate = false,
  onFollowChange
}: { 
  user: User
  showFollowButton?: boolean
  showFollowDate?: boolean
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}) {
  const followDate = showFollowDate ? safeFormatDate(user.followed_at) : null

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:bg-card/90 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username}
                </h3>
                <span className="text-muted-foreground text-sm truncate">@{user.username}</span>
              </div>
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{user.followers_count.toLocaleString()} followers</span>
                <span>{user.posts_count.toLocaleString()} posts</span>
                {followDate && (
                  <span>Followed {followDate}</span>
                )}
              </div>
            </div>
          </div>
          
          {showFollowButton && (
            <div className="ml-4 flex-shrink-0">
              <FollowButton 
                userId={user.id} 
                isFollowing={user.is_following} 
                username={user.username}
                showFollowingState={true}
                size="sm"
                variant={user.is_following ? 'outline' : 'default'}
                onFollowChange={(isFollowing) => onFollowChange?.(user.id, isFollowing)}
                className={user.is_following ? 'min-w-[100px]' : ''}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function UserListItemSkeleton() {
  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-full max-w-xs" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function UserList({
  users,
  loading = false,
  error = null,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  emptyMessage = "No users found",
  showFollowButton = true,
  showFollowDate = false,
  onFollowChange,
}: UserListProps) {
  if (loading && users.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <UserListItemSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Failed to load users: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserListItem 
          key={user.id} 
          user={user} 
          showFollowButton={showFollowButton}
          showFollowDate={showFollowDate}
          onFollowChange={onFollowChange}
        />
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}
