/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner" // FIXED: Using sonner instead of useToast
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { CommentModal } from "./comment-modal"

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
  author: User
  created_at: string
}

interface Post {
  id: string
  content: string
  author: User
  image_url?: string
  category: "general" | "announcement" | "question"
  like_count: number
  comment_count: number
  is_liked: boolean
  created_at: string
  recent_comments?: Comment[]
}

interface PostCardProps {
  post: Post
  onLikeToggle?: (postId: string, isLiked: boolean, likeCount: number) => void
  onCommentClick?: (postId: string) => void
}

export function PostCard({ post, onLikeToggle, onCommentClick }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count)
  const [localIsLiked, setLocalIsLiked] = useState(post.is_liked)

  const handleLike = async () => {
    if (isLiking) return

    // Optimistic update
    const newIsLiked = !localIsLiked
    const newLikeCount = newIsLiked ? localLikeCount + 1 : localLikeCount - 1
    setLocalIsLiked(newIsLiked)
    setLocalLikeCount(newLikeCount)

    setIsLiking(true)
    try {
      const method = localIsLiked ? "DELETE" : "POST"
      const response = await fetch(`/api/posts/${post.id}/like`, { method })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to update like")
      }

      // Update with actual data from server
      setLocalLikeCount(data.data.like_count)
      setLocalIsLiked(data.data.is_liked)
      onLikeToggle?.(post.id, data.data.is_liked, data.data.like_count)
      
      toast.success(data.data.is_liked ? "Post liked" : "Post unliked")
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(localIsLiked)
      setLocalLikeCount(localLikeCount)
      toast.error("Failed to update like")
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Post by ${post.author.first_name} ${post.author.last_name}`,
        text: post.content,
        url: `${window.location.origin}/posts/${post.id}`,
      })
      toast.success("Post shared successfully")
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`)
        toast.success("Link copied to clipboard")
      } catch (clipboardError) {
        toast.error("Failed to share post")
      }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "question":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "announcement":
        return "📢 Announcement"
      case "question":
        return "❓ Question"
      default:
        return category
    }
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:bg-card/90 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/users/${post.author.id}`}>
              <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(post.author.first_name?.[0] || post.author.username?.[0] || '?').toUpperCase()}
                  {(post.author.last_name?.[0] || post.author.username?.[1] || '').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/users/${post.author.id}`} className="hover:underline">
                <p className="font-semibold text-foreground">
                  {post.author.first_name || post.author.last_name
                    ? `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim()
                    : post.author.username}
                </p>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.category !== "general" && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className={getCategoryColor(post.category)}>
                      {getCategoryLabel(post.category)}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-foreground whitespace-pre-wrap text-pretty leading-relaxed">
            {post.content}
          </p>
          {post.image_url && (
            <div className="mt-3">
              <img
                src={post.image_url || "/placeholder.svg"}
                alt="Post image"
                className="rounded-lg max-h-96 w-full object-cover border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  // TODO: Open image in modal/lightbox
                  window.open(post.image_url, '_blank')
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`gap-2 hover:bg-red-500/10 hover:text-red-500 transition-colors ${
                localIsLiked ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 transition-all ${localIsLiked ? "fill-current scale-110" : ""}`} />
              <span className="tabular-nums">{localLikeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(true)}
              className="gap-2 hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">{post.comment_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 hover:bg-green-500/10 hover:text-green-500 text-muted-foreground transition-colors"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Recent Comments */}
        {post.recent_comments && post.recent_comments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
            {post.recent_comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <Link href={`/users/${comment.author.id}`}>
                  <Avatar className="h-6 w-6 hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer">
                    <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} alt={comment.author.username} />
                    <AvatarFallback className="text-xs bg-muted">
                      {(comment.author.first_name?.[0] || comment.author.username?.[0] || '?').toUpperCase()}
                      {(comment.author.last_name?.[0] || comment.author.username?.[1] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/users/${comment.author.id}`} className="font-medium hover:underline">
                      {comment.author.first_name || comment.author.username}
                    </Link>{" "}
                    <span className="text-muted-foreground">{comment.content}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            {post.comment_count > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
              >
                View all {post.comment_count} comments
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Comment Modal */}
      <CommentModal
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={(comment) => {
          // Update local comment count if needed
          // This could be enhanced to update the parent component's state
        }}
      />
    </Card>
  )
}