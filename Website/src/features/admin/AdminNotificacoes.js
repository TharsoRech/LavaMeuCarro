import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function AdminNotificacoes() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Notifica\u00E7\u00F5es" }), unreadCount > 0 && (_jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [unreadCount, " n\u00E3o lida", unreadCount > 1 ? 's' : ''] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex rounded-lg border border-gray-300 overflow-hidden", children: [_jsx("button", { onClick: () => setFilter('all'), className: `px-3 py-1.5 text-sm font-medium transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`, children: "Todas" }), _jsx("button", { onClick: () => setFilter('unread'), className: `px-3 py-1.5 text-sm font-medium transition ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`, children: "N\u00E3o lidas" })] }), unreadCount > 0 && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => markAllAsRead(), children: [_jsx(CheckCheck, { className: "w-4 h-4 mr-1" }), " Marcar todas como lidas"] }))] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "py-0", children: filtered.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação' })] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: filtered.map((n) => (_jsxs("div", { className: `p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/50' : ''}`, onClick: () => {
                                markAsRead(n.id);
                                if (n.appointmentId) {
                                    window.location.href = `/admin/agendamentos?highlight=${n.appointmentId}`;
                                }
                            }, children: [_jsx("div", { className: `w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: `text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`, children: n.title }), !n.read && _jsx(Badge, { variant: "info", children: "Nova" })] }), _jsx("p", { className: "text-sm text-gray-600 line-clamp-2", children: n.message }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR }) })] }), !n.read && (_jsx("button", { onClick: (e) => { e.stopPropagation(); markAsRead(n.id); }, className: "p-1 text-gray-400 hover:text-blue-600 rounded flex-shrink-0", title: "Marcar como lida", children: _jsx(Check, { className: "w-4 h-4" }) }))] }, n.id))) })) }) })] }));
}
