import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAdminAuth, useMasterAuth } from './stores/authStore';

// Guards
import { AdminGuard } from './guards/AdminGuard';
import { MasterGuard } from './guards/MasterGuard';

// Landing
import LandingPage from './pages/landing/LandingPage';

// Legal (public)
import { PrivacyPolicyPage, TermsOfUsePage } from './pages/legal/LegalDocumentPages';
import DeleteAccountPage from './pages/legal/DeleteAccountPage';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminEquipe from './pages/admin/AdminEquipe';
import AdminServicos from './pages/admin/AdminServicos';
import AdminRelatorios from './pages/admin/AdminRelatorios';
import AdminUnidades from './pages/admin/AdminUnidades';
import AdminNotificacoes from './pages/admin/AdminNotificacoes';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminPrivacy from './pages/admin/AdminPrivacy';
import AdminPrivacyPolicy from './pages/admin/AdminPrivacyPolicy';
import AdminTermsOfUse from './pages/admin/AdminTermsOfUse';

// Master
import MasterLayout from './components/layout/MasterLayout';
import MasterLoginPage from './pages/master/MasterLoginPage';
import MasterDashboard from './pages/master/MasterDashboard';
import MasterUsuarios from './pages/master/MasterUsuarios';
import MasterUnidades from './pages/master/MasterUnidades';
import MasterCategorias from './pages/master/MasterCategorias';
import MasterPlanos from './pages/master/MasterPlanos';
import MasterAssinaturas from './pages/master/MasterAssinaturas';
import MasterConfiguracoes from './pages/master/MasterConfiguracoes';
import MasterPayments from './pages/master/MasterPayments';

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
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Legal Pages (public) */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-use" element={<TermsOfUsePage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />

          {/* Admin Public */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="agendamentos" element={<AdminAppointments />} />
            <Route path="equipe" element={<AdminEquipe />} />
            <Route path="servicos" element={<AdminServicos />} />
            <Route path="relatorios" element={<AdminRelatorios />} />
            <Route path="unidades" element={<AdminUnidades />} />
            <Route path="notificacoes" element={<AdminNotificacoes />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="privacidade" element={<AdminPrivacy />} />
            <Route path="privacy-policy" element={<AdminPrivacyPolicy />} />
            <Route path="terms-of-use" element={<AdminTermsOfUse />} />
            <Route path="perfil" element={<AdminPerfil />} />
          </Route>

          {/* Master Public */}
          <Route path="/master/login" element={<MasterLoginPage />} />

          {/* Master Protected */}
          <Route path="/master" element={<MasterGuard><MasterLayout /></MasterGuard>}>
            <Route index element={<Navigate to="/master/dashboard" replace />} />
            <Route path="dashboard" element={<MasterDashboard />} />
            <Route path="usuarios" element={<MasterUsuarios />} />
            <Route path="unidades" element={<MasterUnidades />} />
            <Route path="categorias" element={<MasterCategorias />} />
            <Route path="planos" element={<MasterPlanos />} />
            <Route path="assinaturas" element={<MasterAssinaturas />} />
            <Route path="pagamentos" element={<MasterPayments />} />
            <Route path="configuracoes" element={<MasterConfiguracoes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
