/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Trash2, Eye, MoreHorizontal, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
}

interface Post {
  id: string
  content: string
  author: User
  image_url?: string
  category: "general" | "announcement" | "question"
  like_count: number
  comment_count: number
  created_at: string
  is_deleted: boolean
}

export function PostModeration() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/posts?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        setPosts(data.data || [])
      } else {
        throw new Error(data.message || "Failed to fetch posts")
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      toast.error("Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPosts()
  }

  const handleDeletePost = async (postId: string) => {
    if (deletingPostId) return // Prevent multiple simultaneous deletions
    
    try {
      setDeletingPostId(postId)
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to delete post")
      }

      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, is_deleted: true } : post)))
      toast.success("Post deleted successfully")
    } catch (error) {
      console.error("Failed to delete post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setDeletingPostId(null)
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

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Post Moderation</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </Card>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No posts found</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className={`p-4 transition-opacity ${post.is_deleted ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.username} />
                      <AvatarFallback className="text-xs">
                        {post.author.first_name?.[0] || ''}
                        {post.author.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="font-semibold">
                          {post.author.first_name} {post.author.last_name}
                        </p>
                        <span className="text-muted-foreground text-sm">@{post.author.username}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        {post.category !== "general" && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge variant="outline" className={getCategoryColor(post.category)}>
                              {post.category}
                            </Badge>
                          </>
                        )}
                        {post.is_deleted && <Badge variant="destructive">Deleted</Badge>}
                      </div>
                      <p className="text-foreground whitespace-pre-wrap mb-3 break-words">
                        {truncateContent(post.content)}
                      </p>
                      {post.image_url && (
                        <div className="mb-3">
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="rounded-lg max-h-64 w-full object-cover border border-border/50"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{post.like_count} likes</span>
                        <span>{post.comment_count} comments</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {!post.is_deleted && (
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive focus:text-destructive"
                          disabled={deletingPostId === post.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingPostId === post.id ? "Deleting..." : "Delete Post"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}