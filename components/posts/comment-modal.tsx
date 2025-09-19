"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/users/use-avatar"
import { Send, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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

interface CommentModalProps {
  postId: string
  isOpen: boolean
  onClose: () => void
  onCommentAdded?: (comment: Comment) => void
}

export function CommentModal({ postId, isOpen, onClose, onCommentAdded }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchComments = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20"
      })
      
      const response = await fetch(`/api/posts/${postId}/comments?${params}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch comments")
      }

      setComments(prev => reset ? data.data : [...prev, ...data.data])
      setHasMore(data.pagination?.hasNext || false)
      setPage(pageNum)
    } catch (error) {
      console.error("Fetch comments error:", error)
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: newComment.trim() })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add comment")
      }

      // Add new comment to the list
      setComments(prev => [data.data, ...prev])
      setNewComment("")
      onCommentAdded?.(data.data)
      toast.success("Comment added successfully")
    } catch (error) {
      console.error("Submit comment error:", error)
      toast.error("Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchComments(page + 1)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchComments(1, true)
    } else {
      setComments([])
      setNewComment("")
      setPage(1)
      setHasMore(false)
    }
  }, [isOpen, postId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Comments List */}
          <ScrollArea className="flex-1 p-4">
            {loading && comments.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Link href={`/users/${comment.author.id}`} onClick={onClose}>
                      <UserAvatar user={comment.author} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/users/${comment.author.id}`} 
                          className="font-medium hover:underline"
                          onClick={onClose}
                        >
                          {comment.author.first_name && comment.author.last_name
                            ? `${comment.author.first_name} ${comment.author.last_name}`
                            : comment.author.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center py-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="self-end"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Ctrl+Enter to submit
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

