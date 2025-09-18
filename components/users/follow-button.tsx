"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  disabled?: boolean
  showFollowingState?: boolean
  username?: string
}

export function FollowButton({
  userId,
  isFollowing,
  onFollowChange,
  size = "default",
  variant = "default",
  disabled = false,
  showFollowingState = false,
  username,
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleFollow = useCallback(async () => {
    if (loading || disabled) return

    // Prevent double-clicks
    setLoading(true)
    
    try {
      const method = isFollowing ? "DELETE" : "POST"
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to update follow status")
      }

      // Optimistic update
      const newFollowingState = !isFollowing
      onFollowChange?.(newFollowingState)

      // Success notification
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const action = newFollowingState ? "following" : "unfollowed"
      const userDisplay = username ? `@${username}` : "this user"
      
      if (newFollowingState) {
        toast.success(`Now following ${userDisplay}`)
      } else {
        toast.success(`Unfollowed ${userDisplay}`)
      }

    } catch (error) {
      console.error("Follow/unfollow error:", error)
      
      // More specific error messages
      let errorMessage = "Failed to update follow status"
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage = "User not found"
        } else if (error.message.includes("403")) {
          errorMessage = "Not authorized to follow this user"
        } else if (error.message.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment."
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId, isFollowing, onFollowChange, loading, disabled, username])

  // Handle keyboard activation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleFollow()
    }
  }

  const getButtonText = () => {
    if (loading) return "Loading..."
    
    if (isFollowing) {
      if (showFollowingState && !isHovering) {
        return "Following"
      }
      return isHovering ? "Unfollow" : "Unfollow"
    }
    
    return "Follow"
  }

  const getButtonIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (isFollowing) {
      if (showFollowingState && !isHovering) {
        return <UserCheck className="h-4 w-4" />
      }
      return <UserMinus className="h-4 w-4" />
    }
    
    return <UserPlus className="h-4 w-4" />
  }

  const getButtonVariant = () => {
    if (isFollowing) {
      return isHovering ? "destructive" : "outline"
    }
    return variant
  }

  const getButtonClassName = () => {
    let baseClasses = "gap-2 transition-all duration-200"
    
    if (isFollowing) {
      baseClasses += isHovering 
        ? " hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
        : " border-muted-foreground/20"
    } else {
      baseClasses += " bg-primary hover:bg-primary/90 text-primary-foreground"
    }

    if (loading) {
      baseClasses += " cursor-not-allowed opacity-70"
    }

    return baseClasses
  }

  return (
    <Button
      onClick={handleFollow}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={loading || disabled}
      size={size}
      variant={getButtonVariant()}
      className={getButtonClassName()}
      aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${username ? `@${username}` : 'this user'}`}
    >
      {getButtonIcon()}
      <span className="font-medium">
        {getButtonText()}
      </span>
    </Button>
  )
}