import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMasterAuth } from '../../stores/authStore';
import { LayoutDashboard, Users, Building2, Tag, CreditCard, Shield, Settings, LogOut, Car } from 'lucide-react';

const navItems = [
  { to: '/master', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/master/usuarios', icon: Users, label: 'Usuários' },
  { to: '/master/unidades', icon: Building2, label: 'Unidades' },
  { to: '/master/categorias', icon: Tag, label: 'Categorias' },
  { to: '/master/planos', icon: CreditCard, label: 'Planos' },
  { to: '/master/assinaturas', icon: Shield, label: 'Assinaturas' },
  { to: '/master/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function MasterLayout() {
  const { clearAuth } = useMasterAuth();
  const navigate = useNavigate();
  const handleLogout = () => { clearAuth(); navigate('/master/login'); };

  return (
    <div className="flex h-screen bg-slate-900">
      <aside className="w-64 bg-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-red-400" />
            <span className="text-xl font-bold text-white">Master Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-sm text-red-400 hover:bg-slate-700 rounded-lg">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-900">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
