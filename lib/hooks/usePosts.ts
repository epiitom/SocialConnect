import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Post } from '@/types/database';

interface UsePostsOptions {
  authorId?: string;
  category?: string;
  limit?: number;
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPosts = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(
            id, username, first_name, last_name, avatar_url
          )
        `)
        .eq('is_active', true);

      if (options.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      const limit = options.limit || 20;
      const from = (pageNum - 1) * limit;
      const to = from + limit - 1;

      const { data, error: fetchError } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (reset || pageNum === 1) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === limit);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
  }, [options.authorId, options.category]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const refresh = () => {
    fetchPosts(1, true);
  };

  const addPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  };

  const removePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addPost,
    updatePost,
    removePost,
  };
}