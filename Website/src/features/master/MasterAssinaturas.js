import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CreditCard } from 'lucide-react';
export default function MasterAssinaturas() {
    const { data: assinaturas, isLoading } = useQuery({
        queryKey: ['assinaturas'],
        queryFn: async () => (await api.get('/admin/assinaturas')).data,
    });
    const statusColors = {
        Ativa: 'bg-green-50 text-green-700',
        Inadimplente: 'bg-red-50 text-red-700',
        Cancelada: 'bg-gray-50 text-gray-700',
    };
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Assinaturas" }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden", children: isLoading ? _jsx("div", { className: "p-8 text-center text-gray-400", children: "Carregando..." }) : !assinaturas?.length ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(CreditCard, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: "Nenhuma assinatura" })] })) : (_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Unidade" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Plano" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Valor" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Status" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Vencimento" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: assinaturas.map((a) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 font-medium text-gray-900", children: a.unidadeNome || '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: a.planoNome || '—' }), _jsxs("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: ["R$ ", (a.valor ?? 0).toFixed(2)] }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full font-medium ${statusColors[a.status] || 'bg-gray-100'}`, children: a.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: a.vencimento ? new Date(a.vencimento).toLocaleDateString('pt-BR') : '—' })] }, a.id))) })] })) })] }));
}
