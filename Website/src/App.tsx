import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAdminAuth, useMasterAuth } from './stores/authStore';

// Guards
import { AdminGuard } from './guards/AdminGuard';
import { MasterGuard } from './guards/MasterGuard';

// Landing
import LandingPage from './features/landing/LandingPage';

// Legal (public)
import DeleteAccountPage from './features/legal/DeleteAccountPage';
import { PrivacyPolicyPage, TermsOfUsePage } from './features/legal/LegalDocumentPages';

// Admin - mixed exports
import { AdminLoginPage } from './features/admin/AdminLoginPage';
import { AdminDashboard } from './features/admin/AdminDashboard'; // default
import { AdminAppointments } from './features/admin/AdminAppointments'; // default
// Temporarily disabled - needs implementation
import { AdminProfessionals } from './features/admin/AdminProfessionals'; // named
import { AdminServices } from './features/admin/AdminServices'; // named
import { AdminSalon } from './features/admin/AdminSalon'; // named
import { AdminProfile } from './features/admin/AdminProfile'; // named
import { AdminNotifications } from './features/admin/AdminNotifications'; // named
import { AdminReports } from './features/admin/AdminReports'; // named
import { AdminMarketing } from './features/admin/AdminMarketing'; // default
import { AdminPrivacy } from './features/admin/AdminPrivacy'; // default
import { AdminTermsOfUse } from './features/admin/AdminTermsOfUse'; // default
import { AdminPrivacyPolicy } from './features/admin/AdminPrivacyPolicy'; // default

// Master - mixed exports
import MasterLoginPage from './features/master/MasterLoginPage'; // default
import MasterDashboard from './features/master/MasterDashboard'; // default
// import { MasterUsers } from './features/master/MasterUsers'; // named
// import { MasterSalons } from './features/master/MasterSalons'; // named
// import { MasterCategories } from './features/master/MasterCategories'; // named
// import { MasterSettings } from './features/master/MasterSettings'; // named
// import { MasterSubscriptions } from './features/master/MasterSubscriptions'; // named
// import { MasterPlans } from './features/master/MasterPlans'; // named
import MasterPayments from './features/master/MasterPayments'; // default

// Layouts - default exports
import AdminLayout from './components/layout/AdminLayout';
import MasterLayout from './components/layout/MasterLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AuthCacheClear() {
  const queryCache = useQueryClient();
  const adminAuth = useAdminAuth();
  const masterAuth = useMasterAuth();

  useEffect(() => {
    if (!adminAuth.isAuthenticated && !masterAuth.isAuthenticated) {
      queryCache.clear();
    }
  }, [adminAuth.isAuthenticated, masterAuth.isAuthenticated, queryCache]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthCacheClear />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/excluir-conta" element={<DeleteAccountPage />} />
          <Route path="/privacidade" element={<PrivacyPolicyPage />} />
          <Route path="/termos" element={<TermsOfUsePage />} />

          {/* Admin login (public) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

           {/* Admin panel (protected) */}
           <Route element={<AdminGuard><Outlet /></AdminGuard>}>
             <Route element={<AdminLayout />}>
               {/* Default admin route is now Agendamentos (silent refresh) */}
               <Route path="/admin" element={<Navigate to="/admin/agendamentos" replace />} />
               <Route path="/admin/painel" element={<AdminDashboard />} />
               <Route path="/admin/agendamentos" element={<AdminAppointments />} />
               <Route path="/admin/profissionais" element={<AdminProfessionals />} />
               <Route path="/admin/servicos" element={<AdminServices />} />
               <Route path="/admin/relatorios" element={<AdminReports />} />
               <Route path="/admin/unidade" element={<AdminSalon />} />
               <Route path="/admin/notificacoes" element={<AdminNotifications />} />
               <Route path="/admin/marketing" element={<AdminMarketing />} />
               <Route path="/admin/privacidade" element={<AdminPrivacy />} />
               <Route path="/admin/termos-de-uso" element={<AdminTermsOfUse />} />
               <Route path="/admin/politica-de-privacidade" element={<AdminPrivacyPolicy />} />
               <Route path="/admin/perfil" element={<AdminProfile />} />
             </Route>
           </Route>

          {/* Master login (public) */}
          <Route path="/master/login" element={<MasterLoginPage />} />

          {/* Master panel (protected) */}
          <Route element={<MasterGuard><Outlet /></MasterGuard>}>
            <Route element={<MasterLayout />}>
              <Route path="/master" element={<MasterDashboard />} />
              {/* <Route path="/master/usuarios" element={<MasterUsers />} /> */}
              {/* <Route path="/master/unidades" element={<MasterSalons />} /> */}
              {/* <Route path="/master/categorias" element={<MasterCategories />} /> */}
              {/* <Route path="/master/planos" element={<MasterPlans />} /> */}
              {/* <Route path="/master/assinaturas" element={<MasterSubscriptions />} /> */}
              <Route path="/master/pagamentos" element={<MasterPayments />} />
              {/* <Route path="/master/configuracoes" element={<MasterSettings />} /> */}
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
