import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50).optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).optional(),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
   avatar_url: z.string().url().optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  profile_visibility: z.enum(['public', 'private', 'followers_only']).optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Post validation schemas
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(280, 'Content must be less than 280 characters'),
  category: z.enum(['general', 'announcement', 'question']).default('general'),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(280, 'Content must be less than 280 characters')
    .optional(),
  category: z.enum(['general', 'announcement', 'question']).optional(),
});

// Comment validation schema
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(200, 'Content must be less than 200 characters'),
});

// File validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG and PNG files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 2MB' };
  }

  return { valid: true };
};