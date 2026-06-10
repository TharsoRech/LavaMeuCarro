import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../stores/authStore';
import { logNavigationEvent } from '../utils/telemetry';
import { useEffect } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAuthenticated, user } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    logNavigationEvent(location.pathname, { section: 'admin' });
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user is Owner or Admin type
  if (user && user.tipo !== 2 && user.tipo !== 3) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
