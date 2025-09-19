"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NotificationCard } from "./notification-card"
import { useNotifications } from "@/hooks/use-notifications"
import { Loader2, RefreshCw, Bell } from "lucide-react"

export function NotificationCenter() {
  const { notifications, loading, error, markAllAsRead, refresh } = useNotifications()

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleRefresh = async () => {
    await refresh()
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {notifications.some((n) => !n.is_read) && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="p-6 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        )}

        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  When someone likes your posts or follows you, you&apos;ll see it here
                </p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationCard notification={notification} onClose={() => {}} />
                    {index < notifications.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
