import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../../api';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  });

  const stats = [
    { label: 'Agendamentos Hoje', value: summary?.totalHoje ?? 0, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pendentes', value: summary?.pendentes ?? 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Finalizados (Mês)', value: summary?.finalizadosMes ?? 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Faturamento (Mês)', value: `R$ ${(summary?.faturamentoMes ?? 0).toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Agendamentos</h2>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cliente {i + 1}</p>
                      <p className="text-sm text-gray-500">Serviço básico</p>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {`${8 + i}:00`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Semanal</h2>
          <div className="space-y-3">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-8">{day}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${Math.max(10, Math.random() * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-6">{Math.floor(Math.random() * 10) + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
