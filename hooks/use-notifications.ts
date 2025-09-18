"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
}

interface Notification {
  id: string
  recipient_id: string
  sender_id: string
  sender: User
  notification_type: "follow" | "like" | "comment"
  post_id?: string
  post?: {
    id: string
    content: string
    image_url?: string
  }
  message: string
  is_read: boolean
  created_at: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch("/api/notifications")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch notifications")
      }

      setNotifications(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/count")
      const data = await response.json()

      if (data.success) {
        setUnreadCount(data.data.count || 0)
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to mark notification as read")
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to mark all notifications as read")
      }

      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  // Simulate real-time updates with periodic refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refresh])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}
