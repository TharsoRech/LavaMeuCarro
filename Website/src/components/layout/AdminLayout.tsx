import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../stores/authStore';
import { LayoutDashboard, Calendar, Users, Wrench, BarChart3, Building2, Bell, Settings, LogOut, Car } from 'lucide-react';

const navItems = [
  { to: '/admin/painel', icon: LayoutDashboard, label: 'Painel' },
  { to: '/admin/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/admin/equipe', icon: Users, label: 'Equipe' },
  { to: '/admin/servicos', icon: Wrench, label: 'Serviços' },
  { to: '/admin/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/admin/unidades', icon: Building2, label: 'Unidades' },
  { to: '/admin/notificacoes', icon: Bell, label: 'Notificações' },
  { to: '/admin/perfil', icon: Settings, label: 'Perfil' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => { clearAuth(); navigate('/admin/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-brand-600" />
            <span className="text-xl font-bold text-brand-700">Lava Meu Carro</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="px-4 py-2 text-sm text-gray-500">{user?.name}</div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
