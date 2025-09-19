"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/users/use-avatar"
import { Search, UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
  bio?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_following: boolean
  created_at: string
}

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  const searchUsers = async (searchQuery: string, pageNum = 1, reset = false) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setUsers([])
      setHasMore(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=10`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Search failed")
      }

      const newUsers = data.data || []
      setUsers(prev => reset || pageNum === 1 ? newUsers : [...prev, ...newUsers])
      setHasMore(data.pagination?.hasNext || false)
      setPage(pageNum)
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to search users")
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    if (followLoading === userId) return // Prevent double clicks
    
    try {
      setFollowLoading(userId)
      const method = isFollowing ? "DELETE" : "POST"
      const response = await fetch(`/api/users/${userId}/follow`, { 
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Follow action failed")
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_following: !isFollowing }
          : user
      ))

      toast.success(data.message || (isFollowing ? "Unfollowed successfully" : "Followed successfully"))
    } catch (error) {
      console.error("Follow toggle error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update follow status"
      toast.error(errorMessage)
    } finally {
      setFollowLoading(null)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading && debouncedQuery) {
      searchUsers(debouncedQuery, page + 1)
    }
  }

  useEffect(() => {
    if (debouncedQuery) {
      searchUsers(debouncedQuery, 1, true)
    } else {
      setUsers([])
      setHasMore(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const getDisplayName = (user: User) => {
    return user.first_name || user.last_name 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user.username
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by username, first name, or last name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading && users.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Searching...</span>
              </div>
            )}

            {!loading && query.length >= 2 && users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found for &quot;{query}&quot;</p>
              </div>
            )}

            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{getDisplayName(user)}</p>
                      <Badge variant="outline" className="text-xs">
                        @{user.username}
                      </Badge>
                    </div>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{user.followers_count} followers</span>
                      <span>{user.following_count} following</span>
                      <span>{user.posts_count} posts</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={user.is_following ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleFollowToggle(user.id, user.is_following)}
                  className="shrink-0 min-w-[100px]"
                  disabled={followLoading === user.id}
                >
                  {followLoading === user.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      {user.is_following ? "Unfollowing..." : "Following..."}
                    </>
                  ) : user.is_following ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Placeholder icon component
function UserSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}
