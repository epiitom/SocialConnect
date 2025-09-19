"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost" | "destructive"
  disabled?: boolean
  showFollowingState?: boolean
  username?: string
  className?: string
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
  className = "",
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
    if (loading) return ""
    
    if (isFollowing) {
      return isHovering ? "Unfollow" : "Following"
    }
    
    return "Follow"
  }

  const getButtonIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (isFollowing) {
      return isHovering ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />
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
    let baseClasses = `gap-2 transition-all duration-200 ${className}`
    
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

  // If showFollowingState is false and already following, don't show the button
  if (!showFollowingState && isFollowing) {
    return null
  }

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleFollow}
      disabled={loading || disabled}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden ${getButtonClassName()}`}
      aria-label={isFollowing ? "Unfollow user" : "Follow user"}
    >
      <span className={`flex items-center gap-2 transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {getButtonIcon()}
        <span className="font-medium">
          {getButtonText()}
        </span>
      </span>
      
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </Button>
  )
}