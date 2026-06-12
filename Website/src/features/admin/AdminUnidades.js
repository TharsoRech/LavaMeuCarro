import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyUnidades, createUnidade, updateUnidade, deleteUnidade, publishUnidade } from '../../api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Phone, Plus, Edit2, Trash2, Eye, EyeOff, Star } from 'lucide-react';
export default function AdminUnidades() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', address: '', city: '', state: '', cep: '',
        phone: '', email: '', ofereceLevaTraz: false,
    });
    const { data: unidades, isLoading } = useQuery({
        queryKey: ['minhas-unidades'],
        queryFn: getMyUnidades,
    });
    const createMut = useMutation({
        mutationFn: createUnidade,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); closeModal(); },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateUnidade(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); closeModal(); },
    });
    const deleteMut = useMutation({
        mutationFn: (id) => deleteUnidade(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); setDeleteConfirm(null); },
    });
    const publishMut = useMutation({
        mutationFn: ({ id, published }) => publishUnidade(id, published),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }),
    });
    const closeModal = () => {
        setShowModal(false);
        setEditingUnit(null);
        setForm({ name: '', description: '', address: '', city: '', state: '', cep: '', phone: '', email: '', ofereceLevaTraz: false });
    };
    const openEdit = (unit) => {
        setEditingUnit(unit);
        setForm({
            name: unit.name || '',
            description: unit.description || '',
            address: unit.address || '',
            city: unit.city || '',
            state: unit.state || '',
            cep: unit.cep || '',
            phone: unit.phone || '',
            email: unit.email || '',
            ofereceLevaTraz: unit.ofereceLevaTraz || false,
        });
        setShowModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUnit) {
            updateMut.mutate({ id: editingUnit.id, data: form });
        }
        else {
            createMut.mutate(form);
        }
    };
    const units = Array.isArray(unidades) ? unidades : [];
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Minhas Unidades" }), _jsxs(Button, { onClick: () => setShowModal(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Nova Unidade"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: isLoading ? (_jsx("p", { className: "text-gray-400 col-span-2 text-center py-8 animate-pulse", children: "Carregando..." })) : units.length === 0 ? (_jsxs("div", { className: "col-span-2 text-center py-12 bg-white rounded-xl border border-gray-100", children: [_jsx(MapPin, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: "Nenhuma unidade cadastrada" })] })) : (units.map((u) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: u.name }), u.description && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: u.description })] }), _jsx("button", { onClick: () => openEdit(u), className: "p-1.5 text-gray-400 hover:text-blue-600 rounded", children: _jsx(Edit2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "space-y-2 text-sm text-gray-600", children: [_jsxs("p", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-400" }), u.address || 'Endereço não informado', u.city ? `, ${u.city}` : '', u.state ? ` - ${u.state}` : ''] }), _jsxs("p", { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "w-4 h-4 text-gray-400" }), u.phone || 'Não informado'] }), u.email && _jsxs("p", { className: "flex items-center gap-2", children: ["Email: ", u.email] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Badge, { variant: u.active ? 'success' : 'gray', children: u.active ? 'Ativo' : 'Inativo' }), _jsx(Badge, { variant: u.published ? 'success' : 'warning', children: u.published ? 'Publicado' : 'Não publicado' }), u.ofereceLevaTraz && _jsx(Badge, { variant: "info", children: "Leva e Traz" }), u.averageRating && (_jsxs(Badge, { variant: "warning", children: [_jsx(Star, { className: "w-3 h-3 mr-1" }), " ", u.averageRating.toFixed(1)] }))] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => publishMut.mutate({ id: u.id, published: !u.published }), loading: publishMut.isPending, children: u.published ? _jsxs(_Fragment, { children: [_jsx(EyeOff, { className: "w-4 h-4 mr-1" }), " Despublicar"] }) : _jsxs(_Fragment, { children: [_jsx(Eye, { className: "w-4 h-4 mr-1" }), " Publicar"] }) }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteConfirm(u), children: [_jsx(Trash2, { className: "w-4 h-4 mr-1" }), " Excluir"] })] })] }) }, u.id)))) }), _jsx(Modal, { open: showModal, onClose: closeModal, title: editingUnit ? 'Editar Unidade' : 'Nova Unidade', size: "lg", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Nome", value: form.name, onChange: (e) => setForm(f => ({ ...f, name: e.target.value })), required: true }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", rows: 2, value: form.description, onChange: (e) => setForm(f => ({ ...f, description: e.target.value })) })] }), _jsx(Input, { label: "Endere\u00E7o", value: form.address, onChange: (e) => setForm(f => ({ ...f, address: e.target.value })), required: true }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Input, { label: "Cidade", value: form.city, onChange: (e) => setForm(f => ({ ...f, city: e.target.value })), required: true }), _jsx(Input, { label: "Estado", value: form.state, onChange: (e) => setForm(f => ({ ...f, state: e.target.value })), required: true, maxLength: 2 }), _jsx(Input, { label: "CEP", value: form.cep, onChange: (e) => setForm(f => ({ ...f, cep: e.target.value })), placeholder: "00000-000" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Telefone", value: form.phone, onChange: (e) => setForm(f => ({ ...f, phone: e.target.value })) }), _jsx(Input, { label: "Email", type: "email", value: form.email, onChange: (e) => setForm(f => ({ ...f, email: e.target.value })) })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: form.ofereceLevaTraz, onChange: (e) => setForm(f => ({ ...f, ofereceLevaTraz: e.target.checked })) }), _jsx("span", { className: "text-sm text-gray-700", children: "Oferece servi\u00E7o leva e traz" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx(Button, { variant: "outline", type: "button", onClick: closeModal, children: "Cancelar" }), _jsx(Button, { type: "submit", loading: createMut.isPending || updateMut.isPending, children: editingUnit ? 'Salvar' : 'Criar Unidade' })] })] }) }), _jsxs(Modal, { open: !!deleteConfirm, onClose: () => setDeleteConfirm(null), title: "Excluir Unidade", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Tem certeza que deseja excluir ", _jsx("strong", { children: deleteConfirm?.name }), "? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita."] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirm(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", onClick: () => deleteMut.mutate(deleteConfirm?.id), loading: deleteMut.isPending, children: "Excluir" })] })] })] }));
}
