/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Notification } from '@/types/database';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const result: any = await (supabase.from('notifications') as any)
          .select(`
            *,
            sender:users!notifications_sender_id_fkey(
              id, username, first_name, last_name, avatar_url
            ),
            post:posts(id, content)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const data: Notification[] = result.data || [];
        const error: any = result.error;

        if (error) {
          console.error('Failed to fetch notifications:', error);
        } else {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload: any) => {
          try {
            // Fetch the complete notification with relations
            const result: any = await (supabase.from('notifications') as any)
              .select(`
                *,
                sender:users!notifications_sender_id_fkey(
                  id, username, first_name, last_name, avatar_url
                ),
                post:posts(id, content)
              `)
              .eq('id', payload.new.id)
              .single();

            const newNotification: Notification = result.data;

            if (newNotification && !result.error) {
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          } catch (error: any) {
            console.error('Error fetching new notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const updateData: any = { is_read: true };
      const result: any = await (supabase.from('notifications') as any)
        .update(updateData)
        .eq('id', notificationId);

      const error: any = result.error;

      if (!error) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark notification as read:', error);
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const updateData: any = { is_read: true };
      const result: any = await (supabase.from('notifications') as any)
        .update(updateData)
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      const error: any = result.error;

      if (!error) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('Failed to mark all notifications as read:', error);
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}