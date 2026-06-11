import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyAgendamentos, updateAgendamentoStatus, cancelAgendamento,
  reassignAgendamento, createAgendamento, getFuncionarios, getServicos,
  getVeiculos, getClientHistory,
} from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge, getStatusBadge } from '../../components/ui/Badge';
import {
  Calendar, Clock, Search, Plus, X, Eye, Phone, MessageCircle,
  User, ChevronLeft, ChevronRight, RefreshCw, History,
} from 'lucide-react';
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
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [funcionarioFilter, setFuncionarioFilter] = useState('');

  // Modals
  const [detailModal, setDetailModal] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reassignModal, setReassignModal] = useState<any>(null);
  const [historyModal, setHistoryModal] = useState<any>(null);

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
    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agendamentos', { page, status: statusFilter, search: debouncedSearch, date: dateFilter, funcionarioId: funcionarioFilter, unidadeId: selectedUnitId }],
    queryFn: () => getMyAgendamentos(
      page, PAGE_SIZE,
      statusFilter || undefined,
      selectedUnitId ?? undefined,
      debouncedSearch || undefined,
      dateFilter || undefined,
      funcionarioFilter ? Number(funcionarioFilter) : undefined,
    ),
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
    mutationFn: ({ id, status }: { id: number; status: string }) => updateAgendamentoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
      if (detailModal) setDetailModal(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => cancelAgendamento(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] });
      setCancelModal(null);
      setCancelReason('');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, funcionarioId }: { id: number; funcionarioId: number }) => reassignAgendamento(id, funcionarioId),
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
    if (!createForm.clientName || !createForm.servicoId || !createForm.funcionarioId || !createForm.scheduledAt) return;
    createMutation.mutate({
      unidadeId: selectedUnitId,
      ...createForm,
      servicoId: Number(createForm.servicoId),
      funcionarioId: Number(createForm.funcionarioId),
    });
  };

  const whatsappLink = (phone?: string) => {
    if (!phone) return '';
    const num = phone.replace(/\D/g, '');
    return `https://wa.me/55${num}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-agendamentos'] })}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={funcionarioFilter}
              onChange={(e) => { setFuncionarioFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todos os profissionais</option>
              {(Array.isArray(funcionarios) ? funcionarios : []).map((f: any) => (
                <option key={f.id} value={f.id}>{f.name || f.specialty || `#${f.id}`}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="py-0">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400 animate-pulse">Carregando agendamentos...</div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((ag: any) => {
                const badge = getStatusBadge(ag.statusName || ag.status?.toString() || '');
                return (
                  <div key={ag.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{ag.clientName || 'Cliente'}</h3>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {ag.scheduledAt ? format(new Date(ag.scheduledAt), 'dd/MM/yyyy') : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ag.scheduledAt ? format(new Date(ag.scheduledAt), 'HH:mm') : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {ag.servicoName || 'Serviço'}
                          </span>
                          {ag.funcionarioName && (
                            <span className="flex items-center gap-1">
                              Profissional: {ag.funcionarioName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => setDetailModal(ag)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {ag.clientPhone && (
                          <a href={whatsappLink(ag.clientPhone)} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {(ag.status === 1 || ag.statusName === 'Pendente') && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: ag.id, status: 'Confirmado' })}>
                            Confirmar
                          </Button>
                        )}
                        {(ag.status === 2 || ag.statusName === 'Confirmado') && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: ag.id, status: 'EmExecucao' })}>
                            Iniciar
                          </Button>
                        )}
                        {(ag.status === 7 || ag.statusName === 'EmExecucao') && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: ag.id, status: 'Pronto' })}>
                            Pronto
                          </Button>
                        )}
                        {(ag.status === 8 || ag.statusName === 'Pronto') && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: ag.id, status: 'Finalizado' })}>
                            Finalizar
                          </Button>
                        )}
                        {ag.status !== 3 && ag.statusName !== 'Cancelado' && ag.status !== 4 && ag.statusName !== 'Finalizado' && (
                          <Button variant="danger" size="sm" onClick={() => setCancelModal(ag)}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages} ({total} agendamentos)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Detalhes do Agendamento" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{detailModal.clientName || '—'}</span></div>
              <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{detailModal.clientPhone || '—'}</span></div>
              <div><span className="text-gray-500">Serviço:</span> <span className="font-medium">{detailModal.servicoName || '—'}</span></div>
              <div><span className="text-gray-500">Profissional:</span> <span className="font-medium">{detailModal.funcionarioName || '—'}</span></div>
              <div><span className="text-gray-500">Data:</span> <span className="font-medium">{detailModal.scheduledAt ? format(new Date(detailModal.scheduledAt), 'dd/MM/yyyy HH:mm') : '—'}</span></div>
              <div><span className="text-gray-500">Valor:</span> <span className="font-medium">R$ {(detailModal.totalPrice || 0).toFixed(2)}</span></div>
              <div><span className="text-gray-500">Veículo:</span> <span className="font-medium">{detailModal.veiculoInfo || '—'}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge variant={getStatusBadge(detailModal.statusName || '').variant}>{getStatusBadge(detailModal.statusName || '').label}</Badge></div>
            </div>
            {detailModal.notes && (
              <div className="text-sm"><span className="text-gray-500">Observações:</span> <p className="mt-1 text-gray-700">{detailModal.notes}</p></div>
            )}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => { setDetailModal(null); setHistoryModal({ clientId: detailModal.clientId }); }}>
                <History className="w-4 h-4 mr-1" /> Histórico do Cliente
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setDetailModal(null); setReassignModal(detailModal); }}>
                <User className="w-4 h-4 mr-1" /> Reatribuir Profissional
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Agendamento" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome do Cliente" value={createForm.clientName} onChange={(e) => setCreateForm(f => ({ ...f, clientName: e.target.value }))} />
            <Input label="Telefone" value={createForm.clientPhone} onChange={(e) => setCreateForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="(00) 00000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
              <select value={createForm.servicoId} onChange={(e) => setCreateForm(f => ({ ...f, servicoId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Selecione...</option>
                {(Array.isArray(servicos) ? servicos : []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} - R$ {s.price?.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
              <select value={createForm.funcionarioId} onChange={(e) => setCreateForm(f => ({ ...f, funcionarioId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Selecione...</option>
                {(Array.isArray(funcionarios) ? funcionarios : []).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name || f.specialty || `#${f.id}`}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Data e Hora" type="datetime-local" value={createForm.scheduledAt} onChange={(e) => setCreateForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>Criar Agendamento</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={!!cancelModal} onClose={() => { setCancelModal(null); setCancelReason(''); }} title="Cancelar Agendamento">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Tem certeza que deseja cancelar este agendamento?</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do cancelamento</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
              placeholder="Informe o motivo..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setCancelModal(null); setCancelReason(''); }}>Voltar</Button>
            <Button variant="danger" onClick={() => cancelMutation.mutate({ id: cancelModal?.id, reason: cancelReason })} loading={cancelMutation.isPending}>
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal open={!!reassignModal} onClose={() => setReassignModal(null)} title="Reatribuir Profissional">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Selecione o novo profissional para este agendamento:</p>
          <div className="space-y-2">
            {(Array.isArray(funcionarios) ? funcionarios : []).map((f: any) => (
              <button
                key={f.id}
                onClick={() => reassignMutation.mutate({ id: reassignModal?.id, funcionarioId: f.id })}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <p className="font-medium text-gray-900">{f.name || `Profissional #${f.id}`}</p>
                <p className="text-sm text-gray-500">{f.specialty || 'Sem especialidade'}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Client History Modal */}
      <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title="Histórico do Cliente" size="lg">
        {loadingHistory ? (
          <div className="py-8 text-center text-gray-400 animate-pulse">Carregando histórico...</div>
        ) : historyData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{historyData.totalAppointments || 0}</p>
                <p className="text-xs text-gray-500">Agendamentos</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">R$ {(historyData.totalSpent || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Total gasto</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-gray-900">
                  {historyData.lastVisit ? format(new Date(historyData.lastVisit), 'dd/MM/yyyy') : '—'}
                </p>
                <p className="text-xs text-gray-500">Última visita</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Agendamentos anteriores</h4>
              {(historyData.appointments || []).slice(0, 10).map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{apt.servicoName || 'Serviço'}</p>
                    <p className="text-gray-500">{apt.scheduledAt ? format(new Date(apt.scheduledAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
                  </div>
                  <Badge variant={getStatusBadge(apt.statusName || '').variant}>{getStatusBadge(apt.statusName || '').label}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhum histórico encontrado</p>
        )}
      </Modal>
    </div>
  );
}
