export function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
export function debugToken(label = 'Token') {
    const token = localStorage.getItem('lmc_token');
    if (!token) {
        console.log(`[${label}] No token found`);
        return;
    }
    const payload = decodeJwtPayload(token);
    console.log(`[${label}]`, {
        token: token.substring(0, 20) + '...',
        payload,
        exp: payload?.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
    });
}
