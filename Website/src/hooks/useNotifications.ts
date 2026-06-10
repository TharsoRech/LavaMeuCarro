import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotificacoes, markNotificacaoRead, markAllNotificacoesRead } from '../api';
import type { NotificationDto } from '../types';

const POLL_INTERVAL = 30000;

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const data = await getNotificacoes();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently fail - notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchNotifications();

    if (enabled) {
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchNotifications, enabled]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificacaoRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificacoesRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unread = notifications.filter((n) => !n.read);

  return {
    notifications,
    unread,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
