import { useState } from 'react';
import { Bell, Check, Loader2, Calendar, X, UserRound, MapPin, MessageCircle, History } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useResolvableAppointmentNotificationIds } from '../../hooks/useResolvableAppointmentNotificationIds';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { appointmentsApi, salonsApi } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
import type { AppointmentDto, ClientAppointmentHistoryResponse, NotificationDto } from '../../types';
import { getStatusBadge } from '../../components/ui/Badge';

// Wrapper component for getStatusBadge
const StatusBadge = ({ status }: { status: any }) => {
  const badge = getStatusBadge(status);
  return <span className={`badge badge-${badge.variant}`}>{badge.label}</span>;
};
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const PENDING_APPOINTMENT_DETAIL_KEY = 'admin_open_appointment_detail_id';

const getNotificationIcon = (type: string | number) => {
  const typeStr = String(type).toLowerCase();
  if (typeStr.includes('confirm')) return '✓';
  if (typeStr.includes('cancel') || typeStr.includes('alert')) return '!';
  if (typeStr.includes('reminder')) return '⏰';
  if (typeStr.includes('review')) return '⭐';
  if (typeStr.includes('promo')) return '🎉';
  return 'ℹ';
};

const getNotificationColor = (type: string | number) => {
  const typeStr = String(type).toLowerCase();
  if (typeStr.includes('confirm')) return 'text-green-600 bg-green-50';
  if (typeStr.includes('cancel') || typeStr.includes('alert')) return 'text-red-600 bg-red-50';
  if (typeStr.includes('reminder')) return 'text-blue-600 bg-blue-50';
  if (typeStr.includes('review')) return 'text-yellow-600 bg-yellow-50';
  if (typeStr.includes('promo')) return 'text-purple-600 bg-purple-50';
  return 'text-gray-600 bg-gray-50';
};

const getNotificationLabel = (type: string | number) => {
  const typeStr = String(type).toLowerCase();
  if (typeStr.includes('confirm')) return 'Confirmação';
  if (typeStr.includes('cancel')) return 'Cancelamento';
  if (typeStr.includes('alert')) return 'Alerta';
  if (typeStr.includes('reminder')) return 'Lembrete';
  if (typeStr.includes('review')) return 'Avaliação';
  if (typeStr.includes('promo')) return 'Promoção';
  return 'Sistema';
};

type FilterType = 'all' | 'unread';

export function AdminNotifications() {
  const { user } = useAdminAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error, refetch } =
    useNotifications();
  const navigate = useNavigate();

  const { data: salons } = useQuery({
    queryKey: ['my-units-notifications'],
    queryFn: () => salonsApi.myUnits(),
  });
  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  const [detailApt, setDetailApt] = useState<AppointmentDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
  const [clientHistoryLoading, setClientHistoryLoading] = useState(false);
  const [clientHistoryError, setClientHistoryError] = useState('');
  const [clientHistory, setClientHistory] = useState<ClientAppointmentHistoryResponse | null>(null);
  const { canOpenAppointmentDetails } = useResolvableAppointmentNotificationIds(notifications);

  const handleOpenDetails = async (notification: NotificationDto) => {
    if (!notification.referenceId) return;
    setDetailError('');
    setDetailLoading(true);
    setDetailApt(null);
    try {
      const res = await appointmentsApi.getById(notification.referenceId);
      // API wrapper already returns .data
      setDetailApt(res?.data ?? res);
    } catch (err: any) {
      console.error('Error loading appointment details:', err);
      if (err?.response?.status === 404) {
        setDetailError('Este agendamento não existe mais ou foi removido.');
      } else {
        setDetailError('Não foi possível carregar os detalhes do agendamento.');
      }
    } finally {
      setDetailLoading(false);
    }
    if (!notification.read) markAsRead(notification.id);
  };

  const openAppointmentWithActions = (appointmentId: number) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PENDING_APPOINTMENT_DETAIL_KEY, String(appointmentId));
    }
    navigate('/admin/agendamentos');
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const handleMarkAsRead = (id: number) => {
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
    if (!detailApt) return;
    setClientHistoryOpen(true);
    setClientHistoryError('');
    setClientHistoryLoading(true);
    try {
      const res = await appointmentsApi.clientHistory(detailApt.id);
      setClientHistory(res.data);
    } catch {
      setClientHistoryError('Não foi possível carregar o histórico do cliente.');
    } finally {
      setClientHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 's' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>

        {salons && salons.length > 0 && (
          <select
            value={activeSalonId ?? ''}
            onChange={(event) => handleSalonChange(Number(event.target.value))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"
          >
            {salons.map((salon: any) => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <ApiErrorAlert
          message="Falha ao carregar notificações"
          onRetry={() => refetch()}
        />
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500">Carregando notificações...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filter === 'unread'
              ? 'Nenhuma notificação não lida'
              : 'Nenhuma notificação encontrada'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow ${
                !notification.read
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${getNotificationColor(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {getNotificationLabel(notification.type)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {/* Botão Detalhes para notificações de agendamento */}
                    {canOpenAppointmentDetails(notification) && (
                      <button
                        onClick={() => handleOpenDetails(notification)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Ver detalhes do agendamento
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {!notification.read && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="text-xs text-blue-600 font-medium">
                          Não lida
                        </span>
                      </div>
                    )}

                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes do Agendamento */}
      {(detailLoading || detailApt || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseDetailModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Detalhes do Agendamento</h2>
              <button onClick={handleCloseDetailModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {detailLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
                  <span className="text-gray-500 text-sm">Carregando...</span>
                </div>
              )}
              {detailError && (
                <p className="text-red-600 text-sm">{detailError}</p>
              )}
               {detailApt && !detailLoading && (
                 <div className="space-y-4 text-sm">
                   {/* Cliente */}
                   <div className="flex gap-4 items-start bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                     <div className="w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                       {detailApt.clientImage ? (
                         <img
                           src={detailApt.clientImage.startsWith('data:') ? detailApt.clientImage : `data:image/jpeg;base64,${detailApt.clientImage}`}
                           alt={detailApt.clientName}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <UserRound className="w-7 h-7 text-indigo-400" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-slate-900">{detailApt.clientName}</p>
                       {detailApt.clientPhone && <p className="text-xs text-slate-600 mt-0.5">📞 {detailApt.clientPhone}</p>}
                       <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                         <MapPin className="w-3 h-3" />
                         {detailApt.clientCity || 'Localização não informada'}
                       </p>
                       <div className="flex gap-4 mt-3">
                         <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Total finalizados</p>
                           <p className="font-bold text-indigo-700 text-lg leading-tight">{detailApt.clientTotalAppointments ?? 0}</p>
                         </div>
                         <div className="w-px bg-indigo-200" />
                         <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Finalizados nesta unidade</p>
                           <p className="font-bold text-indigo-700 text-lg leading-tight">{detailApt.clientSalonAppointments ?? 0}</p>
                         </div>
                       </div>
                       <div className="flex gap-4 mt-3">
                         <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Não compareceu (total)</p>
                           <p className="font-bold text-slate-700 text-lg leading-tight">{detailApt.clientNoShowTotalAppointments ?? 0}</p>
                         </div>
                         <div className="w-px bg-slate-200" />
                         <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Não compareceu neste salão</p>
                           <p className="font-bold text-slate-700 text-lg leading-tight">{detailApt.clientNoShowSalonAppointments ?? 0}</p>
                         </div>
                       </div>
                       <button
                         type="button"
                         onClick={handleOpenClientHistory}
                         className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                       >
                         <History className="w-3.5 h-3.5" />
                         Ver histórico detalhado
                       </button>
                     </div>
                   </div>
                  {/* Detalhes */}
                  <div className="space-y-2">
                    <DetailRow label="Serviço" value={detailApt.serviceName} />
                    <DetailRow label="Profissional" value={detailApt.professionalName} />
                    <DetailRow label="Unidade" value={detailApt.salonName} />
                    <DetailRow label="Data/Hora" value={format(new Date(detailApt.scheduledAt || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
                    <DetailRow label="Duração" value={`${detailApt.durationMinutes} min`} />
                    <DetailRow label="Valor" value={detailApt.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500 font-medium">Status</span>
                      <StatusBadge status={detailApt.status} />
                    </div>
                    {detailApt.notes && <DetailRow label="Observações" value={detailApt.notes} />}
                    {detailApt.cancellationReason && <DetailRow label="Motivo do cancelamento" value={detailApt.cancellationReason} />}
                    {detailApt.salonWhatsApp && (
                      <div className="pt-2">
                        <a
                          href={`https://wa.me/55${detailApt.salonWhatsApp.replace(/\D/g, '')}?text=Olá, gostaria de falar sobre o agendamento de ${detailApt.clientName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Contatar via WhatsApp
                        </a>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => openAppointmentWithActions(detailApt.id)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      Abrir no painel de agendamentos com ações
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {clientHistoryOpen && detailApt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setClientHistoryOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Histórico — {detailApt.clientName}</h3>
              <button onClick={() => setClientHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">
              {clientHistoryLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando histórico...
                </div>
              )}
              {clientHistoryError && <p className="text-red-600 text-sm">{clientHistoryError}</p>}
              {!clientHistoryLoading && !clientHistoryError && clientHistory?.atThisSalon?.length === 0 && (
                <p className="text-gray-500">Nenhum registro encontrado nesta unidade.</p>
              )}
              {!clientHistoryLoading && !clientHistoryError && (clientHistory?.atThisSalon ?? []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      {format(new Date(row.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-slate-600 mt-1">{row.serviceName} · {row.professionalName}</p>
                  <p className="text-slate-500 mt-0.5">
                    {row.durationMinutes}
                    {' min · '}
                    {row.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {row.cancellationReason && (
                    <p className="text-rose-600 mt-1 text-[11px]">Cancelamento: {row.cancellationReason}</p>
                  )}
                  {row.notes && <p className="text-slate-500 mt-1 text-[11px]">Obs.: {row.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-gray-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value || '—'}</span>
    </div>
  );
}
