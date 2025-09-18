import { MainLayout } from "@/components/layout/main-layout"
import { NotificationCenter } from "@/components/notifications/notification-center"

export default function NotificationsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <NotificationCenter />
      </div>
    </MainLayout>
  )
}
