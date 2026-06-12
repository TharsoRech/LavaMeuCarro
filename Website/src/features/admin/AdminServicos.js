import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServicos, createServico, updateServico, deleteServico, getCategorias, createCategoria } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Wrench, Search, Tag } from 'lucide-react';
export default function AdminServicos() {
    const queryClient = useQueryClient();
    const { selectedUnitId } = useUnitSelection();
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [form, setForm] = useState({
        name: '', description: '', price: '', durationMinutes: '', categoryId: '', active: true,
    });
    const { data: servicos, isLoading } = useQuery({
        queryKey: ['servicos', selectedUnitId],
        queryFn: () => getServicos(selectedUnitId ?? undefined),
    });
    const { data: categorias } = useQuery({
        queryKey: ['categorias'],
        queryFn: getCategorias,
    });
    const createMut = useMutation({
        mutationFn: (data) => createServico({ ...data, unidadeId: selectedUnitId }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); closeModal(); },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateServico(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); closeModal(); },
    });
    const deleteMut = useMutation({
        mutationFn: (id) => deleteServico(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); setDeleteConfirm(null); },
    });
    const createCatMut = useMutation({
        mutationFn: (data) => createCategoria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
            setShowCategoryModal(false);
            setNewCategoryName('');
        },
    });
    const closeModal = () => {
        setShowModal(false);
        setEditingService(null);
        setForm({ name: '', description: '', price: '', durationMinutes: '', categoryId: '', active: true });
    };
    const openEdit = (svc) => {
        setEditingService(svc);
        setForm({
            name: svc.name || '',
            description: svc.description || '',
            price: svc.price?.toString() || '',
            durationMinutes: svc.durationMinutes?.toString() || '',
            categoryId: svc.categoryId?.toString() || '',
            active: svc.active !== false,
        });
        setShowModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            price: parseFloat(form.price) || 0,
            durationMinutes: parseInt(form.durationMinutes) || 30,
            categoryId: parseInt(form.categoryId) || 0,
        };
        if (editingService) {
            updateMut.mutate({ id: editingService.id, data: payload });
        }
        else {
            createMut.mutate(payload);
        }
    };
    const services = Array.isArray(servicos) ? servicos : [];
    const categories = Array.isArray(categorias) ? categorias : [];
    const filtered = search
        ? services.filter((s) => (s.name || '').toLowerCase().includes(search.toLowerCase()))
        : services;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Servi\u00E7os" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => setShowCategoryModal(true), children: [_jsx(Tag, { className: "w-4 h-4 mr-1" }), " Categoria"] }), _jsxs(Button, { onClick: () => setShowModal(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Novo Servi\u00E7o"] })] })] }), _jsxs("div", { className: "relative mb-6", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar servi\u00E7o...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" })] }), _jsx(Card, { children: _jsx(CardContent, { className: "py-0", children: isLoading ? (_jsx("div", { className: "py-12 text-center text-gray-400 animate-pulse", children: "Carregando..." })) : filtered.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(Wrench, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado' })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Servi\u00E7o" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Categoria" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Pre\u00E7o" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Dura\u00E7\u00E3o" }), _jsx("th", { className: "text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "Status" }), _jsx("th", { className: "text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: filtered.map((s) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-medium text-gray-900", children: s.name }), s.description && _jsx("p", { className: "text-sm text-gray-500 truncate max-w-xs", children: s.description })] }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: s.categoryName || '—' }), _jsxs("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: ["R$ ", (s.price ?? 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-4 text-sm text-gray-600", children: [s.durationMinutes, " min"] }), _jsx("td", { className: "px-6 py-4", children: _jsx(Badge, { variant: s.active !== false ? 'success' : 'gray', children: s.active !== false ? 'Ativo' : 'Inativo' }) }), _jsxs("td", { className: "px-6 py-4 text-right", children: [_jsx("button", { onClick: () => openEdit(s), className: "p-1.5 text-gray-400 hover:text-blue-600 rounded mr-1", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteConfirm(s), className: "p-1.5 text-gray-400 hover:text-red-600 rounded", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, s.id))) })] }) })) }) }), _jsx(Modal, { open: showModal, onClose: closeModal, title: editingService ? 'Editar Serviço' : 'Novo Serviço', size: "lg", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Nome", value: form.name, onChange: (e) => setForm(f => ({ ...f, name: e.target.value })), required: true }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Categoria" }), _jsxs("select", { value: form.categoryId, onChange: (e) => setForm(f => ({ ...f, categoryId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", children: [_jsx("option", { value: "", children: "Selecione..." }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Pre\u00E7o (R$)", type: "number", step: "0.01", value: form.price, onChange: (e) => setForm(f => ({ ...f, price: e.target.value })), required: true }), _jsx(Input, { label: "Dura\u00E7\u00E3o (min)", type: "number", value: form.durationMinutes, onChange: (e) => setForm(f => ({ ...f, durationMinutes: e.target.value })), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", rows: 3, value: form.description, onChange: (e) => setForm(f => ({ ...f, description: e.target.value })) })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: form.active, onChange: (e) => setForm(f => ({ ...f, active: e.target.checked })) }), _jsx("span", { className: "text-sm text-gray-700", children: "Ativo" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx(Button, { variant: "outline", type: "button", onClick: closeModal, children: "Cancelar" }), _jsx(Button, { type: "submit", loading: createMut.isPending || updateMut.isPending, children: editingService ? 'Salvar' : 'Criar Serviço' })] })] }) }), _jsx(Modal, { open: showCategoryModal, onClose: () => setShowCategoryModal(false), title: "Nova Categoria", children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); createCatMut.mutate({ name: newCategoryName }); }, className: "space-y-4", children: [_jsx(Input, { label: "Nome da Categoria", value: newCategoryName, onChange: (e) => setNewCategoryName(e.target.value), required: true }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setShowCategoryModal(false), children: "Cancelar" }), _jsx(Button, { type: "submit", loading: createCatMut.isPending, children: "Criar" })] })] }) }), _jsxs(Modal, { open: !!deleteConfirm, onClose: () => setDeleteConfirm(null), title: "Excluir Servi\u00E7o", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Tem certeza que deseja excluir ", _jsx("strong", { children: deleteConfirm?.name }), "?"] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirm(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", onClick: () => deleteMut.mutate(deleteConfirm?.id), loading: deleteMut.isPending, children: "Excluir" })] })] })] }));
}
