import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Post } from '@/types/database';
import { useAuth } from './useAuth';

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFeed = async (pageNum: number = 1, reset: boolean = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/feed?page=${pageNum}&limit=20`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch feed');
      }

      if (reset || pageNum === 1) {
        setPosts(result.data || []);
      } else {
        setPosts(prev => [...prev, ...(result.data || [])]);
      }

      setHasMore(result.pagination.hasNext);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed(1, true);
    }
  }, [user]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFeed(page + 1);
    }
  };

  const refresh = () => {
    fetchFeed(1, true);
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