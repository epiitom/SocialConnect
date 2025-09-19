/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { 
  Camera, 
  Loader2, 
  User, 
  X, 
  Upload, 
  AlertTriangle,
  Check,
  Globe,
  MapPin,
  FileImage 
} from "lucide-react"
import { toast } from "sonner"

const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  bio: z
    .string()
    .max(320, "Bio must be less than 320 characters")
    .transform(val => val?.trim() || ""),
  website: z
    .string()
    .refine((val) => {
      if (!val || val === "") return true
      try {
        const url = new URL(val)
        return ['http:', 'https:'].includes(url.protocol)
      } catch {
        return false
      }
    }, "Please enter a valid URL starting with http:// or https://")
    .transform(val => val?.trim() || ""),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .transform(val => val?.trim() || ""),
})

type ProfileFormData = z.infer<typeof profileSchema>

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const COMPRESSION_QUALITY = 0.8

export function ProfileEditForm() {
  const { user, refreshUser } = useAuth()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting, isDirty },
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      website: user?.website || "",
      location: user?.location || "",
    },
  })

  const bio = watch("bio")
  const website = watch("website")
  const remainingChars = 320 - (bio?.length || 0)

  // Compress image before upload
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 400x400)
        const maxSize = 400
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original if compression fails
            }
          },
          file.type,
          COMPRESSION_QUALITY
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  const validateAndProcessImage = useCallback(async (file: File): Promise<File | null> => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)")
      return null
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB")
      return null
    }

    // Check if image is corrupted
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = async () => {
        URL.revokeObjectURL(img.src)
        try {
          setIsCompressing(true)
          const compressedFile = await compressImage(file)
          setIsCompressing(false)
          resolve(compressedFile)
         
        } catch (error) {
          setIsCompressing(false)
          toast.error("Failed to process image")
          resolve(null)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        setIsCompressing(false)
        toast.error("Invalid or corrupted image file")
        resolve(null)
      }
      img.src = URL.createObjectURL(file)
    })
  }, [compressImage])

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const processedFile = await validateAndProcessImage(file)
    if (!processedFile) return

    setSelectedImage(processedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(processedFile)
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      const formData = new FormData();
      
      // Add form data fields
      if (data.first_name?.trim()) formData.append("first_name", data.first_name.trim());
      if (data.last_name?.trim()) formData.append("last_name", data.last_name.trim());
      if (data.bio?.trim()) formData.append("bio", data.bio.trim());
      if (data.website?.trim()) formData.append("website", data.website.trim());
      if (data.location?.trim()) formData.append("location", data.location.trim());
      
      // Add image if selected
      if (selectedImage) {
        formData.append("avatar", selectedImage);
      }

      const response = await fetch("/api/users/me", {
        method: "PUT",
        body: formData,
        // Don't set Content-Type header - let the browser set it with the correct boundary
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      await refreshUser();
      toast.success("Profile updated successfully!");

      // Reset image selection
      setSelectedImage(null);
      setImagePreview(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset()
    removeSelectedImage()
    toast.info("Changes discarded")
  }

  // Validate URL format for display
  const isValidUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  if (!user) return null

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </CardTitle>
        <CardDescription>Update your profile information and avatar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={imagePreview || user.avatar_url || "/placeholder.svg"}
                  alt={user.username}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {user.first_name?.[0] || 'U'}
                  {user.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              
              {isCompressing ? (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}

              {selectedImage && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeSelectedImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-medium mb-1">Profile Photo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a new avatar image. Supports JPEG, PNG, and WebP (max 5MB)
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isFormSubmitting || isCompressing}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {selectedImage ? 'Change Image' : 'Upload Image'}
                </Button>
                
                {selectedImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileImage className="h-4 w-4" />
                    <span>{(selectedImage.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept={ALLOWED_FILE_TYPES.join(',')}
                className="hidden" 
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input 
                id="first_name" 
                {...register("first_name")} 
                className="bg-input/50"
                maxLength={50}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input 
                id="last_name" 
                {...register("last_name")} 
                className="bg-input/50"
                maxLength={50}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="min-h-[120px] resize-y bg-input/50"
              maxLength={320}
              {...register("bio")}
            />
            <div className="flex justify-between items-center">
              {errors.bio && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.bio.message}
                </p>
              )}
              <span
                className={`text-sm ml-auto ${
                  remainingChars < 20
                    ? "text-destructive"
                    : remainingChars < 50
                      ? "text-amber-500"
                      : "text-muted-foreground"
                }`}
              >
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              {...register("website")}
              className="bg-input/50"
            />
            {website && isValidUrl(website) && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Valid URL format
              </p>
            )}
            {errors.website && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.website.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input 
              id="location" 
              placeholder="City, Country" 
              {...register("location")} 
              className="bg-input/50"
              maxLength={100}
            />
            {errors.location && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Progress Bar for Upload */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || isFormSubmitting}
              className="sm:w-auto"
            >
              Reset Changes
            </Button>
            
            <Button 
              type="submit" 
              disabled={!isDirty && !selectedImage || isFormSubmitting}
              className="w-full sm:w-auto"
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}