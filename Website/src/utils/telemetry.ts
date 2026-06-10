import { api } from '../api/client';

export function logNavigationEvent(page: string, metadata?: Record<string, unknown>) {
  try {
    api.post('/telemetria', {
      type: 'navigation',
      page,
      timestamp: new Date().toISOString(),
      metadata,
    }).catch(() => {});
  } catch {
    // telemetry is non-critical
  }
}

export function logAction(action: string, metadata?: Record<string, unknown>) {
  try {
    api.post('/telemetria', {
      type: 'action',
      action,
      timestamp: new Date().toISOString(),
      metadata,
    }).catch(() => {});
  } catch {
    // telemetry is non-critical
  }
}
