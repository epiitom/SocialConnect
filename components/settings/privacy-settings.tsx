"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { 
  Shield, 
  Eye, 
  Users, 
  Lock, 
  Loader2, 
  Info, 
  UserCheck, 
  MessageCircle,
  Globe,
  AlertTriangle 
} from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PrivacySettings {
  profile_visibility: "public" | "private" | "followers_only"
  allow_search_engines: boolean
  show_online_status: boolean
  allow_direct_messages: "everyone" | "followers" | "nobody"
  require_approval_for_followers: boolean
  show_follower_count: boolean
  show_following_count: boolean
  allow_tagging: "everyone" | "followers" | "nobody"
  show_email: boolean
}

const DEFAULT_SETTINGS: PrivacySettings = {
  profile_visibility: "public",
  allow_search_engines: true,
  show_online_status: true,
  allow_direct_messages: "everyone",
  require_approval_for_followers: false,
  show_follower_count: true,
  show_following_count: true,
  allow_tagging: "everyone",
  show_email: false,
}

export function PrivacySettings() {
  const { refreshUser } = useAuth()
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    fetchPrivacySettings()
  }, [])

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(changed)
  }, [settings, originalSettings])

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch("/api/users/me/privacy", {
        credentials: "same-origin",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const fetchedSettings = { ...DEFAULT_SETTINGS, ...data.data }
        setSettings(fetchedSettings)
        setOriginalSettings(fetchedSettings)
      } else {
        throw new Error(data.message || "Failed to load privacy settings")
      }
    } catch (error) {
      console.error("Failed to fetch privacy settings:", error)
      toast.error("Failed to load privacy settings")
      // Set defaults on error
      setSettings(DEFAULT_SETTINGS)
      setOriginalSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("No changes to save")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/users/me/privacy", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to update privacy settings")
      }

      setOriginalSettings(settings)
      await refreshUser()
      toast.success("Privacy settings updated successfully")
    } catch (error) {
      console.error("Failed to save privacy settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save privacy settings")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    toast.info("Changes discarded")
  }

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K, 
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const privacyOptions = [
    {
      value: "public" as const,
      label: "Public",
      description: "Anyone can see your profile, posts, and connections",
      icon: Eye,
      color: "text-green-500",
      risk: "low",
    },
    {
      value: "followers_only" as const,
      label: "Followers Only",
      description: "Only your followers can see your posts and connections",
      icon: Users,
      color: "text-blue-500",
      risk: "medium",
    },
    {
      value: "private" as const,
      label: "Private",
      description: "Only you can see your posts and connections. Profile is hidden from searches.",
      icon: Lock,
      color: "text-red-500",
      risk: "high",
    },
  ]

  const messageOptions = [
    { value: "everyone" as const, label: "Everyone" },
    { value: "followers" as const, label: "Followers Only" },
    { value: "nobody" as const, label: "Nobody" },
  ]

  const taggingOptions = [
    { value: "everyone" as const, label: "Everyone" },
    { value: "followers" as const, label: "Followers Only" },
    { value: "nobody" as const, label: "Nobody" },
  ]

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control who can see your profile and interact with you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Level Warning */}
      {settings.profile_visibility === "public" && settings.allow_search_engines && (
        <Card className="backdrop-blur-sm bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Public Profile Notice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your profile is currently public and searchable by search engines. 
                  Consider adjusting your privacy settings if you want more control over who can find you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control who can see your profile and interact with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile Visibility */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-base font-medium">Profile Visibility</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This affects who can see your profile, posts, and activity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Choose who can see your profile information and posts</p>

            <RadioGroup
              value={settings.profile_visibility}
              onValueChange={(value) => updateSetting("profile_visibility", value as PrivacySettings["profile_visibility"])}
              className="space-y-4"
            >
              {privacyOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div key={option.value} className="flex items-start space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span className="font-medium">{option.label}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          option.risk === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          option.risk === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {option.risk} privacy
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Advanced Privacy Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Search & Discovery
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Search Engine Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow search engines like Google to index your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.allow_search_engines}
                  onCheckedChange={(checked) => updateSetting("allow_search_engines", checked)}
                  disabled={settings.profile_visibility !== "public"}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Require Follower Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Manually approve new followers before they can see your content
                  </p>
                </div>
                <Switch
                  checked={settings.require_approval_for_followers}
                  onCheckedChange={(checked) => updateSetting("require_approval_for_followers", checked)}
                />
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Profile Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you&apos;re online or recently active
                  </p>
                </div>
                <Switch
                  checked={settings.show_online_status}
                  onCheckedChange={(checked) => updateSetting("show_online_status", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Show Follower Count</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the number of followers on your profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_follower_count}
                  onCheckedChange={(checked) => updateSetting("show_follower_count", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Show Following Count</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the number of accounts you follow on your profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_following_count}
                  onCheckedChange={(checked) => updateSetting("show_following_count", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="font-medium">Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email address on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_email}
                  onCheckedChange={(checked) => updateSetting("show_email", checked)}
                />
              </div>
            </div>
          </div>

          {/* Communication Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Communication
            </h3>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Who can send you direct messages?</Label>
                <RadioGroup
                  value={settings.allow_direct_messages}
                  onValueChange={(value) => updateSetting("allow_direct_messages", value as PrivacySettings["allow_direct_messages"])}
                  className="mt-3"
                >
                  {messageOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`dm_${option.value}`} />
                      <Label htmlFor={`dm_${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Who can tag you in posts?</Label>
                <RadioGroup
                  value={settings.allow_tagging}
                  onValueChange={(value) => updateSetting("allow_tagging", value as PrivacySettings["allow_tagging"])}
                  className="mt-3"
                >
                  {taggingOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`tag_${option.value}`} />
                      <Label htmlFor={`tag_${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border/50">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset Changes
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving} 
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}