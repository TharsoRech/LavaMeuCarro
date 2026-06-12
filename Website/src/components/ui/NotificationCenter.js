import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export const NotificationCenter = () => {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const recentNotifications = notifications.slice(0, 10);
    return (_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setOpen(!open), className: "relative p-2 rounded-lg hover:bg-gray-100 text-gray-600", children: [_jsx(Bell, { className: "w-5 h-5" }), unreadCount > 0 && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white", children: unreadCount > 9 ? '9+' : unreadCount }))] }), open && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-gray-100 flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900", children: "Notifica\u00E7\u00F5es" }), unreadCount > 0 && (_jsx("button", { onClick: () => markAllAsRead(), className: "text-xs text-blue-600 hover:text-blue-700 font-medium", children: "Marcar todas como lidas" }))] }), _jsx("div", { className: "overflow-y-auto max-h-72", children: recentNotifications.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-gray-500", children: "Nenhuma notifica\u00E7\u00E3o" })) : (recentNotifications.map((n) => (_jsxs("button", { onClick: () => {
                                markAsRead(n.id);
                                if (n.appointmentId) {
                                    window.location.href = `/admin/agendamentos?highlight=${n.appointmentId}`;
                                }
                            }, className: `w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`, children: [_jsx("p", { className: `text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`, children: n.title }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2", children: n.message }), _jsx("p", { className: "text-[10px] text-gray-400 mt-1", children: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR }) })] }, n.id)))) }), notifications.length > 0 && (_jsx("div", { className: "px-4 py-2 border-t border-gray-100", children: _jsx("a", { href: "/admin/notificacoes", className: "text-xs text-blue-600 hover:text-blue-700 font-medium", children: "Ver todas as notifica\u00E7\u00F5es" }) }))] }))] }));
};
