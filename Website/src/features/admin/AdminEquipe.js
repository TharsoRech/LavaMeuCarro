import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario, getServicos } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Users, Search, Star } from 'lucide-react';
export default function AdminEquipe() {
    const queryClient = useQueryClient();
    const { selectedUnitId } = useUnitSelection();
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', bio: '' });
    const { data: funcionarios, isLoading } = useQuery({
        queryKey: ['funcionarios', selectedUnitId],
        queryFn: () => getFuncionarios(selectedUnitId ?? undefined),
    });
    const { data: servicos } = useQuery({
        queryKey: ['servicos-for-team'],
        queryFn: () => getServicos(selectedUnitId ?? undefined),
    });
    const createMut = useMutation({
        mutationFn: createFuncionario,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
            closeModal();
        },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateFuncionario(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
            closeModal();
        },
    });
    const deleteMut = useMutation({
        mutationFn: (id) => deleteFuncionario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
            setDeleteConfirm(null);
        },
    });
    const closeModal = () => {
        setShowModal(false);
        setEditingMember(null);
        setForm({ name: '', email: '', phone: '', specialty: '', bio: '' });
    };
    const openEdit = (member) => {
        setEditingMember(member);
        setForm({
            name: member.name || '',
            email: member.email || '',
            phone: member.phone || '',
            specialty: member.specialty || '',
            bio: member.bio || '',
        });
        setShowModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...form, unidadeId: selectedUnitId };
        if (editingMember) {
            updateMut.mutate({ id: editingMember.id, data: payload });
        }
        else {
            createMut.mutate(payload);
        }
    };
    const members = Array.isArray(funcionarios) ? funcionarios : [];
    const filtered = search
        ? members.filter((m) => (m.name || m.specialty || '').toLowerCase().includes(search.toLowerCase()))
        : members;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Equipe" }), _jsxs(Button, { onClick: () => setShowModal(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Adicionar Membro"] })] }), _jsxs("div", { className: "relative mb-6", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar por nome ou especialidade...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: isLoading ? (_jsx("p", { className: "text-gray-400 col-span-3 text-center py-8 animate-pulse", children: "Carregando..." })) : filtered.length === 0 ? (_jsxs("div", { className: "col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100", children: [_jsx(Users, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: search ? 'Nenhum resultado encontrado' : 'Nenhum membro cadastrado' })] })) : (filtered.map((f) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-bold text-lg", children: (f.name || f.email || '?').charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: f.name || 'Sem nome' }), _jsx("p", { className: "text-sm text-gray-500", children: f.email || 'Sem email' })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => openEdit(f), className: "p-1.5 text-gray-400 hover:text-blue-600 rounded", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteConfirm(f), className: "p-1.5 text-gray-400 hover:text-red-600 rounded", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Badge, { variant: f.active !== false ? 'success' : 'gray', children: f.active !== false ? 'Ativo' : 'Inativo' }), f.specialty && _jsx(Badge, { variant: "info", children: f.specialty }), f.averageRating && (_jsxs(Badge, { variant: "warning", children: [_jsx(Star, { className: "w-3 h-3 mr-1" }), " ", f.averageRating.toFixed(1)] }))] }), f.bio && _jsx("p", { className: "text-sm text-gray-500 mt-3 line-clamp-2", children: f.bio }), f.phone && _jsxs("p", { className: "text-sm text-gray-500 mt-2", children: ["Tel: ", f.phone] })] }) }, f.id)))) }), _jsx(Modal, { open: showModal, onClose: closeModal, title: editingMember ? 'Editar Membro' : 'Novo Membro', children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Nome", value: form.name, onChange: (e) => setForm(f => ({ ...f, name: e.target.value })), required: true }), _jsx(Input, { label: "Email", type: "email", value: form.email, onChange: (e) => setForm(f => ({ ...f, email: e.target.value })) }), _jsx(Input, { label: "Telefone", value: form.phone, onChange: (e) => setForm(f => ({ ...f, phone: e.target.value })) }), _jsx(Input, { label: "Especialidade", value: form.specialty, onChange: (e) => setForm(f => ({ ...f, specialty: e.target.value })), placeholder: "Ex: Lavagem detalhada, Polimento..." }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bio" }), _jsx("textarea", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", rows: 3, value: form.bio, onChange: (e) => setForm(f => ({ ...f, bio: e.target.value })), placeholder: "Breve descri\u00E7\u00E3o do membro..." })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx(Button, { variant: "outline", type: "button", onClick: closeModal, children: "Cancelar" }), _jsx(Button, { type: "submit", loading: createMut.isPending || updateMut.isPending, children: editingMember ? 'Salvar Alterações' : 'Adicionar' })] })] }) }), _jsxs(Modal, { open: !!deleteConfirm, onClose: () => setDeleteConfirm(null), title: "Remover Membro", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Tem certeza que deseja remover ", _jsx("strong", { children: deleteConfirm?.name || 'este membro' }), " da equipe?"] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirm(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", onClick: () => deleteMut.mutate(deleteConfirm?.id), loading: deleteMut.isPending, children: "Remover" })] })] })] }));
}
