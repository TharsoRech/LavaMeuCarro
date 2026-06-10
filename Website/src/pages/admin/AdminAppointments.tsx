import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAgendamentos, updateAgendamentoStatus } from '../../api';
import { Calendar, Clock, MapPin, User, Phone, Search, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Confirmado: 'bg-blue-100 text-blue-800',
  EmExecucao: 'bg-purple-100 text-purple-800',
  Pronto: 'bg-green-100 text-green-800',
  Finalizado: 'bg-gray-100 text-gray-800',
  Cancelado: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  Pendente: 'Pendente',
  Confirmado: 'Confirmado',
  EmExecucao: 'Em Execução',
  Pronto: 'Pronto',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
};

export default function AdminAppointments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos', { status: statusFilter, page: 1 }],
    queryFn: () => getMyAgendamentos(1, 20, statusFilter || undefined),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAgendamentoStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['', 'Pendente', 'Confirmado', 'EmExecucao', 'Pronto', 'Finalizado'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? statusLabels[s] || s : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : !agendamentos?.length ? (
          <div className="p-8 text-center text-gray-400">Nenhum agendamento encontrado</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agendamentos.map((ag: any) => (
              <div key={ag.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{ag.clienteNome || 'Cliente'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ag.status] || 'bg-gray-100'}`}>
                        {statusLabels[ag.status] || ag.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ag.dataFormatada || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ag.hora || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {ag.servicoNome || 'Serviço'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ag.status === 'Pendente' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'Confirmado' })}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Confirmar
                      </button>
                    )}
                    {ag.status === 'Confirmado' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'EmExecucao' })}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                      >
                        Iniciar
                      </button>
                    )}
                    {ag.status === 'EmExecucao' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'Pronto' })}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Concluir
                      </button>
                    )}
                    {ag.status === 'Pronto' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'Finalizado' })}
                        className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
