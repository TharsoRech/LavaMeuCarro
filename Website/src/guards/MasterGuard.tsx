import { Navigate, useLocation } from 'react-router-dom';
import { useMasterAuth } from '../stores/authStore';
import { logNavigationEvent } from '../utils/telemetry';
import { useEffect } from 'react';

interface MasterGuardProps {
  children: React.ReactNode;
}

export const MasterGuard: React.FC<MasterGuardProps> = ({ children }) => {
  const { isAuthenticated, user } = useMasterAuth();
  const location = useLocation();

  useEffect(() => {
    logNavigationEvent(location.pathname, { section: 'master' });
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/master/login" replace />;
  }

  // Only Admin type (3) can access master (support both 'type' and 'tipo' fields)
  const userType = user?.type ?? user?.tipo;
  if (user && userType !== 3) {
    return <Navigate to="/master/login" replace />;
  }

  return <>{children}</>;
};
