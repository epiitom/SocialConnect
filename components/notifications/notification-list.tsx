"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { NotificationCard } from "./notification-card"
import { useNotifications } from "@/hooks/use-notifications"
import { Loader2, RefreshCw } from "lucide-react"

interface NotificationListProps {
  onClose: () => void
}

export function NotificationList({ onClose }: NotificationListProps) {
  const { notifications, loading, error, markAllAsRead, refresh } = useNotifications()

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleRefresh = async () => {
    await refresh()
  }

  return (
    <div className="bg-popover/90 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {notifications.some((n) => !n.is_read) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>
      <Separator />

      {error && (
        <div className="p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2">
            Try again
          </Button>
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="h-80">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationCard notification={notification} onClose={onClose} />
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
