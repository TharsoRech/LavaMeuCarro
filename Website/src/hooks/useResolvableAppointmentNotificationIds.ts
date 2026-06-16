import { useCallback } from 'react';
import type { NotificationDto } from '../types';

const reviewNotificationTypes = new Set([
  'new_review',
  'newreview',
  'review',
]);

const normalizeReferenceId = (notification: NotificationDto): number | null => {
  const referenceId = Number(notification.referenceId);
  if (!Number.isFinite(referenceId) || referenceId <= 0) {
    return null;
  }

  return Math.trunc(referenceId);
};

export const supportsAppointmentDetails = (notification: NotificationDto): boolean => {
  const referenceId = normalizeReferenceId(notification);
  if (referenceId === null) {
    return false;
  }

  if (typeof notification.type === 'number') {
    return notification.type !== 4;
  }

  const type = String(notification.type).trim().toLowerCase();
  return !reviewNotificationTypes.has(type);
};

export function useResolvableAppointmentNotificationIds(_notifications: NotificationDto[]) {
  const canOpenAppointmentDetails = useCallback((notification: NotificationDto) => {
    return supportsAppointmentDetails(notification);
  }, []);

  return { canOpenAppointmentDetails };
}
