/* eslint-disable @next/next/no-img-element */
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ImageIcon, Loader2, X } from "lucide-react"

const postSchema = z.object({
  content: z.string().min(1, "Post content is required").max(280, "Post must be less than 280 characters"),
  category: z.enum(["general", "announcement", "question"]),
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  onPostCreated?: (post: unknown) => void
}

export function PostForm({ onPostCreated }: PostFormProps) {
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      category: "general",
    },
  })

  const content = watch("content")
  const remainingChars = 280 - (content?.length || 0)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large. Please select an image smaller than 2MB")
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: PostFormData) => {
    try {
      const formData = new FormData()
      formData.append("content", data.content)
      formData.append("category", data.category)
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to create post")
      }

      toast.success("Post created successfully!")

      reset()
      removeImage()
      onPostCreated?.(result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post")
    }
  }

  if (!user) return null

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.first_name[0]}
                {user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
                {...register("content")}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}

              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-64 rounded-lg" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:text-primary/80"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Photo
              </Button>

              <Select onValueChange={(value) => setValue("category", value as "general" | "announcement" | "question")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`text-sm ${
                  remainingChars < 20
                    ? "text-destructive"
                    : remainingChars < 50
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                }`}
              >
                {remainingChars}
              </span>
              <Button
                type="submit"
                disabled={isSubmitting || remainingChars < 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}