import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Tag } from 'lucide-react';
import { useState } from 'react';
export default function MasterCategorias() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const { data: categorias, isLoading } = useQuery({
        queryKey: ['categorias'],
        queryFn: async () => (await api.get('/categorias')).data,
    });
    const deleteCat = useMutation({
        mutationFn: (id) => api.delete(`/categorias/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Categorias" }), _jsxs("button", { onClick: () => setShowModal(true), className: "flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700", children: [_jsx(Plus, { className: "w-4 h-4" }), " Nova"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: isLoading ? _jsx("p", { className: "text-gray-400 col-span-3 text-center py-8", children: "Carregando..." }) : !categorias?.length ? (_jsxs("div", { className: "col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100", children: [_jsx(Tag, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: "Nenhuma categoria" })] })) : categorias.map((c) => (_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: c.nome }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: c.descricao || 'Sem descrição' })] }), _jsx("button", { onClick: () => deleteCat.mutate(c.id), className: "text-red-400 hover:text-red-600 text-sm", children: "Remover" })] }) }, c.id))) }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-md p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Nova Categoria" }), _jsxs("form", { className: "space-y-4", onSubmit: (e) => { e.preventDefault(); setShowModal(false); }, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome" }), _jsx("input", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none resize-none" })] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50", children: "Cancelar" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700", children: "Salvar" })] })] })] }) }))] }));
}
