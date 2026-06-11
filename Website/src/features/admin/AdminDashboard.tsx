import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getMyAgendamentos } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { useAdminAuth } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, getStatusBadge } from '../../components/ui/Badge';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, MapPin, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const { selectedUnitId, selectedUnit, unidades, setSelectedUnitId } = useUnitSelection();
  const { user } = useAdminAuth();

  const { data: summary, isLoading: loadingSummary, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary', selectedUnitId],
    queryFn: () => getDashboardSummary(selectedUnitId ?? undefined),
    enabled: !!selectedUnitId,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['dashboard-appointments', selectedUnitId],
    queryFn: () => getMyAgendamentos(1, 5, 'Confirmado', selectedUnitId ?? undefined),
    enabled: !!selectedUnitId,
  });

  const upcomingAppointments = appointmentsData?.items || appointmentsData || [];
  const todayStr = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const stats = [
    { label: 'Agendamentos Hoje', value: summary?.totalHoje ?? 0, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pendentes', value: summary?.pendentes ?? 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Finalizados (Mês)', value: summary?.finalizadosMes ?? 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Faturamento (Mês)', value: `R$ ${(summary?.faturamentoMes ?? 0).toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.nome?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-sm text-gray-500 capitalize mt-1">{todayStr}</p>
        </div>
        {unidades.length > 1 && (
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            value={selectedUnitId ?? ''}
            onChange={(e) => setSelectedUnitId(Number(e.target.value))}
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-red-700">Erro ao carregar dados do dashboard.</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingSummary ? (
                    <span className="inline-block w-16 h-7 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : Array.isArray(upcomingAppointments) && upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((apt: any) => {
                  const badge = getStatusBadge(apt.statusName || apt.status?.toString() || '');
                  return (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{apt.clientName || 'Cliente'}</p>
                          <p className="text-sm text-gray-500">{apt.servicoName || 'Serviço'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-blue-600 font-medium">
                          {apt.scheduledAt ? format(new Date(apt.scheduledAt), 'HH:mm') : '--:--'}
                        </span>
                        <div className="mt-1">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <a href="/admin/agendamentos" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver todos os agendamentos &rarr;
                </a>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum agendamento confirmado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Informações da Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUnit ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUnit.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedUnit.address}</p>
                  <p className="text-sm text-gray-500">{selectedUnit.city}, {selectedUnit.state}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`text-sm font-medium ${selectedUnit.published ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedUnit.published ? 'Publicado' : 'Não publicado'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Avaliação</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedUnit.averageRating ? `${selectedUnit.averageRating.toFixed(1)} ★` : 'Sem avaliações'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Leva e Traz</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedUnit.ofereceLevaTraz ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedUnit.phone || 'Não informado'}
                    </p>
                  </div>
                </div>
                <a href="/admin/unidades" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Gerenciar unidade &rarr;
                </a>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma unidade selecionada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
