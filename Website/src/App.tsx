import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminAuth, useMasterAuth } from './stores/authStore';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAdminAuth();
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { token } = useMasterAuth();
  return token ? <>{children}</> : <Navigate to="/master/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Admin Public */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="agendamentos" element={<AdminAppointments />} />
            <Route path="equipe" element={<AdminEquipe />} />
            <Route path="servicos" element={<AdminServicos />} />
            <Route path="relatorios" element={<AdminRelatorios />} />
            <Route path="unidades" element={<AdminUnidades />} />
            <Route path="notificacoes" element={<AdminNotificacoes />} />
            <Route path="perfil" element={<AdminPerfil />} />
          </Route>

          {/* Master Public */}
          <Route path="/master/login" element={<MasterLoginPage />} />

          {/* Master Protected */}
          <Route path="/master" element={<MasterRoute><MasterLayout /></MasterRoute>}>
            <Route path="dashboard" element={<MasterDashboard />} />
            <Route path="usuarios" element={<MasterUsuarios />} />
            <Route path="unidades" element={<MasterUnidades />} />
            <Route path="categorias" element={<MasterCategorias />} />
            <Route path="planos" element={<MasterPlanos />} />
            <Route path="assinaturas" element={<MasterAssinaturas />} />
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
