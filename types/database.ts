// types/database.ts
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
  is_active: boolean;
  is_admin: boolean;
  profile_visibility: 'public' | 'private' | 'followers_only';
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Post {
  id: string;
  content: string;
  author_id: string;
  author?: User;
  image_url?: string;
  category: 'general' | 'announcement' | 'question';
  is_active: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean; // For current user
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  follower?: User;
  following?: User;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  user?: User;
  post?: Post;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  author?: User;
  post?: Post;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  notification_type: 'follow' | 'like' | 'comment';
  post_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  post?: Post;
}

// Supabase types - FIXED VERSION
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string; // Auth user ID
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          location?: string;
          is_active?: boolean; // Has default
          is_admin?: boolean; // Has default
          profile_visibility?: 'public' | 'private' | 'followers_only'; // Has default
          // These have defaults/triggers, so optional
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          last_login?: string;
        };
        Update: {
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          location?: string;
          is_active?: boolean;
          is_admin?: boolean;
          profile_visibility?: 'public' | 'private' | 'followers_only';
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          last_login?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: Post;
        Insert: {
          content: string;
          author_id: string;
          image_url?: string;
          category?: 'general' | 'announcement' | 'question'; // Has default
          is_active?: boolean; // Has default
        };
        Update: {
          content?: string;
          image_url?: string;
          category?: 'general' | 'announcement' | 'question';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      follows: {
        Row: Follow;
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: never;
      };
      likes: {
        Row: Like;
        Insert: {
          user_id: string;
          post_id: string;
        };
        Update: never;
      };
      comments: {
        Row: Comment;
        Insert: {
          content: string;
          author_id: string;
          post_id: string;
          is_active?: boolean; // Has default
        };
        Update: {
          content?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      notifications: {
        Row: Notification;
        Insert: {
          recipient_id: string;
          sender_id: string;
          notification_type: 'follow' | 'like' | 'comment';
          post_id?: string;
          message: string;
          is_read?: boolean; // Has default
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
}