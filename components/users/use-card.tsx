"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "./use-avatar"
import { FollowButton } from "./follow-button"
import { MapPin, LinkIcon, Calendar } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

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
  posts_count: number
  created_at: string
}

interface UserCardProps {
  user: User
  isFollowing?: boolean
  showFollowButton?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function UserCard({ user, isFollowing = false, showFollowButton = true, onFollowChange }: UserCardProps) {
  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "private":
        return <Badge variant="secondary">Private</Badge>
      case "followers_only":
        return <Badge variant="outline">Followers Only</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:bg-card/90 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link href={`/users/${user.id}`}>
            <UserAvatar user={user} size="lg" className="hover:ring-2 hover:ring-primary/20 transition-all" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Link href={`/users/${user.id}`} className="hover:underline">
                  <h3 className="font-semibold text-foreground truncate">
                    {user.first_name} {user.last_name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  {getVisibilityBadge(user.profile_visibility)}
                </div>
              </div>

              {showFollowButton && (
                <FollowButton userId={user.id} isFollowing={isFollowing} onFollowChange={onFollowChange} size="sm" />
              )}
            </div>

            {user.bio && <p className="text-sm text-foreground mt-2 line-clamp-2">{user.bio}</p>}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary truncate max-w-32"
                  >
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <Link href={`/users/${user.id}/following`} className="hover:underline">
                <span className="font-semibold">{user.following_count}</span>{" "}
                <span className="text-muted-foreground">Following</span>
              </Link>
              <Link href={`/users/${user.id}/followers`} className="hover:underline">
                <span className="font-semibold">{user.followers_count}</span>{" "}
                <span className="text-muted-foreground">Followers</span>
              </Link>
              <span>
                <span className="font-semibold">{user.posts_count}</span>{" "}
                <span className="text-muted-foreground">Posts</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
