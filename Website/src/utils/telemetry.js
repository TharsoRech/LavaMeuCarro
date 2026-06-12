import { api } from '../api/client';
export function logNavigationEvent(page, metadata) {
    try {
        api.post('/telemetria', {
            type: 'navigation',
            page,
            timestamp: new Date().toISOString(),
            metadata,
        }).catch(() => { });
    }
    catch {
        // telemetry is non-critical
    }
}
export function logAction(action, metadata) {
    try {
        api.post('/telemetria', {
            type: 'action',
            action,
            timestamp: new Date().toISOString(),
            metadata,
        }).catch(() => { });
    }
    catch {
        // telemetry is non-critical
    }
}
export function logTelemetry(type, data) {
    try {
        api.post('/telemetria', {
            type,
            ...data,
            timestamp: new Date().toISOString(),
        }).catch(() => { });
    }
    catch {
        // telemetry is non-critical
    }
}
