import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../stores/authStore';
import { logNavigationEvent } from '../utils/telemetry';
import { useEffect } from 'react';
export const AdminGuard = ({ children }) => {
    const { isAuthenticated, user } = useAdminAuth();
    const location = useLocation();
    useEffect(() => {
        logNavigationEvent(location.pathname, { section: 'admin' });
    }, [location.pathname]);
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/admin/login", replace: true });
    }
    // Check if user is Owner or Admin type
    if (user && user.type !== 2 && user.type !== 3 && user.tipo !== 2 && user.tipo !== 3) {
        return _jsx(Navigate, { to: "/admin/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
