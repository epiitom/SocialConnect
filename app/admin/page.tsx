"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { AdminGuard } from "@/components/admin/admin-guard"
import { StatsCards } from "@/components/admin/stats-cards"
import { UserManagement } from "@/components/admin/user-management"
import { PostModeration } from "@/components/admin/post-moderation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield } from "lucide-react"

export default function AdminPage() {
  return (
    <AdminGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>

          <StatsCards />

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="posts">Post Moderation</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              <PostModeration />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AdminGuard>
  )
}
