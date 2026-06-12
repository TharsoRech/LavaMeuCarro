import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bell, Check, Loader2, Calendar, X, UserRound, MapPin, MessageCircle, History } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useResolvableAppointmentNotificationIds } from '../../hooks/useResolvableAppointmentNotificationIds';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { appointmentsApi } from '../../api';
import { getStatusBadge } from '../../components/ui/Badge';
// Wrapper component for getStatusBadge
const StatusBadge = ({ status }) => {
    const badge = getStatusBadge(status);
    return _jsx("span", { className: `badge badge-${badge.variant}`, children: badge.label });
};
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
const PENDING_APPOINTMENT_DETAIL_KEY = 'admin_open_appointment_detail_id';
const getNotificationIcon = (type) => {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('confirm'))
        return '✓';
    if (typeStr.includes('cancel') || typeStr.includes('alert'))
        return '!';
    if (typeStr.includes('reminder'))
        return '⏰';
    if (typeStr.includes('review'))
        return '⭐';
    if (typeStr.includes('promo'))
        return '🎉';
    return 'ℹ';
};
const getNotificationColor = (type) => {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('confirm'))
        return 'text-green-600 bg-green-50';
    if (typeStr.includes('cancel') || typeStr.includes('alert'))
        return 'text-red-600 bg-red-50';
    if (typeStr.includes('reminder'))
        return 'text-blue-600 bg-blue-50';
    if (typeStr.includes('review'))
        return 'text-yellow-600 bg-yellow-50';
    if (typeStr.includes('promo'))
        return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
};
const getNotificationLabel = (type) => {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('confirm'))
        return 'Confirmação';
    if (typeStr.includes('cancel'))
        return 'Cancelamento';
    if (typeStr.includes('alert'))
        return 'Alerta';
    if (typeStr.includes('reminder'))
        return 'Lembrete';
    if (typeStr.includes('review'))
        return 'Avaliação';
    if (typeStr.includes('promo'))
        return 'Promoção';
    return 'Sistema';
};
export function AdminNotifications() {
    const [filter, setFilter] = useState('all');
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error, refetch } = useNotifications();
    const navigate = useNavigate();
    const [detailApt, setDetailApt] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
    const [clientHistoryLoading, setClientHistoryLoading] = useState(false);
    const [clientHistoryError, setClientHistoryError] = useState('');
    const [clientHistory, setClientHistory] = useState(null);
    const { canOpenAppointmentDetails } = useResolvableAppointmentNotificationIds(notifications);
    const handleOpenDetails = async (notification) => {
        if (!notification.referenceId)
            return;
        setDetailError('');
        setDetailLoading(true);
        setDetailApt(null);
        try {
            const res = await appointmentsApi.getById(notification.referenceId);
            setDetailApt(res.data);
        }
        catch {
            setDetailError('Não foi possível carregar os detalhes do agendamento.');
        }
        finally {
            setDetailLoading(false);
        }
        if (!notification.read)
            markAsRead(notification.id);
    };
    const openAppointmentWithActions = (appointmentId) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PENDING_APPOINTMENT_DETAIL_KEY, String(appointmentId));
        }
        navigate('/admin/agendamentos');
    };
    const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const handleMarkAsRead = (id) => {
        markAsRead(id);
    };
    const handleCloseDetailModal = () => {
        setDetailApt(null);
        setDetailError('');
        setClientHistoryOpen(false);
        setClientHistoryError('');
        setClientHistory(null);
    };
    const handleOpenClientHistory = async () => {
        if (!detailApt)
            return;
        setClientHistoryOpen(true);
        setClientHistoryError('');
        setClientHistoryLoading(true);
        try {
            const res = await appointmentsApi.clientHistory(detailApt.salonId, detailApt.clientId);
            setClientHistory(res.data);
        }
        catch {
            setClientHistoryError('Não foi possível carregar o histórico do cliente.');
        }
        finally {
            setClientHistoryLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Notifica\u00E7\u00F5es" }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: unreadCount > 0
                            ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 's' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                            : 'Todas as notificações foram lidas' })] }), error && (_jsx(ApiErrorAlert, { message: "Falha ao carregar notifica\u00E7\u00F5es", onRetry: () => refetch() })), _jsxs("div", { className: "bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: ["Todas (", notifications.length, ")"] }), _jsxs("button", { onClick: () => setFilter('unread'), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: ["N\u00E3o lidas (", unreadCount, ")"] })] }), unreadCount > 0 && (_jsxs("button", { onClick: () => markAllAsRead(), className: "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors", children: [_jsx(Check, { className: "w-4 h-4" }), "Marcar todas como lidas"] }))] }), isLoading && (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center", children: [_jsx(Loader2, { className: "w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" }), _jsx("p", { className: "text-gray-500", children: "Carregando notifica\u00E7\u00F5es..." })] })), !isLoading && filteredNotifications.length === 0 && (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: filter === 'unread'
                            ? 'Nenhuma notificação não lida'
                            : 'Nenhuma notificação encontrada' })] })), !isLoading && filteredNotifications.length > 0 && (_jsx("div", { className: "space-y-3", children: filteredNotifications.map((notification) => (_jsxs("div", { className: `bg-white rounded-lg border shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow ${!notification.read
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200'}`, children: [_jsx("div", { className: `flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${getNotificationColor(notification.type)}`, children: getNotificationIcon(notification.type) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: notification.title }), _jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700", children: getNotificationLabel(notification.type) })] }), _jsx("p", { className: "text-gray-600 text-sm mt-1", children: notification.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }) }), canOpenAppointmentDetails(notification) && (_jsxs("button", { onClick: () => handleOpenDetails(notification), className: "mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors", children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), "Ver detalhes do agendamento"] }))] }), _jsxs("div", { className: "flex-shrink-0 flex flex-col items-end gap-2", children: [!notification.read && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-blue-600 rounded-full" }), _jsx("span", { className: "text-xs text-blue-600 font-medium", children: "N\u00E3o lida" })] })), !notification.read && (_jsx("button", { onClick: () => handleMarkAsRead(notification.id), className: "text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors", children: "Marcar como lida" }))] })] }) })] }, notification.id))) })), (detailLoading || detailApt || detailError) && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/40", onClick: handleCloseDetailModal }), _jsxs("div", { className: "relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-gray-100", children: [_jsx("h2", { className: "font-semibold text-gray-900", children: "Detalhes do Agendamento" }), _jsx("button", { onClick: handleCloseDetailModal, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4", children: [detailLoading && (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx(Loader2, { className: "w-6 h-6 text-indigo-600 animate-spin mr-2" }), _jsx("span", { className: "text-gray-500 text-sm", children: "Carregando..." })] })), detailError && (_jsx("p", { className: "text-red-600 text-sm", children: detailError })), detailApt && !detailLoading && (_jsxs("div", { className: "space-y-4 text-sm", children: [_jsxs("div", { className: "flex gap-4 items-start bg-indigo-50 p-4 rounded-lg border border-indigo-200", children: [_jsx("div", { className: "w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden", children: detailApt.clientImage ? (_jsx("img", { src: detailApt.clientImage.startsWith('data:') ? detailApt.clientImage : `data:image/jpeg;base64,${detailApt.clientImage}`, alt: detailApt.clientName, className: "w-full h-full object-cover" })) : (_jsx(UserRound, { className: "w-7 h-7 text-indigo-400" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-slate-900", children: detailApt.clientName }), detailApt.clientPhone && _jsxs("p", { className: "text-xs text-slate-600 mt-0.5", children: ["\uD83D\uDCDE ", detailApt.clientPhone] }), _jsxs("p", { className: "text-xs text-slate-600 flex items-center gap-1 mt-0.5", children: [_jsx(MapPin, { className: "w-3 h-3" }), detailApt.clientCity || 'Localização não informada'] }), _jsxs("div", { className: "flex gap-4 mt-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "Total finalizados" }), _jsx("p", { className: "font-bold text-indigo-700 text-lg leading-tight", children: detailApt.clientTotalAppointments ?? 0 })] }), _jsx("div", { className: "w-px bg-indigo-200" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "Finalizados neste sal\u00E3o" }), _jsx("p", { className: "font-bold text-indigo-700 text-lg leading-tight", children: detailApt.clientSalonAppointments ?? 0 })] })] }), _jsxs("div", { className: "flex gap-4 mt-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "N\u00E3o compareceu (total)" }), _jsx("p", { className: "font-bold text-slate-700 text-lg leading-tight", children: detailApt.clientNoShowTotalAppointments ?? 0 })] }), _jsx("div", { className: "w-px bg-slate-200" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "N\u00E3o compareceu neste sal\u00E3o" }), _jsx("p", { className: "font-bold text-slate-700 text-lg leading-tight", children: detailApt.clientNoShowSalonAppointments ?? 0 })] })] }), _jsxs("button", { type: "button", onClick: handleOpenClientHistory, className: "mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors", children: [_jsx(History, { className: "w-3.5 h-3.5" }), "Ver hist\u00F3rico detalhado"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(DetailRow, { label: "Servi\u00E7o", value: detailApt.serviceName }), _jsx(DetailRow, { label: "Profissional", value: detailApt.professionalName }), _jsx(DetailRow, { label: "Unidade", value: detailApt.salonName }), _jsx(DetailRow, { label: "Data/Hora", value: format(new Date(detailApt.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) }), _jsx(DetailRow, { label: "Dura\u00E7\u00E3o", value: `${detailApt.durationMinutes} min` }), _jsx(DetailRow, { label: "Valor", value: detailApt.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }), _jsxs("div", { className: "flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0", children: [_jsx("span", { className: "text-gray-500 font-medium", children: "Status" }), _jsx(StatusBadge, { status: detailApt.status })] }), detailApt.notes && _jsx(DetailRow, { label: "Observa\u00E7\u00F5es", value: detailApt.notes }), detailApt.cancellationReason && _jsx(DetailRow, { label: "Motivo do cancelamento", value: detailApt.cancellationReason }), detailApt.salonWhatsApp && (_jsx("div", { className: "pt-2", children: _jsxs("a", { href: `https://wa.me/55${detailApt.salonWhatsApp.replace(/\D/g, '')}?text=Olá, gostaria de falar sobre o agendamento de ${detailApt.clientName}`, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors", children: [_jsx(MessageCircle, { className: "w-3.5 h-3.5" }), "Contatar via WhatsApp"] }) })), _jsx("button", { type: "button", onClick: () => openAppointmentWithActions(detailApt.id), className: "mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors", children: "Abrir no painel de agendamentos com a\u00E7\u00F5es" })] })] }))] })] })] })), clientHistoryOpen && detailApt && (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/40", onClick: () => setClientHistoryOpen(false) }), _jsxs("div", { className: "relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-gray-100", children: [_jsxs("h3", { className: "font-semibold text-gray-900", children: ["Hist\u00F3rico \u2014 ", detailApt.clientName] }), _jsx("button", { onClick: () => setClientHistoryOpen(false), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm", children: [clientHistoryLoading && (_jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Carregando hist\u00F3rico..."] })), clientHistoryError && _jsx("p", { className: "text-red-600 text-sm", children: clientHistoryError }), !clientHistoryLoading && !clientHistoryError && clientHistory?.atThisSalon?.length === 0 && (_jsx("p", { className: "text-gray-500", children: "Nenhum registro encontrado nesta unidade." })), !clientHistoryLoading && !clientHistoryError && (clientHistory?.atThisSalon ?? []).map((row) => (_jsxs("div", { className: "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "font-medium text-slate-900", children: format(new Date(row.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) }), _jsx(StatusBadge, { status: row.status })] }), _jsxs("p", { className: "text-slate-600 mt-1", children: [row.serviceName, " \u00B7 ", row.professionalName] }), _jsxs("p", { className: "text-slate-500 mt-0.5", children: [row.durationMinutes, ' min · ', row.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })] }), row.cancellationReason && (_jsxs("p", { className: "text-rose-600 mt-1 text-[11px]", children: ["Cancelamento: ", row.cancellationReason] })), row.notes && _jsxs("p", { className: "text-slate-500 mt-1 text-[11px]", children: ["Obs.: ", row.notes] })] }, row.id)))] })] })] }))] }));
}
function DetailRow({ label, value }) {
    return (_jsxs("div", { className: "flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0 gap-4", children: [_jsx("span", { className: "text-gray-500 font-medium flex-shrink-0", children: label }), _jsx("span", { className: "text-gray-900 text-right", children: value || '—' })] }));
}
