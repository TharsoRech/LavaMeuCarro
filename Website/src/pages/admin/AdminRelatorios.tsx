import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Percent, Printer } from 'lucide-react';
import { formatCurrency, formatPeriodLabel, formatPercentage } from '../../utils/businessReports';

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Últimos 12 meses' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminRelatorios() {
  const { selectedUnitId } = useUnitSelection();
  const [period, setPeriod] = useState('30d');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['business-reports', period, selectedUnitId],
    queryFn: () => reportsApi.getBusinessReports(period, selectedUnitId ?? undefined),
  });

  const handlePrint = () => window.print();

  const summaryStats = [
    { label: 'Receita Total', value: formatCurrency(reports?.totalRevenue ?? 0), icon: DollarSign },
    { label: 'Total Agendamentos', value: (reports?.totalAppointments ?? 0).toString(), icon: Calendar },
    { label: 'Ticket Médio', value: formatCurrency(reports?.averageTicket ?? 0), icon: TrendingUp },
    { label: 'Taxa Cancelamento', value: formatPercentage(reports?.cancellationRate ?? 0), icon: Percent },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  period === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? <span className="inline-block w-20 h-6 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-64 bg-gray-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Over Time */}
          <Card>
            <CardHeader><CardTitle>Agendamentos por Período</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reports?.appointmentsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Over Time */}
          <Card>
            <CardHeader><CardTitle>Receita por Período</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports?.revenueOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Services Ranking */}
          <Card>
            <CardHeader><CardTitle>Ranking de Serviços</CardTitle></CardHeader>
            <CardContent>
              {(reports?.servicesRanking || []).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sem dados no período</p>
              ) : (
                <div className="space-y-3">
                  {(reports?.servicesRanking || []).slice(0, 10).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(s.revenue)}</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.max(5, (s.count / (reports?.servicesRanking[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{s.count} agend.</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              {(reports?.statusBreakdown || []).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reports?.statusBreakdown || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {(reports?.statusBreakdown || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
