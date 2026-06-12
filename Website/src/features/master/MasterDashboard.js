import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Users, Building2, DollarSign, Activity, AlertCircle } from 'lucide-react';
export default function MasterDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['master-stats'],
        queryFn: async () => (await api.get('/admin/stats')).data,
    });
    const cards = [
        { label: 'Usuários Total', value: stats?.totalUsuarios ?? 0, icon: Users, color: 'bg-blue-500' },
        { label: 'Unidades Ativas', value: stats?.unidadesAtivas ?? 0, icon: Building2, color: 'bg-green-500' },
        { label: 'Receita (Mês)', value: `R$ ${(stats?.receitaMes ?? 0).toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500' },
        { label: 'Agendamentos (Mês)', value: stats?.agendamentosMes ?? 0, icon: Activity, color: 'bg-purple-500' },
    ];
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Dashboard Master" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: cards.map((c) => (_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: c.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900 mt-1", children: isLoading ? '...' : c.value })] }), _jsx("div", { className: `${c.color} p-3 rounded-lg`, children: _jsx(c.icon, { className: "w-6 h-6 text-white" }) })] }) }, c.label))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Unidades Recentes" }), _jsx("div", { className: "space-y-3", children: Array.from({ length: 5 }).map((_, i) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center", children: _jsx(Building2, { className: "w-5 h-5 text-slate-600" }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-gray-900", children: ["Unidade ", i + 1] }), _jsx("p", { className: "text-sm text-gray-500", children: "owner@email.com" })] })] }), _jsx("span", { className: "px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium", children: "Ativo" })] }, i))) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Alertas do Sistema" }), _jsx("div", { className: "space-y-3", children: [
                                    { msg: '2 assinaturas vencendo hoje', type: 'warning' },
                                    { msg: '15 novos usuários esta semana', type: 'info' },
                                    { msg: 'Todos os serviços operacionais', type: 'success' },
                                ].map((alert, i) => (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50' : alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'}`, children: [_jsx(AlertCircle, { className: `w-5 h-5 ${alert.type === 'warning' ? 'text-yellow-600' : alert.type === 'success' ? 'text-green-600' : 'text-blue-600'}` }), _jsx("p", { className: `text-sm font-medium ${alert.type === 'warning' ? 'text-yellow-800' : alert.type === 'success' ? 'text-green-800' : 'text-blue-800'}`, children: alert.msg })] }, i))) })] })] })] }));
}
