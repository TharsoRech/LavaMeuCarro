import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Check } from 'lucide-react';
export default function MasterPlanos() {
    const { data: planos, isLoading } = useQuery({
        queryKey: ['planos'],
        queryFn: async () => (await api.get('/planos')).data,
    });
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Planos" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: isLoading ? _jsx("p", { className: "text-gray-400 col-span-3 text-center py-8", children: "Carregando..." }) : planos?.map((p) => (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: p.nome }), _jsxs("p", { className: "text-3xl font-bold text-gray-900 mt-2", children: ["R$ ", p.preco?.toFixed(2), _jsx("span", { className: "text-sm text-gray-500 font-normal", children: "/m\u00EAs" })] }), _jsxs("ul", { className: "mt-4 space-y-2", children: [_jsxs("li", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Check, { className: "w-4 h-4 text-green-500" }), p.limiteAgendamentos ?? '∞', " agendamentos/m\u00EAs"] }), _jsxs("li", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Check, { className: "w-4 h-4 text-green-500" }), "Dashboard b\u00E1sico"] }), _jsxs("li", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Check, { className: "w-4 h-4 text-green-500" }), "Suporte por email"] })] }), _jsx("span", { className: `mt-4 inline-block px-3 py-1 text-xs rounded-full font-medium ${p.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`, children: p.ativo ? 'Ativo' : 'Inativo' })] }, p.id))) })] }));
}
