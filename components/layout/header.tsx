"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserSearchModal } from "@/components/search/user-search-modal"
import { Search, Menu } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function Header() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserSearch, setShowUserSearch] = useState(false)
  const router = useRouter()

  if (!user) return null

  const submitSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/feed?q=${encodeURIComponent(q)}`)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") submitSearch()
  }

  const handleSearchFocus = () => {
    setShowUserSearch(true)
  }

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between p-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo (mobile) */}
        <div className="md:hidden">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SocialConnect
          </h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleSearchFocus}
              className="pl-10 bg-input/50"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />

          {/* User avatar (mobile) */}
          <div className="md:hidden">
       <Avatar className="h-8 w-8">
  <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.username || "User"} />
  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
    {(user?.first_name?.[0] ?? "").toUpperCase()}
    {(user?.last_name?.[0] ?? "").toUpperCase()}
  </AvatarFallback>
</Avatar>

          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users, posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleSearchFocus}
            className="pl-10 bg-input/50"
          />
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal 
        isOpen={showUserSearch} 
        onClose={() => setShowUserSearch(false)} 
      />
    </header>
  )
}
