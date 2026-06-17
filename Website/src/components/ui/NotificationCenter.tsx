import { useState } from 'react';
import { Bell, X, Check, Calendar, Loader2, UserRound, MapPin, History } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useResolvableAppointmentNotificationIds } from '../../hooks/useResolvableAppointmentNotificationIds';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api';
import type { AppointmentDto, ClientAppointmentHistoryResponse, NotificationDto } from '../../types';
import { getStatusBadge as StatusBadge } from './Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const PENDING_APPOINTMENT_DETAIL_KEY = 'admin_open_appointment_detail_id';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [detailApt, setDetailApt] = useState<AppointmentDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
  const [clientHistoryLoading, setClientHistoryLoading] = useState(false);
  const [clientHistoryError, setClientHistoryError] = useState('');
  const [clientHistory, setClientHistory] = useState<ClientAppointmentHistoryResponse | null>(null);
  const { canOpenAppointmentDetails } = useResolvableAppointmentNotificationIds(notifications);

  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: NotificationDto) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.referenceId) {
      navigate(`/admin/agendamentos`);
    }
  };

  const handleOpenDetails = async (e: React.MouseEvent, notification: NotificationDto) => {
    e.stopPropagation();
    if (!notification.referenceId) return;
    setDetailError('');
    setDetailApt(null);
    setDetailLoading(true);
    setIsOpen(false);
    try {
      const apt = await appointmentsApi.getById(notification.referenceId);
      // API wrapper already returns .data, but check if it's wrapped again
      setDetailApt(apt?.data ?? apt);
    } catch (err: any) {
      console.error('Error loading appointment details:', err);
      setDetailError('Não foi possível carregar os detalhes do agendamento.');
    } finally {
      setDetailLoading(false);
    }
    if (!notification.read) markAsRead(notification.id);
  };

  const openAppointmentWithActions = (appointmentId: number) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PENDING_APPOINTMENT_DETAIL_KEY, String(appointmentId));
    }
    setIsOpen(false);
    setDetailApt(null);
    navigate('/admin/agendamentos');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-40 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
              <div className="flex items-center gap-1">
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="flex gap-3 flex-1 text-left"
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </button>
                    {/* Botão Detalhes para notificações de agendamento */}
                    {canOpenAppointmentDetails(notification) && (
                      <button
                        onClick={(e) => handleOpenDetails(e, notification)}
                        title="Ver detalhes do agendamento"
                        className="flex-shrink-0 self-center p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/notificacoes');
                  }}
                  className="w-full text-xs text-center py-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Loading spinner para detail */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-gray-600 text-sm">Carregando detalhes...</span>
          </div>
        </div>
      )}

      {/* Erro ao carregar agendamento */}
      {detailError && !detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailError('')} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-red-600 text-sm font-medium mb-4">{detailError}</p>
            <button
              onClick={() => setDetailError('')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Agendamento */}
      {detailApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseDetailModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Detalhes do Agendamento</h2>
              <button onClick={handleCloseDetailModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
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
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Finalizados neste salão</p>
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
                <NcDetailRow label="Serviço" value={detailApt.servicoName} />
                <NcDetailRow label="Profissional" value={detailApt.funcionarioName} />
                <NcDetailRow label="Unidade" value={detailApt.salonName} />
                <NcDetailRow label="Data/Hora" value={format(new Date(detailApt.scheduledAt!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
                <NcDetailRow label="Duração" value={`${detailApt.durationMinutes} min`} />
                <NcDetailRow label="Valor" value={detailApt.totalPrice!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Status</span>
                  {(() => { const badge = StatusBadge(String(detailApt.status)); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-100 text-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-800`}>{badge.label}</span>; })()}
                </div>
                {detailApt.notes && <NcDetailRow label="Observações" value={detailApt.notes} />}
                {detailApt.cancellationReason && <NcDetailRow label="Motivo cancelamento" value={detailApt.cancellationReason} />}
                <button
                  type="button"
                  onClick={() => openAppointmentWithActions(detailApt.id)}
                  className="mt-2 w-full rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  Abrir no painel de agendamentos com ações
                </button>
              </div>
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
                    {(() => { const badge = StatusBadge(String(row.status)); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-100 text-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-800`}>{badge.label}</span>; })()}
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

function NcDetailRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-gray-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value || '—'}</span>
    </div>
  );
}
