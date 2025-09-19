"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { Header } from "./header"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <Header />
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10">
          <Header />
        </div>
        <main className="pb-16">
          <div className="p-4">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
