"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Key, Trash2, Loader2, AlertTriangle, Eye, EyeOff, Shield } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters") // Increased minimum length
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      .refine((password) => {
        // Check for common patterns
        const commonPatterns = [
          /123456/,
          /password/i,
          /qwerty/i,
          /admin/i,
          /letmein/i,
        ]
        return !commonPatterns.some(pattern => pattern.test(password))
      }, "Password contains common patterns and is not secure"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const deleteConfirmationSchema = z.object({
  confirmText: z.string().refine((val) => val === "DELETE MY ACCOUNT", {
    message: "You must type 'DELETE MY ACCOUNT' exactly to confirm",
  }),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type DeleteConfirmationData = z.infer<typeof deleteConfirmationSchema>

export function AccountSettings() {
  const { user, signOut } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChangeAttempts, setPasswordChangeAttempts] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors, isValid: isDeleteValid },
    reset: resetDeleteForm,
  } = useForm<DeleteConfirmationData>({
    resolver: zodResolver(deleteConfirmationSchema),
    mode: "onChange",
  })

  const newPassword = watch("newPassword")

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" }

    let strength = 0
    const checks = [
      password.length >= 12,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&]/.test(password),
      password.length >= 16,
      /[^\w\s]/.test(password), // Additional special characters
    ]

    strength = checks.filter(Boolean).length

    const levels = [
      { strength: 0, label: "", color: "" },
      { strength: 1, label: "Very Weak", color: "bg-red-500" },
      { strength: 2, label: "Weak", color: "bg-red-400" },
      { strength: 3, label: "Fair", color: "bg-yellow-500" },
      { strength: 4, label: "Good", color: "bg-yellow-400" },
      { strength: 5, label: "Strong", color: "bg-green-500" },
      { strength: 6, label: "Very Strong", color: "bg-green-600" },
      { strength: 7, label: "Excellent", color: "bg-emerald-600" },
    ]

    return levels[strength] || levels[0]
  }

  const passwordStrength = getPasswordStrength(newPassword || "")

  const onPasswordSubmit = async (data: PasswordFormData) => {
    // Rate limiting check
    if (passwordChangeAttempts >= 3) {
      setIsRateLimited(true)
      toast.error("Too many password change attempts. Please wait 15 minutes.")
      setTimeout(() => {
        setIsRateLimited(false)
        setPasswordChangeAttempts(0)
      }, 15 * 60 * 1000) // 15 minutes
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Add CSRF protection if available
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin", // Important for session-based auth
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to change password")
      }

      toast.success("Password changed successfully. Please sign in with your new password.")
      reset()
      setPasswordChangeAttempts(0)
      
      // Sign out user to force re-authentication with new password
      setTimeout(() => {
        signOut()
      }, 2000)

    } catch (error) {
      setPasswordChangeAttempts(prev => prev + 1)
      console.error("Password change error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    }
  }

  const onDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to delete account")
      }

      toast.success("Account deleted successfully")
      await signOut()
      
    } catch (error) {
      console.error("Account deletion error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete account")
    } finally {
      setIsDeleting(false)
      resetDeleteForm()
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="backdrop-blur-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Shield className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 dark:text-blue-400">
          <ul className="list-disc list-inside space-y-1">
            <li>Use a unique password that you don&apos;t use anywhere else</li>
            <li>Include a mix of uppercase, lowercase, numbers, and special characters</li>
            <li>Consider using a password manager for better security</li>
            <li>You&apos;ll be signed out after changing your password for security</li>
          </ul>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password for better security</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrentPassword ? "text" : "password"} 
                  {...register("currentPassword")} 
                  className="bg-input/50 pr-10" 
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNewPassword ? "text" : "password"} 
                  {...register("newPassword")} 
                  className="bg-input/50 pr-10" 
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.strength ? passwordStrength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  )}
                </div>
              )}
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  {...register("confirmPassword")} 
                  className="bg-input/50 pr-10" 
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {isRateLimited && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  Too many password change attempts. Please wait 15 minutes before trying again.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || isRateLimited} 
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>

            {passwordChangeAttempts > 0 && !isRateLimited && (
              <p className="text-sm text-amber-600">
                {3 - passwordChangeAttempts} attempts remaining before temporary lockout.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="backdrop-blur-sm bg-card/80 border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <form onSubmit={handleDeleteSubmit(onDeleteAccount)}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers, including:
                        <br />
                        <br />• All your posts and comments
                        <br />• Your profile information
                        <br />• Your followers and following connections
                        <br />• All your notifications and activity
                        <br />
                        <br />To confirm, please type <strong>&quot;DELETE MY ACCOUNT&quot;</strong> below:
                      </AlertDialogDescription>
                      <Input
                        {...registerDelete("confirmText")}
                        placeholder="DELETE MY ACCOUNT"
                        className="mt-2"
                        autoComplete="off"
                      />
                      {deleteErrors.confirmText && (
                        <p className="text-sm text-destructive mt-1">{deleteErrors.confirmText.message}</p>
                      )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => resetDeleteForm()}>Cancel</AlertDialogCancel>
                      <Button
                        type="submit"
                        disabled={isDeleting || !isDeleteValid}
                        variant="destructive"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete my account"
                        )}
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}