// components/users/user-avatar.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface User {
	id: string
	username?: string
	first_name?: string
	last_name?: string
	avatar_url?: string
}

interface UserAvatarProps {
	user: User
	size?: "sm" | "md" | "lg" | "xl"
	className?: string
	onClick?: () => void
}

const sizeClasses = {
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-12 w-12 text-base",
	xl: "h-20 w-20 text-lg"
}

export function UserAvatar({ user, size = "md", className, onClick }: UserAvatarProps) {
	const firstInitial = (user.first_name?.[0] || user.username?.[0] || "?").toUpperCase()
	const lastInitial = (user.last_name?.[0] || user.username?.[1] || "").toUpperCase()
	const initials = `${firstInitial}${lastInitial}`.trim() || "?"
	const altName = `${user.first_name ?? user.username ?? "User"} ${user.last_name ?? ""}`.trim()
	
	return (
		<Avatar 
			className={cn(sizeClasses[size], className, onClick && "cursor-pointer")} 
			onClick={onClick}
		>
			<AvatarImage 
				src={user.avatar_url || undefined}
				alt={altName}
				className="object-cover"
			/>
			<AvatarFallback className="bg-primary text-primary-foreground font-medium">
				{initials}
			</AvatarFallback>
		</Avatar>
	)
}