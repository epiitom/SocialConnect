/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "./use-avatar"
import { UserPlus, Loader2, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, parseISO, isValid } from "date-fns"

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
  created_at: string
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
  listType?: 'followers' | 'following' | 'search'
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}

function UserListItem({ 
  user, 
  showFollowButton = true, 
  showFollowDate = false,
  listType = 'search',
  onFollowChange
}: { 
  user: User
  showFollowButton?: boolean
  showFollowDate?: boolean
  listType?: 'followers' | 'following' | 'search'
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isFollowing, setIsFollowing] = useState(user.is_following)
  const followDate = showFollowDate ? safeFormatDate(user.followed_at) : null

  const handleFollowToggle = async () => {
    if (isLoading) return
    
    const newFollowingState = !isFollowing
    setIsLoading(true)
    
    // Optimistic update
    setIsFollowing(newFollowingState)
    
    try {
      const method = newFollowingState ? 'POST' : 'DELETE'
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to update follow status')
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update follow status')
      }
      
      // Update parent component if needed
      onFollowChange?.(user.id, newFollowingState)
      
      toast.success(
        newFollowingState 
          ? `You are now following ${user.username}` 
          : `You've unfollowed ${user.username}`,
        {
          action: {
            label: 'Undo',
            onClick: () => handleFollowToggle(),
          },
        }
      )
    } catch (error) {
      console.error('Follow toggle error:', error)
      // Revert on error
      setIsFollowing(!newFollowingState)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update follow status'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:bg-card/90 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                    : user.username}
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
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={handleFollowToggle}
                disabled={isLoading}
                className={`min-w-[100px] transition-all ${isFollowing ? 'hover:bg-destructive hover:text-destructive-foreground' : ''}`}
                onMouseEnter={() => isFollowing && setIsHovering(true)}
                onMouseLeave={() => isFollowing && setIsHovering(false)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isFollowing ? 'Unfollowing...' : 'Following...'}
                  </>
                ) : isFollowing ? (
                  <>
                    {isHovering ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Following
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          )}
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
  listType = 'search',
  onFollowChange,
}: UserListProps) {
  if (loading && users.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-muted/20 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
              <div className="h-8 w-24 bg-muted rounded-md" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">{error}</p>
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
    <div className="space-y-4">
      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          showFollowButton={showFollowButton}
          showFollowDate={showFollowDate}
          listType={listType}
          onFollowChange={onFollowChange}
        />
      ))}
      
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="min-w-[120px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
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
