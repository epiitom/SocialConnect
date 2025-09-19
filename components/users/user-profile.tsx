"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "./use-avatar"
import { FollowButton } from "./follow-button"
import { PostCard } from "@/components/posts/post-card"
import { PostSkeleton } from "@/components/posts/post-skeleton"
import { usePosts } from "@/hooks/use-posts"
import { useAuth } from "@/contexts/auth-context"
import { 
  MapPin, 
  LinkIcon, 
  Calendar, 
  Settings, 
  Shield,
  ExternalLink,
  Users,
  UserPlus,
  FileText,
  Lock,
  Eye
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, isValid, parseISO } from "date-fns"
import { toast } from "sonner"

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
  is_admin: boolean
  created_at: string
  last_login?: string
  is_verified?: boolean
}

interface UserProfileProps {
  user: User
  isFollowing?: boolean
  canViewPosts?: boolean
  onFollowChange?: (isFollowing: boolean) => void
  isBlocked?: boolean
  mutualFollowersCount?: number
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

export function UserProfile({ 
  user, 
  isFollowing = false, 
  canViewPosts = true, 
  onFollowChange,
  isBlocked = false,
  mutualFollowersCount = 0
}: UserProfileProps) {
  const { user: currentUser } = useAuth()
  const [followersCount, setFollowersCount] = useState(user.followers_count)
  const [activeTab, setActiveTab] = useState("posts")
  const { posts: rawPosts, loading, updatePost, error } = usePosts({ authorId: user.id })

  // Ensure posts is always an array
  const posts = useMemo(() => {
    if (!rawPosts) return []
    if (Array.isArray(rawPosts)) return rawPosts
    return []
  }, [rawPosts])

  const isOwnProfile = currentUser?.id === user.id
  const isPrivateProfile = user.profile_visibility === "private"
  const isFollowersOnlyProfile = user.profile_visibility === "followers_only"
  const canViewProfile = isOwnProfile || canViewPosts

  // Memoize computed values for performance
  const profileStats = useMemo(() => ({
    followers: followersCount,
    following: user.following_count,
    posts: user.posts_count
  }), [followersCount, user.following_count, user.posts_count])

  // Fixed date formatting with proper validation
  const profileMeta = useMemo(() => {
    const joinDate = safeFormatDate(user.created_at) || 'Unknown'
    const lastSeen = safeFormatDate(user.last_login)
    
    return { joinDate, lastSeen }
  }, [user.created_at, user.last_login])

  const handleFollowChange = useCallback((newIsFollowing: boolean) => {
    setFollowersCount((prev) => prev + (newIsFollowing ? 1 : -1))
    onFollowChange?.(newIsFollowing)
    
    // Optimistic UI update for post visibility
    if (isFollowersOnlyProfile && newIsFollowing) {
      toast.success("You can now see this user's posts")
    }
  }, [onFollowChange, isFollowersOnlyProfile])

  const handleLikeToggle = useCallback((postId: string, isLiked: boolean) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const newLikeCount = post.like_count + (isLiked ? 1 : -1)
    updatePost(postId, {
      is_liked: isLiked,
      like_count: Math.max(0, newLikeCount), // Prevent negative counts
    })
  }, [posts, updatePost])

  const handleWebsiteClick = useCallback((e: React.MouseEvent, website: string) => {
    // Basic URL validation before external navigation
    try {
      const url = new URL(website)
      if (!['http:', 'https:'].includes(url.protocol)) {
        e.preventDefault()
        toast.error("Invalid website URL")
        return
      }
    } catch {
      e.preventDefault()
      toast.error("Invalid website URL")
    }
  }, [])

  const getVisibilityBadge = (visibility: string) => {
    const configs = {
      private: { 
        variant: "secondary" as const, 
        icon: Lock, 
        label: "Private",
        description: "Profile and posts are hidden"
      },
      followers_only: { 
        variant: "outline" as const, 
        icon: Users, 
        label: "Followers Only",
        description: "Posts visible to followers only"
      },
      public: { 
        variant: "default" as const, 
        icon: Eye, 
        label: "Public",
        description: "Profile and posts are public"
      }
    }

    const config = configs[visibility as keyof typeof configs]
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1" title={config.description}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const renderPrivateProfileMessage = () => (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-8 text-center">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">This profile is private</h3>
        <p className="text-muted-foreground mb-4">
          {isPrivateProfile
            ? "Only the user can see their posts and profile information"
            : "Only followers can see posts from this user"}
        </p>
        {!isFollowing && !isOwnProfile && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Follow this user to see their content
            </p>
            <FollowButton 
              userId={user.id} 
              isFollowing={isFollowing} 
              onFollowChange={handleFollowChange}
              username={user.username}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderPostsContent = () => {
    if (!canViewProfile) return renderPrivateProfileMessage()

    if (error) {
      return (
        <Card className="backdrop-blur-sm bg-card/80 border-border/50">
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Failed to load posts: {error}</p>
          </CardContent>
        </Card>
      )
    }

    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <Card className="backdrop-blur-sm bg-card/80 border-border/50">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              {isOwnProfile 
                ? "Share your first post to get started!" 
                : `${user.first_name} hasn't posted anything yet.`}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLikeToggle={handleLikeToggle} 
          />
        ))}
      </div>
    )
  }

  const renderPlaceholderTab = (title: string, description: string) => (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  if (isBlocked) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">User Blocked</h3>
          <p className="text-muted-foreground">
            You have blocked this user and cannot view their profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <UserAvatar user={user} size="xl" className="mx-auto md:mx-0" />
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.is_admin && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    {getVisibilityBadge(user.profile_visibility)}
                  </div>
                  
                  {mutualFollowersCount > 0 && !isOwnProfile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Followed by {mutualFollowersCount} mutual{' '}
                      {mutualFollowersCount === 1 ? 'connection' : 'connections'}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-center md:justify-end">
                  {isOwnProfile ? (
                    <Link href="/settings">
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <FollowButton 
                      userId={user.id} 
                      isFollowing={isFollowing} 
                      onFollowChange={handleFollowChange}
                      username={user.username}
                      showFollowingState
                    />
                  )}
                </div>
              </div>

              {user.bio && (
                <div className="mt-4">
                  <p className="text-foreground text-pretty leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary truncate flex items-center gap-1"
                      onClick={(e) => handleWebsiteClick(e, user.website!)}
                    >
                      {user.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1" title={user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString()}` : 'Join date unknown'}>
                  <Calendar className="h-4 w-4" />
                  <span>Joined {profileMeta.joinDate}</span>
                </div>
                {profileMeta.lastSeen && !isOwnProfile && (
                  <div className="flex items-center gap-1" title="Last activity">
                    <span>Active {profileMeta.lastSeen}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                <Link 
                  href={`/users/${user.id}/following`} 
                  className="hover:underline transition-colors"
                >
                   <span className="font-semibold">
                  {profileStats?.following?.toLocaleString?.() ?? 0}
                </span>{" "}
                <span className="text-muted-foreground">Following</span>
                </Link>
                <Link 
                  href={`/users/${user.id}/followers`} 
                  className="hover:underline transition-colors"
                >
                  <span className="font-semibold">{profileStats?.followers?.toLocaleString?.() ?? 0}</span>{" "}
                  <span className="text-muted-foreground">
                    {profileStats?.followers === 1 ? 'Follower' : 'Followers'}
                  </span>
                </Link>
                <div>
                  <span className="font-semibold">{profileStats?.posts?.toLocaleString?.() ?? 0}</span>{" "}
                  <span className="text-muted-foreground">
                    {profileStats?.posts === 1 ? 'Post' : 'Posts'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="followers" className="gap-2">
            <Users className="h-4 w-4" />
            Followers
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {renderPostsContent()}
        </TabsContent>

        <TabsContent value="followers">
          {renderPlaceholderTab(
            "Followers", 
            "View who follows this user. Feature coming soon..."
          )}
        </TabsContent>

        <TabsContent value="following">
          {renderPlaceholderTab(
            "Following", 
            "View who this user follows. Feature coming soon..."
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}