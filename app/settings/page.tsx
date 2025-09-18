"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ProfileEditForm } from "@/components/settings/profile-edit-form"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileEditForm />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
