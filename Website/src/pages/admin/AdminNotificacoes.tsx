import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'unread';

export default function AdminNotificacoes() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Não lidas
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="w-4 h-4 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="py-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition ${
                    !n.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.appointmentId) {
                      window.location.href = `/admin/agendamentos?highlight=${n.appointmentId}`;
                    }
                  }}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.read && <Badge variant="info">Nova</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded flex-shrink-0"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
