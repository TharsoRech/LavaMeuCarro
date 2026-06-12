import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, XCircle } from 'lucide-react';
import { masterPlansApi, masterSubscriptionsApi, masterUsersApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SubscriptionDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { logTelemetry } from '../../utils/telemetry';

const statusLabels: Record<string, string> = {
  Active: 'Ativa',
  Cancelled: 'Cancelada',
  Expired: 'Expirada',
  Trial: 'Trial',
  PendingPayment: 'Aguardando Pgto',
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-900/50 text-green-300',
  Trial: 'bg-blue-900/50 text-blue-300',
  Cancelled: 'bg-red-900/50 text-red-300',
  Expired: 'bg-slate-700 text-slate-400',
  PendingPayment: 'bg-yellow-900/50 text-yellow-300',
};

export function MasterSubscriptions() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<SubscriptionDto | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualUserSearch, setManualUserSearch] = useState('');
  const [manualPlanId, setManualPlanId] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualFeedback, setManualFeedback] = useState('');
  const [manualFeedbackError, setManualFeedbackError] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [monitorTarget, setMonitorTarget] = useState<SubscriptionDto | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-subscriptions', page],
    queryFn: () => masterSubscriptionsApi.list(page, 20).then(r => r.data),
  });

  const { data: plans } = useQuery({
    queryKey: ['master-plans'],
    queryFn: () => masterPlansApi.list().then((r) => r.data),
  });

  const { data: usersResult, isFetching: isSearchingUsers } = useQuery({
    queryKey: ['master-users-lookup', manualUserSearch],
    queryFn: () => masterUsersApi.list(1, 20, manualUserSearch || undefined).then((r) => r.data),
    enabled: manualModalOpen,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => masterSubscriptionsApi.cancel(id, cancelReason.trim() || undefined),
    onSuccess: () => {
      logTelemetry('Master subscription cancelled manually.', {
        level: 'Warning',
        context: { subscriptionId: cancelTarget?.id, userId: cancelTarget?.userId, planId: cancelTarget?.planId },
      });
      qc.invalidateQueries({ queryKey: ['master-subscriptions'] });
      setCancelTarget(null);
      setCancelReason('');
      if (monitorTarget) {
        qc.invalidateQueries({ queryKey: ['master-subscription-monitor', monitorTarget.id] });
      }
    },
    onError: (error) => {
      logTelemetry('Master subscription cancel failed.', {
        level: 'Error',
        stack: (error as { stack?: string })?.stack,
        context: { subscriptionId: cancelTarget?.id, userId: cancelTarget?.userId, planId: cancelTarget?.planId },
      });
    },
  });

  const { data: monitorData, isFetching: isFetchingMonitor, isError: isMonitorError, error: monitorError, refetch: refetchMonitor } = useQuery({
    queryKey: ['master-subscription-monitor', monitorTarget?.id],
    queryFn: () => masterSubscriptionsApi.monitor(monitorTarget!.id).then((r) => r.data),
    enabled: !!monitorTarget,
  });

  const manualGrantMutation = useMutation({
    mutationFn: () => masterSubscriptionsApi.manualGrant({
      userId: Number(manualUserId),
      planId: Number(manualPlanId),
      reason: manualReason.trim(),
    }),
    onSuccess: (result) => {
      logTelemetry('Master manual subscription grant succeeded.', {
        level: 'Information',
        context: {
          targetUserId: Number(manualUserId),
          targetPlanId: Number(manualPlanId),
          auditPersisted: result.data.auditPersisted,
        },
      });
      qc.invalidateQueries({ queryKey: ['master-subscriptions'] });
      setManualFeedback(result.data.message || 'Licença atualizada manualmente.');
      setManualFeedbackError(false);
      setManualUserId('');
      setManualUserSearch('');
      setManualPlanId('');
      setManualReason('');
    },
    onError: (mutationError) => {
      logTelemetry('Master manual subscription grant failed.', {
        level: 'Error',
        stack: (mutationError as { stack?: string })?.stack,
        context: {
          targetUserId: Number(manualUserId),
          targetPlanId: Number(manualPlanId),
        },
      });
      setManualFeedback(getApiErrorMessage(mutationError, 'Falha ao conceder licença manualmente.'));
      setManualFeedbackError(true);
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
        <p className="text-slate-400 text-sm">Visualize e gerencie todas as assinaturas da plataforma.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setManualModalOpen(true)} size="sm" className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Conceder Licença Manual
        </Button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isError && (
          <div className="p-4 border-b border-slate-700">
            <ApiErrorAlert
              dark
              message={getApiErrorMessage(error, 'Falha ao carregar assinaturas.')}
              onRetry={() => refetch()}
            />
          </div>
        )}
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Carregando...</div>
        ) : !data?.items?.length ? (
          <div className="p-10 text-center text-slate-500">Nenhuma assinatura encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 uppercase text-xs border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left">Usuário</th>
                  <th className="px-5 py-3 text-left">Plano</th>
                  <th className="px-5 py-3 text-left">Início</th>
                  <th className="px-5 py-3 text-left">Vencimento</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.items.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-700/50">
                    <td className="px-5 py-4 text-white">{sub.userName || `User #${sub.userId}`}</td>
                    <td className="px-5 py-4 text-slate-300">{sub.planName || `Plano #${sub.planId}`}</td>
                    <td className="px-5 py-4 text-slate-300">{format(new Date(sub.startDate), 'dd/MM/yyyy', { locale: ptBR })}</td>
                    <td className="px-5 py-4 text-slate-300">{sub.endDate ? format(new Date(sub.endDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sub.status] || 'bg-slate-700 text-slate-400'}`}>
                        {statusLabels[sub.status] || sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setMonitorTarget(sub)}
                          className="text-slate-500 hover:text-blue-400 transition-colors mr-3"
                          title="Acompanhar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(sub.status === 'Active' || sub.status === 'Trial') && (
                          <button onClick={() => setCancelTarget(sub)} className="text-slate-500 hover:text-red-400 transition-colors" title="Cancelar assinatura">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Total: {data?.total ?? 0} assinaturas</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Próximo</button>
          </div>
        </div>
      )}

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancelar Assinatura"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Voltar</Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}>
              Confirmar Cancelamento
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Cancelar a assinatura do plano <strong>{cancelTarget?.planName}</strong> do usuário <strong>{cancelTarget?.userName}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Motivo do cancelamento</label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ex: solicitacao do usuario via suporte"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!monitorTarget}
        onClose={() => setMonitorTarget(null)}
        title="Monitoramento da Assinatura"
        footer={<Button variant="outline" onClick={() => setMonitorTarget(null)}>Fechar</Button>}
      >
        {!monitorTarget ? null : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p><strong>Assinatura:</strong> #{monitorTarget.id}</p>
              <p><strong>Usuário:</strong> {monitorTarget.userName || `User #${monitorTarget.userId}`}</p>
              <p><strong>Plano:</strong> {monitorTarget.planName || `Plano #${monitorTarget.planId}`}</p>
            </div>

            {isMonitorError && (
              <ApiErrorAlert
                message={getApiErrorMessage(monitorError, 'Falha ao carregar monitoramento da assinatura.')}
                onRetry={() => refetchMonitor()}
              />
            )}

            {isFetchingMonitor && !monitorData ? (
              <p className="text-sm text-slate-500">Carregando monitoramento...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 px-3 py-2">
                    <p className="font-semibold text-gray-800">Checkout lock</p>
                    <p>Status: {monitorData?.checkoutLock?.status || '—'}</p>
                    <p>Ultimo evento: {monitorData?.checkoutLock?.lastEvent || '—'}</p>
                    <p>Atualizado: {formatDateTime(monitorData?.checkoutLock?.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 px-3 py-2">
                    <p className="font-semibold text-gray-800">Pagamento Asaas</p>
                    <p>Status: {monitorData?.latestPayment?.status || '—'}</p>
                    <p>Billing: {monitorData?.latestPayment?.billingType || '—'}</p>
                    <p>Webhook: {monitorData?.latestPayment?.lastWebhookEvent || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 px-3 py-2 sm:col-span-2">
                    <p className="font-semibold text-gray-800">Webhook recente</p>
                    <p>Evento: {monitorData?.latestWebhook?.eventType || '—'}</p>
                    <p>Processado: {monitorData?.latestWebhook?.wasProcessed ? 'sim' : 'nao'}</p>
                    <p>Recebido em: {formatDateTime(monitorData?.latestWebhook?.receivedAt)}</p>
                    {monitorData?.latestWebhook?.processingError && (
                      <p className="text-red-600">Erro: {monitorData.latestWebhook.processingError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Historico de cancelamentos</p>
                  {!monitorData?.cancellationAttempts?.length ? (
                    <p className="text-sm text-gray-500">Nenhuma tentativa registrada.</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Quando</th>
                            <th className="px-3 py-2 text-left">Origem</th>
                            <th className="px-3 py-2 text-left">Asaas</th>
                            <th className="px-3 py-2 text-left">Local</th>
                            <th className="px-3 py-2 text-left">Resultado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monitorData.cancellationAttempts.map((attempt) => (
                            <tr key={attempt.id} className="border-t border-gray-100">
                              <td className="px-3 py-2 align-top">{formatDateTime(attempt.createdAt)}</td>
                              <td className="px-3 py-2 align-top">{attempt.source}</td>
                              <td className="px-3 py-2 align-top">{attempt.gatewayCancelled === undefined ? '—' : attempt.gatewayCancelled ? 'ok' : 'falhou'}</td>
                              <td className="px-3 py-2 align-top">{attempt.localCancelled ? 'ok' : 'nao'}</td>
                              <td className="px-3 py-2 align-top">
                                {attempt.success ? 'sucesso' : 'falhou'}
                                {attempt.errorMessage ? <p className="text-red-600 mt-1">{attempt.errorMessage}</p> : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={manualModalOpen}
        onClose={() => {
          setManualModalOpen(false);
          setManualFeedback('');
          setManualFeedbackError(false);
          setManualUserSearch('');
        }}
        title="Conceder Licença Manual"
        footer={
          <>
            <Button variant="outline" onClick={() => setManualModalOpen(false)}>Fechar</Button>
            <Button
              loading={manualGrantMutation.isPending}
              onClick={() => manualGrantMutation.mutate()}
              disabled={!manualUserId || !manualPlanId || !manualReason.trim()}
            >
              Aplicar Licença
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {manualFeedback && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${manualFeedbackError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {manualFeedback}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Usuário *</label>
            <input
              type="text"
              value={manualUserSearch}
              onChange={(e) => setManualUserSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Buscar por nome ou e-mail"
            />
            <select
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Selecione um usuário</option>
              {(usersResult?.items ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} - {u.name} ({u.email})
                </option>
              ))}
            </select>
            {isSearchingUsers && <p className="text-xs text-gray-500">Buscando usuários...</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Plano *</label>
            <select
              value={manualPlanId}
              onChange={(e) => setManualPlanId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Selecione</option>
              {(plans ?? []).filter((p) => p.active).map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} ({plan.price === 0 ? 'Gratis' : `R$ ${plan.price.toFixed(2)}`})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Motivo *</label>
            <textarea
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ex: pagamento confirmado manualmente apos falha de webhook"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
