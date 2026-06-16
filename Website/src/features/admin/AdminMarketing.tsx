import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Megaphone, Search, Send, Users, CheckCircle2, AlertCircle, Loader2, Sparkles, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { salonsApi, notificationsApi } from '../../api';
import type { SalonClientForBroadcastDto, BroadcastPushResult } from '../../types';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { Button } from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/apiError';

export function AdminMarketing() {
  const { user } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [onlyWithPushToken, setOnlyWithPushToken] = useState(true);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastResult, setLastResult] = useState<BroadcastPushResult | null>(null);

  const { data: salons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits(),
  });
  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Limpa selecao quando troca de unidade.
  useEffect(() => {
    setSelectedClientIds(new Set());
    setLastResult(null);
    setFeedback(null);
  }, [activeSalonId]);

  const { data: clients, isLoading, isFetching, isError, error, refetch } = useQuery<SalonClientForBroadcastDto[]>({
    queryKey: ['marketing-clients', activeSalonId, debouncedTerm, onlyWithPushToken],
    queryFn: () =>
      notificationsApi.getBroadcastClients({
        salonId: activeSalonId as number,
        search: debouncedTerm || undefined,
        onlyWithPushToken,
      }),
    enabled: !!activeSalonId,
    placeholderData: (prev) => prev,
  });

  const eligibleClients = useMemo(() => clients ?? [], [clients]);

  const allSelected =
    eligibleClients.length > 0 && eligibleClients.every((c) => selectedClientIds.has(c.clientId));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(eligibleClients.map((c) => c.clientId)));
    }
  };

  const toggleClient = (clientId: number) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const broadcastMutation = useMutation({
    mutationFn: () =>
      notificationsApi
        .broadcast({
          salonId: activeSalonId as number,
          title: title.trim(),
          message: message.trim(),
          clientIds: Array.from(selectedClientIds),
        })
        ,
    onSuccess: (result) => {
      setLastResult(result);
      setFeedback({
        type: 'success',
        text: `Push enviado para ${result.pushedClientCount} de ${result.eligibleClientCount} cliente(s) elegíveis. ${result.notificationsCreated} notificação(ões) criada(s).`,
      });
      setTitle('');
      setMessage('');
      setSelectedClientIds(new Set());
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(err) });
    },
  });

  const canSubmit =
    !!activeSalonId &&
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    selectedClientIds.size > 0 &&
    !broadcastMutation.isPending;

  if (!hasUnits) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Nenhuma unidade encontrada</h2>
        <p className="text-gray-500 text-sm mt-1">
          Você precisa cadastrar uma unidade antes de usar o marketing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Envie notificações push em massa para clientes que já agendaram nesta unidade.
        </p>
      </div>

      {/* Seletor de unidade */}
      {salons && salons.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
          <select
            value={activeSalonId ?? ''}
            onChange={(e) => handleSalonChange(Number(e.target.value))}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Composicao da mensagem */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          Conteúdo da notificação
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="Ex.: Promoção exclusiva esta semana!"
            maxLength={80}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/80</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 240))}
            placeholder="Escreva uma mensagem curta e atrativa para seus clientes..."
            rows={4}
            maxLength={240}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">{message.length}/240</p>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Users className="w-4 h-4 text-brand-600" />
            Clientes da unidade
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyWithPushToken}
              onChange={(e) => setOnlyWithPushToken(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Apenas clientes com app instalado (push ativo)
          </label>
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={eligibleClients.length === 0}
            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allSelected ? 'Limpar seleção' : 'Selecionar todos'}
          </button>
        </div>

        {isError && (
          <div className="p-4">
            <ApiErrorAlert
              message={getApiErrorMessage(error) || 'Falha ao carregar clientes.'}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {isLoading && !clients && (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500 text-sm">Carregando clientes...</p>
          </div>
        )}

        {!isLoading && eligibleClients.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {onlyWithPushToken
                ? 'Nenhum cliente com app instalado foi encontrado.'
                : 'Nenhum cliente encontrado para esta unidade.'}
            </p>
          </div>
        )}

        {eligibleClients.length > 0 && (
          <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
            {eligibleClients.map((c) => {
              const checked = selectedClientIds.has(c.clientId);
              return (
                <label
                  key={c.clientId}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                    checked ? 'bg-brand-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleClient(c.clientId)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">{c.name}</span>
                      {c.hasActivePushToken && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Push ativo
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {c.appointmentsCount} agend.
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {c.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </span>
                      )}
                      {c.lastAppointmentAt && (
                        <span>
                          Último: {format(new Date(c.lastAppointmentAt), "dd 'de' MMM yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="p-4 border-t border-gray-100 text-sm text-gray-600">
          {selectedClientIds.size > 0
            ? `${selectedClientIds.size} cliente(s) selecionado(s)`
            : 'Selecione pelo menos um cliente para enviar.'}
        </div>
      </div>

      {/* Feedback + envio */}
      {feedback && (
        <div
          className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {lastResult && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Solicitados</p>
            <p className="text-xl font-bold text-gray-900">{lastResult.requestedClientCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Elegíveis</p>
            <p className="text-xl font-bold text-gray-900">{lastResult.eligibleClientCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Push enviados</p>
            <p className="text-xl font-bold text-green-700">{lastResult.pushedClientCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Notificações criadas</p>
            <p className="text-xl font-bold text-brand-700">{lastResult.notificationsCreated}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => broadcastMutation.mutate()}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2"
        >
          {broadcastMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Enviar push ({selectedClientIds.size})
        </Button>
      </div>
    </div>
  );
}
