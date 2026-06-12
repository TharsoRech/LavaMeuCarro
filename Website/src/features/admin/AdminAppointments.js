import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAgendamentos, updateAgendamentoStatus, cancelAgendamento, reassignAgendamento, createAgendamento, getFuncionarios, getServicos, getClientHistory, } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge, getStatusBadge } from '../../components/ui/Badge';
import { Calendar, Clock, Search, Plus, Eye, MessageCircle, User, ChevronLeft, ChevronRight, RefreshCw, History, } from 'lucide-react';
import { format } from 'date-fns';
const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Confirmado', label: 'Confirmado' },
    { value: 'EmExecucao', label: 'Em Execução' },
    { value: 'Pronto', label: 'Pronto' },
    { value: 'Finalizado', label: 'Finalizado' },
    { value: 'Cancelado', label: 'Cancelado' },
];
const PAGE_SIZE = 25;
export default function AdminAppointments() {
    const queryClient = useQueryClient();
    const { selectedUnitId } = useUnitSelection();
    const refreshInterval = useRef(null);
    // Filters
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [funcionarioFilter, setFuncionarioFilter] = useState('');
    // Modals
    const [detailModal, setDetailModal] = useState(null);
    const [createModal, setCreateModal] = useState(false);
    const [cancelModal, setCancelModal] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [reassignModal, setReassignModal] = useState(null);
    const [historyModal, setHistoryModal] = useState(null);
    // Create form
    const [createForm, setCreateForm] = useState({
        clientName: '', clientPhone: '', servicoId: '', funcionarioId: '',
        scheduledAt: '', notes: '',
    });
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);
    // Silent refresh every 30s
    useEffect(() => {
        refreshInterval.current = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
        }, 30000);
        return () => { if (refreshInterval.current)
            clearInterval(refreshInterval.current); };
    }, [queryClient]);
    const { data, isLoading } = useQuery({
        queryKey: ['admin-agendamentos', { page, status: statusFilter, search: debouncedSearch, date: dateFilter, funcionarioId: funcionarioFilter, unidadeId: selectedUnitId }],
        queryFn: () => getMyAgendamentos(page, PAGE_SIZE, statusFilter || undefined, selectedUnitId ?? undefined, debouncedSearch || undefined, dateFilter || undefined, funcionarioFilter ? Number(funcionarioFilter) : undefined),
    });
    const { data: funcionarios } = useQuery({
        queryKey: ['funcionarios-filter'],
        queryFn: () => getFuncionarios(selectedUnitId ?? undefined),
    });
    const { data: servicos } = useQuery({
        queryKey: ['servicos-filter'],
        queryFn: () => getServicos(selectedUnitId ?? undefined),
    });
    const appointments = data?.items || (Array.isArray(data) ? data : []);
    const total = data?.total || appointments.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    // Mutations
    const updateStatus = useMutation({
        mutationFn: ({ id, status }) => updateAgendamentoStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
            if (detailModal)
                setDetailModal(null);
        },
    });
    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }) => cancelAgendamento(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
            setCancelModal(null);
            setCancelReason('');
        },
    });
    const reassignMutation = useMutation({
        mutationFn: ({ id, funcionarioId }) => reassignAgendamento(id, funcionarioId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
            setReassignModal(null);
        },
    });
    const createMutation = useMutation({
        mutationFn: createAgendamento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
            setCreateModal(false);
            setCreateForm({ clientName: '', clientPhone: '', servicoId: '', funcionarioId: '', scheduledAt: '', notes: '' });
        },
    });
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['client-history', historyModal?.clientId],
        queryFn: () => getClientHistory(historyModal.clientId, selectedUnitId ?? undefined),
        enabled: !!historyModal?.clientId,
    });
    const handleCreate = () => {
        if (!createForm.clientName || !createForm.servicoId || !createForm.funcionarioId || !createForm.scheduledAt)
            return;
        createMutation.mutate({
            unidadeId: selectedUnitId,
            ...createForm,
            servicoId: Number(createForm.servicoId),
            funcionarioId: Number(createForm.funcionarioId),
        });
    };
    const whatsappLink = (phone) => {
        if (!phone)
            return '';
        const num = phone.replace(/\D/g, '');
        return `https://wa.me/55${num}`;
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Agendamentos" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] }), children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-1" }), " Atualizar"] }), _jsxs(Button, { size: "sm", onClick: () => setCreateModal(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Novo Agendamento"] })] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar por cliente...", value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" })] }), _jsx("input", { type: "date", value: dateFilter, onChange: (e) => { setDateFilter(e.target.value); setPage(1); }, className: "px-3 py-2 border border-gray-300 rounded-lg text-sm" }), _jsxs("select", { value: funcionarioFilter, onChange: (e) => { setFuncionarioFilter(e.target.value); setPage(1); }, className: "px-3 py-2 border border-gray-300 rounded-lg text-sm", children: [_jsx("option", { value: "", children: "Todos os profissionais" }), (Array.isArray(funcionarios) ? funcionarios : []).map((f) => (_jsx("option", { value: f.id, children: f.name || f.specialty || `#${f.id}` }, f.id)))] }), _jsx("select", { value: statusFilter, onChange: (e) => { setStatusFilter(e.target.value); setPage(1); }, className: "px-3 py-2 border border-gray-300 rounded-lg text-sm", children: statusOptions.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "py-0", children: [isLoading ? (_jsx("div", { className: "py-12 text-center text-gray-400 animate-pulse", children: "Carregando agendamentos..." })) : appointments.length === 0 ? (_jsxs("div", { className: "py-12 text-center text-gray-500", children: [_jsx(Calendar, { className: "w-12 h-12 mx-auto mb-3 text-gray-300" }), _jsx("p", { children: "Nenhum agendamento encontrado" })] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: appointments.map((ag) => {
                                const badge = getStatusBadge(ag.statusName || ag.status?.toString() || '');
                                return (_jsx("div", { className: "p-4 hover:bg-gray-50 transition", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1 flex-wrap", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: ag.clientName || 'Cliente' }), _jsx(Badge, { variant: badge.variant, children: badge.label })] }), _jsxs("div", { className: "flex flex-wrap gap-3 text-sm text-gray-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), ag.scheduledAt ? format(new Date(ag.scheduledAt), 'dd/MM/yyyy') : '—'] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3.5 h-3.5" }), ag.scheduledAt ? format(new Date(ag.scheduledAt), 'HH:mm') : '—'] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { className: "w-3.5 h-3.5" }), ag.servicoName || 'Serviço'] }), ag.funcionarioName && (_jsxs("span", { className: "flex items-center gap-1", children: ["Profissional: ", ag.funcionarioName] }))] })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDetailModal(ag), children: _jsx(Eye, { className: "w-4 h-4" }) }), ag.clientPhone && (_jsx("a", { href: whatsappLink(ag.clientPhone), target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(MessageCircle, { className: "w-4 h-4" }) }) })), (ag.status === 1 || ag.statusName === 'Pendente') && (_jsx(Button, { size: "sm", onClick: () => updateStatus.mutate({ id: ag.id, status: 'Confirmado' }), children: "Confirmar" })), (ag.status === 2 || ag.statusName === 'Confirmado') && (_jsx(Button, { size: "sm", onClick: () => updateStatus.mutate({ id: ag.id, status: 'EmExecucao' }), children: "Iniciar" })), (ag.status === 7 || ag.statusName === 'EmExecucao') && (_jsx(Button, { size: "sm", onClick: () => updateStatus.mutate({ id: ag.id, status: 'Pronto' }), children: "Pronto" })), (ag.status === 8 || ag.statusName === 'Pronto') && (_jsx(Button, { size: "sm", onClick: () => updateStatus.mutate({ id: ag.id, status: 'Finalizado' }), children: "Finalizar" })), ag.status !== 3 && ag.statusName !== 'Cancelado' && ag.status !== 4 && ag.statusName !== 'Finalizado' && (_jsx(Button, { variant: "danger", size: "sm", onClick: () => setCancelModal(ag), children: "Cancelar" }))] })] }) }, ag.id));
                            }) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-gray-100", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["P\u00E1gina ", page, " de ", totalPages, " (", total, " agendamentos)"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: page === 1, onClick: () => setPage(p => p - 1), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", disabled: page >= totalPages, onClick: () => setPage(p => p + 1), children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }))] }) }), _jsx(Modal, { open: !!detailModal, onClose: () => setDetailModal(null), title: "Detalhes do Agendamento", size: "lg", children: detailModal && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Cliente:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.clientName || '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Telefone:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.clientPhone || '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Servi\u00E7o:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.servicoName || '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Profissional:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.funcionarioName || '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Data:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.scheduledAt ? format(new Date(detailModal.scheduledAt), 'dd/MM/yyyy HH:mm') : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Valor:" }), " ", _jsxs("span", { className: "font-medium", children: ["R$ ", (detailModal.totalPrice || 0).toFixed(2)] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Ve\u00EDculo:" }), " ", _jsx("span", { className: "font-medium", children: detailModal.veiculoInfo || '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Status:" }), " ", _jsx(Badge, { variant: getStatusBadge(detailModal.statusName || '').variant, children: getStatusBadge(detailModal.statusName || '').label })] })] }), detailModal.notes && (_jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Observa\u00E7\u00F5es:" }), " ", _jsx("p", { className: "mt-1 text-gray-700", children: detailModal.notes })] })), _jsxs("div", { className: "flex gap-2 pt-4 border-t border-gray-100", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => { setDetailModal(null); setHistoryModal({ clientId: detailModal.clientId }); }, children: [_jsx(History, { className: "w-4 h-4 mr-1" }), " Hist\u00F3rico do Cliente"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => { setDetailModal(null); setReassignModal(detailModal); }, children: [_jsx(User, { className: "w-4 h-4 mr-1" }), " Reatribuir Profissional"] })] })] })) }), _jsx(Modal, { open: createModal, onClose: () => setCreateModal(false), title: "Novo Agendamento", size: "lg", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Nome do Cliente", value: createForm.clientName, onChange: (e) => setCreateForm(f => ({ ...f, clientName: e.target.value })) }), _jsx(Input, { label: "Telefone", value: createForm.clientPhone, onChange: (e) => setCreateForm(f => ({ ...f, clientPhone: e.target.value })), placeholder: "(00) 00000-0000" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Servi\u00E7o" }), _jsxs("select", { value: createForm.servicoId, onChange: (e) => setCreateForm(f => ({ ...f, servicoId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", children: [_jsx("option", { value: "", children: "Selecione..." }), (Array.isArray(servicos) ? servicos : []).map((s) => (_jsxs("option", { value: s.id, children: [s.name, " - R$ ", s.price?.toFixed(2)] }, s.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Profissional" }), _jsxs("select", { value: createForm.funcionarioId, onChange: (e) => setCreateForm(f => ({ ...f, funcionarioId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", children: [_jsx("option", { value: "", children: "Selecione..." }), (Array.isArray(funcionarios) ? funcionarios : []).map((f) => (_jsx("option", { value: f.id, children: f.name || f.specialty || `#${f.id}` }, f.id)))] })] })] }), _jsx(Input, { label: "Data e Hora", type: "datetime-local", value: createForm.scheduledAt, onChange: (e) => setCreateForm(f => ({ ...f, scheduledAt: e.target.value })) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { value: createForm.notes, onChange: (e) => setCreateForm(f => ({ ...f, notes: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", rows: 3 })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx(Button, { variant: "outline", onClick: () => setCreateModal(false), children: "Cancelar" }), _jsx(Button, { onClick: handleCreate, loading: createMutation.isPending, children: "Criar Agendamento" })] })] }) }), _jsx(Modal, { open: !!cancelModal, onClose: () => { setCancelModal(null); setCancelReason(''); }, title: "Cancelar Agendamento", children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Tem certeza que deseja cancelar este agendamento?" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Motivo do cancelamento" }), _jsx("textarea", { value: cancelReason, onChange: (e) => setCancelReason(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none", rows: 3, placeholder: "Informe o motivo..." })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => { setCancelModal(null); setCancelReason(''); }, children: "Voltar" }), _jsx(Button, { variant: "danger", onClick: () => cancelMutation.mutate({ id: cancelModal?.id, reason: cancelReason }), loading: cancelMutation.isPending, children: "Confirmar Cancelamento" })] })] }) }), _jsx(Modal, { open: !!reassignModal, onClose: () => setReassignModal(null), title: "Reatribuir Profissional", children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Selecione o novo profissional para este agendamento:" }), _jsx("div", { className: "space-y-2", children: (Array.isArray(funcionarios) ? funcionarios : []).map((f) => (_jsxs("button", { onClick: () => reassignMutation.mutate({ id: reassignModal?.id, funcionarioId: f.id }), className: "w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition", children: [_jsx("p", { className: "font-medium text-gray-900", children: f.name || `Profissional #${f.id}` }), _jsx("p", { className: "text-sm text-gray-500", children: f.specialty || 'Sem especialidade' })] }, f.id))) })] }) }), _jsx(Modal, { open: !!historyModal, onClose: () => setHistoryModal(null), title: "Hist\u00F3rico do Cliente", size: "lg", children: loadingHistory ? (_jsx("div", { className: "py-8 text-center text-gray-400 animate-pulse", children: "Carregando hist\u00F3rico..." })) : historyData ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-3 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: historyData.totalAppointments || 0 }), _jsx("p", { className: "text-xs text-gray-500", children: "Agendamentos" })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-3 text-center", children: [_jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["R$ ", (historyData.totalSpent || 0).toFixed(2)] }), _jsx("p", { className: "text-xs text-gray-500", children: "Total gasto" })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-3 text-center", children: [_jsx("p", { className: "text-sm font-bold text-gray-900", children: historyData.lastVisit ? format(new Date(historyData.lastVisit), 'dd/MM/yyyy') : '—' }), _jsx("p", { className: "text-xs text-gray-500", children: "\u00DAltima visita" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Agendamentos anteriores" }), (historyData.appointments || []).slice(0, 10).map((apt) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: apt.servicoName || 'Serviço' }), _jsx("p", { className: "text-gray-500", children: apt.scheduledAt ? format(new Date(apt.scheduledAt), 'dd/MM/yyyy HH:mm') : '—' })] }), _jsx(Badge, { variant: getStatusBadge(apt.statusName || '').variant, children: getStatusBadge(apt.statusName || '').label })] }, apt.id)))] })] })) : (_jsx("p", { className: "text-gray-500 text-center py-4", children: "Nenhum hist\u00F3rico encontrado" })) })] }));
}
