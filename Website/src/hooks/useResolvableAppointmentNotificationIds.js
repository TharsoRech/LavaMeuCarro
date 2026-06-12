import { useMemo } from 'react';
/**
 * Hook to get appointment notification IDs that can be resolved (marked as read/actioned)
 * Simplified for LavaMeuCarro - returns all appointment-related notification IDs
 */
export function useResolvableAppointmentNotificationIds(notifications) {
    return useMemo(() => {
        if (!notifications)
            return [];
        // Return all notification IDs - simplified version
        return notifications.map(n => n.id);
    }, [notifications]);
}
