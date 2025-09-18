"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications } from "@/hooks/use-notifications"
import { Heart, MessageCircle, UserPlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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

interface NotificationCardProps {
  notification: Notification
  onClose: () => void
}

export function NotificationCard({ notification, onClose }: NotificationCardProps) {
  const { markAsRead } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationLink = () => {
    switch (notification.notification_type) {
      case "follow":
        return `/users/${notification.sender.id}`
      case "like":
      case "comment":
        return notification.post_id ? `/posts/${notification.post_id}` : `/users/${notification.sender.id}`
      default:
        return `/users/${notification.sender.id}`
    }
  }

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    onClose()
  }

  return (
    <Link href={getNotificationLink()} onClick={handleClick}>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${
          !notification.is_read ? "bg-accent/20" : ""
        }`}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.sender.avatar_url || "/placeholder.svg"} alt={notification.sender.username} />
          <AvatarFallback className="text-xs bg-muted">
            {notification.sender.first_name[0]}
            {notification.sender.last_name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {getNotificationIcon(notification.notification_type)}
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {notification.sender.first_name} {notification.sender.last_name}
                </span>{" "}
                <span className="text-muted-foreground">
                  {notification.notification_type === "like"
                    ? "liked your post"
                    : notification.notification_type === "comment"
                      ? "commented on your post"
                      : "started following you"}
                </span>
              </p>

              {notification.post && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">&quot;{notification.post.content}&quot;</p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
      </div>
    </Link>
  )
}
