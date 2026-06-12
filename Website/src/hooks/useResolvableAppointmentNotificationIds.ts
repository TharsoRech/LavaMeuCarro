import { useMemo } from 'react';
import type { NotificationDto } from '../types';

/**
 * Hook to get appointment notification IDs that can be resolved (marked as read/actioned)
 * Simplified for LavaMeuCarro - returns all appointment-related notification IDs
 */
export function useResolvableAppointmentNotificationIds(
  notifications: NotificationDto[] | undefined
) {
  return useMemo(() => {
    if (!notifications) return [];
    // Return all notification IDs - simplified version
    return notifications.map(n => n.id);
  }, [notifications]);
}
