import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useMasterAuth } from '../stores/authStore';
import { logNavigationEvent } from '../utils/telemetry';
import { useEffect } from 'react';
export const MasterGuard = ({ children }) => {
    const { isAuthenticated, user } = useMasterAuth();
    const location = useLocation();
    useEffect(() => {
        logNavigationEvent(location.pathname, { section: 'master' });
    }, [location.pathname]);
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/master/login", replace: true });
    }
    // Only Admin type (3) can access master
    const userType = user?.type ?? user?.tipo;
    if (user && userType !== 3) {
        return _jsx(Navigate, { to: "/master/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
