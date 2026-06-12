import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLoginPage from './features/admin/AdminLoginPage'; // default
import AdminDashboard from './features/admin/AdminDashboard'; // default
import AdminAppointments from './features/admin/AdminAppointments'; // default
// Temporarily disabled - needs implementation
import { AdminProfessionals } from './features/admin/AdminProfessionals'; // named
import { AdminServices } from './features/admin/AdminServices'; // named
import { AdminSalon } from './features/admin/AdminSalon'; // named
// import { AdminProfile } from './features/admin/AdminProfile'; // named
// import { AdminNotifications } from './features/admin/AdminNotifications'; // named
// import { AdminReports } from './features/admin/AdminReports'; // named
import AdminMarketing from './features/admin/AdminMarketing'; // default
import AdminPrivacy from './features/admin/AdminPrivacy'; // default
import AdminTermsOfUse from './features/admin/AdminTermsOfUse'; // default
import AdminPrivacyPolicy from './features/admin/AdminPrivacyPolicy'; // default
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
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(BrowserRouter, { children: [_jsx(AuthCacheClear, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/excluir-conta", element: _jsx(DeleteAccountPage, {}) }), _jsx(Route, { path: "/privacidade", element: _jsx(PrivacyPolicyPage, {}) }), _jsx(Route, { path: "/termos", element: _jsx(TermsOfUsePage, {}) }), _jsx(Route, { path: "/admin/login", element: _jsx(AdminLoginPage, {}) }), _jsx(Route, { element: _jsx(AdminGuard, { children: _jsx("div", {}) }), children: _jsxs(Route, { element: _jsx(AdminLayout, {}), children: [_jsx(Route, { path: "/admin", element: _jsx(Navigate, { to: "/admin/agendamentos", replace: true }) }), _jsx(Route, { path: "/admin/painel", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/admin/agendamentos", element: _jsx(AdminAppointments, {}) }), _jsx(Route, { path: "/admin/profissionais", element: _jsx(AdminProfessionals, {}) }), _jsx(Route, { path: "/admin/servicos", element: _jsx(AdminServices, {}) }), _jsx(Route, { path: "/admin/unidade", element: _jsx(AdminSalon, {}) }), _jsx(Route, { path: "/admin/marketing", element: _jsx(AdminMarketing, {}) }), _jsx(Route, { path: "/admin/privacidade", element: _jsx(AdminPrivacy, {}) }), _jsx(Route, { path: "/admin/termos-de-uso", element: _jsx(AdminTermsOfUse, {}) }), _jsx(Route, { path: "/admin/politica-de-privacidade", element: _jsx(AdminPrivacyPolicy, {}) })] }) }), _jsx(Route, { path: "/master/login", element: _jsx(MasterLoginPage, {}) }), _jsx(Route, { element: _jsx(MasterGuard, { children: _jsx("div", {}) }), children: _jsxs(Route, { element: _jsx(MasterLayout, {}), children: [_jsx(Route, { path: "/master", element: _jsx(MasterDashboard, {}) }), _jsx(Route, { path: "/master/pagamentos", element: _jsx(MasterPayments, {}) })] }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })] }) }));
}
export default App;
