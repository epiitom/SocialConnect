"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PostForm } from "@/components/posts/post-form"
import { PostCard } from "@/components/posts/post-card"
import { PostSkeleton } from "@/components/posts/post-skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFeed } from "@/hooks/use-feed"
import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function FeedPage() {
  const { posts, loading, error, hasMore, loadMore, refresh, addPost, updatePost } = useFeed()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePostCreated = (newPost: any) => {
    addPost(newPost)
  }

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
  const currentPost = posts.find((p) => p.id === postId)
if (!currentPost) return // Early return if post not found

const newLikeCount = currentPost.like_count + (isLiked ? 1 : -1)
updatePost(postId, {
  is_liked: isLiked,
  like_count: Math.max(0, newLikeCount), // Ensure count doesn't go negative
})
  }

  const handleCommentClick = (postId: string) => {
    // TODO: Navigate to post detail page or open comment modal
    console.log("Comment on post:", postId)
  }

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight ||
        loading
      ) {
        return
      }
      if (hasMore) {
        loadMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, loading, loadMore])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Post Form */}
        <PostForm onPostCreated={handlePostCreated} />

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} onCommentClick={handleCommentClick} />
          ))}

          {/* Loading Skeletons */}
          {loading && Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={`skeleton-${i}`} />)}

          {/* Load More */}
          {!loading && hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" onClick={loadMore}>
                Load More Posts
              </Button>
            </div>
          )}

          {/* End of Feed */}
          {!loading && !hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>You&apos;ve reached the end of your feed</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Your feed is empty</p>
              <p className="text-sm text-muted-foreground">Follow some users to see their posts here</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
