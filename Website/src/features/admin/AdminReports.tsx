import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarRange, Download, Sparkles, Users, Wallet } from 'lucide-react';
import { appointmentsApi, professionalsApi, salonsApi, servicesApi } from '../../api';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
import {
  buildBusinessReportPrintHtml,
  computeBusinessReport,
  type BusinessReport,
  type ReportPeriodDays,
  type ReportSeriesDatum,
} from '../../utils/businessReports';

const reportPeriods: { label: string; value: ReportPeriodDays }[] = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
  { label: '12 meses', value: 365 },
];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function SectionCard({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function MetricTile({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">{icon}</div>
      </div>
    </div>
  );
}

function VerticalBarChart({ data, valueFormatter }: { data: ReportSeriesDatum[]; valueFormatter: (value: number) => string }) {
  const sanitized = data.filter((item) => item.value > 0 || (item.secondaryValue ?? 0) > 0);
  const chartData = sanitized.length ? sanitized : data;
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const width = Math.max(chartData.length * 76, 360);
  const chartHeight = 220;
  const barWidth = 32;
  const baseY = 170;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={chartHeight} role="img" aria-label="Gráfico de barras">
        <line x1="20" y1={baseY} x2={width - 20} y2={baseY} stroke="#E5E7EB" strokeWidth="1" />
        {chartData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 110;
          const x = 28 + index * 76;
          const y = baseY - barHeight;
          return (
            <g key={`${item.label}-${index}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" fill={item.color || '#D63484'} />
              <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="11" fill="#4B5563">
                {valueFormatter(item.value)}
              </text>
              {item.secondaryValue ? (
                <text x={x + barWidth / 2} y={baseY + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">
                  {formatNumber(item.secondaryValue)} ag.
                </text>
              ) : null}
              <text x={x + barWidth / 2} y={baseY + 32} textAnchor="middle" fontSize="10" fill="#374151">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ report }: { report: BusinessReport }) {
  const total = report.statusSeries.reduce((sum, item) => sum + item.value, 0);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Distribuição por status">
        <circle cx="90" cy="90" r={radius} fill="transparent" stroke="#F3F4F6" strokeWidth="22" />
        {report.statusSeries.map((item) => {
          const length = total ? (item.value / total) * circumference : 0;
          const circle = (
            <circle
              key={item.label}
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke={item.color || '#D63484'}
              strokeWidth="22"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          );
          currentOffset += length;
          return circle;
        })}
        <text x="90" y="84" textAnchor="middle" fontSize="14" fill="#6B7280">Total</text>
        <text x="90" y="104" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">{formatNumber(total)}</text>
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {report.statusSeries.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
            </div>
            <p className="text-xl font-semibold text-gray-900">{formatNumber(item.value)}</p>
            <p className="text-xs text-gray-500">{formatPercent(total ? (item.value / total) * 100 : 0)} do período</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; appointments: number; revenue: number; averageTicket: number; share: number }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Atend.</th>
              <th className="px-4 py-3 text-left">Receita</th>
              <th className="px-4 py-3 text-left">Ticket</th>
              <th className="px-4 py-3 text-left">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sem dados suficientes neste período.</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatNumber(row.appointments)}</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(row.revenue)}</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(row.averageTicket)}</td>
                <td className="px-4 py-3 text-gray-600">{formatPercent(row.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateParam(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function AdminReports() {
  const { user } = useAdminAuth();
  const [periodDays, setPeriodDays] = useState<ReportPeriodDays>(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');

  const { data: salons, isError: isSalonsError, error: salonsError, refetch: refetchSalons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits().then((response) => response.data),
  });

  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);
  const selectedSalon = salons?.find((salon) => salon.id === activeSalonId) ?? salons?.[0];

  // Sincroniza pendentes com aplicados ao mudar datas aplicadas
  useEffect(() => {
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
  }, [startDate, endDate]);

  const effectiveReportRange = useMemo(() => {
    const parsedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const parsedEnd = endDate ? new Date(`${endDate}T00:00:00`) : null;
    const hasValidCustomRange =
      !!parsedStart
      && !!parsedEnd
      && !Number.isNaN(parsedStart.getTime())
      && !Number.isNaN(parsedEnd.getTime())
      && parsedStart <= parsedEnd;

    const effectiveEnd = hasValidCustomRange ? endOfDay(parsedEnd!) : endOfDay(new Date());
    const effectiveStart = hasValidCustomRange ? startOfDay(parsedStart!) : startOfDay(addDays(effectiveEnd, -(periodDays - 1)));

    return {
      start: effectiveStart,
      end: effectiveEnd,
      startDateParam: formatDateParam(effectiveStart),
      endDateParam: formatDateParam(effectiveEnd),
    };
  }, [endDate, periodDays, startDate]);

  const { data: appointments, isLoading: isLoadingAppointments, isError: isAppointmentsError, error: appointmentsError, refetch: refetchAppointments } = useQuery({
    queryKey: ['reports-appointments', activeSalonId, effectiveReportRange.startDateParam, effectiveReportRange.endDateParam],
    queryFn: () => appointmentsApi.bySalon(
      activeSalonId!,
      undefined,
      undefined,
      true,
      effectiveReportRange.startDateParam,
      effectiveReportRange.endDateParam,
      true,
    ).then((response) => response.data),
    enabled: !!activeSalonId,
  });

  const { data: services, isError: isServicesError, error: servicesError, refetch: refetchServices } = useQuery({
    queryKey: ['reports-services', activeSalonId],
    queryFn: () => servicesApi.list(activeSalonId!).then((response) => response.data),
    enabled: !!activeSalonId,
  });

  const { data: professionals, isError: isProfessionalsError, error: professionalsError, refetch: refetchProfessionals } = useQuery({
    queryKey: ['reports-professionals', activeSalonId],
    queryFn: () => professionalsApi.bySalon(activeSalonId!).then((response) => response.data),
    enabled: !!activeSalonId,
  });

  const report = useMemo(() => {
    if (!selectedSalon || !appointments || !services || !professionals) return null;

    return computeBusinessReport({
      salon: selectedSalon,
      appointments,
      services,
      professionals,
      periodDays,
      rangeStart: effectiveReportRange.start,
      rangeEnd: effectiveReportRange.end,
    });
  }, [appointments, effectiveReportRange.end, effectiveReportRange.start, periodDays, professionals, selectedSalon, services]);

   const [isExportingPdf, setIsExportingPdf] = useState(false);
   const readyReport = hasUnits && report ? report : null;
   const handleExportPdf = async () => {
     if (!readyReport || isExportingPdf) return;
     setIsExportingPdf(true);
     try {
       // Gera o HTML do PDF e injeta script para print automático
       let html = buildBusinessReportPrintHtml(readyReport);
       html = html.replace('</body>', '<script>window.onload=function(){window.print();}</script></body>');
       const blob = new Blob([html], { type: 'text/html' });
       const url = URL.createObjectURL(blob);
       window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=900');
     } finally {
       setTimeout(() => setIsExportingPdf(false), 1000);
     }
   };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios com gráficos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão completa e real da unidade, faturamento, clientes, profissionais, serviços e performance operacional.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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

           <button
             type="button"
             onClick={handleExportPdf}
             disabled={!readyReport || isExportingPdf}
             className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isExportingPdf ? (
               <>
                 <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                 </svg>
                 Preparando PDF...
               </>
             ) : (
               <>
                 <Download className="w-4 h-4" />
                 Exportar PDF
               </>
             )}
           </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportPeriods.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setPeriodDays(period.value)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${periodDays === period.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'}`}
          >
            {period.label}
          </button>
        ))}
      </div>

       <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 lg:flex-row lg:items-end">
         <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
           <label className="text-sm text-gray-700">
             Data inicial
             <input
               type="date"
               value={pendingStartDate}
               onChange={(event) => setPendingStartDate(event.target.value)}
               className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
             />
           </label>
           <label className="text-sm text-gray-700">
             Data final
             <input
               type="date"
               value={pendingEndDate}
               onChange={(event) => setPendingEndDate(event.target.value)}
               className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
             />
           </label>
         </div>
         <div className="flex gap-2 mt-3 lg:mt-0">
           <button
             type="button"
             onClick={() => {
               setStartDate(pendingStartDate);
               setEndDate(pendingEndDate);
             }}
             className={`text-sm font-semibold px-4 py-2 rounded-xl border border-brand-200 bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 ${pendingStartDate === startDate && pendingEndDate === endDate ? 'opacity-50 cursor-not-allowed' : ''}`}
             disabled={pendingStartDate === startDate && pendingEndDate === endDate}
           >
             Aplicar datas
           </button>
           <button
             type="button"
             onClick={() => {
               setStartDate('');
               setEndDate('');
               setPendingStartDate('');
               setPendingEndDate('');
               setPeriodDays(30); // volta ao modo automático padrão
             }}
             className="text-sm text-brand-700 border border-brand-200 rounded-xl px-4 py-2 hover:bg-brand-50"
           >
             Limpar datas
           </button>
         </div>
       </div>

      {isSalonsError && (
        <ApiErrorAlert message={getApiErrorMessage(salonsError, 'Falha ao carregar unidades.')} onRetry={() => refetchSalons()} />
      )}
      {isAppointmentsError && (
        <ApiErrorAlert message={getApiErrorMessage(appointmentsError, 'Falha ao carregar agendamentos para os relatórios.')} onRetry={() => refetchAppointments()} />
      )}
      {isServicesError && (
        <ApiErrorAlert message={getApiErrorMessage(servicesError, 'Falha ao carregar serviços para os relatórios.')} onRetry={() => refetchServices()} />
      )}
      {isProfessionalsError && (
        <ApiErrorAlert message={getApiErrorMessage(professionalsError, 'Falha ao carregar profissionais para os relatórios.')} onRetry={() => refetchProfessionals()} />
      )}

      {!hasUnits && (
        <SectionCard title="Sem unidades cadastradas" subtitle="Crie uma unidade para começar a gerar relatórios.">
          <div className="py-4 text-sm text-gray-500">
            Não há dados para consolidar porque sua conta ainda não possui unidade cadastrada.
          </div>
        </SectionCard>
      )}

      {hasUnits && (!readyReport || isLoadingAppointments) ? (
        <SectionCard title="Preparando relatório" subtitle="Consolidando dados reais da unidade.">
          <div className="py-16 text-center text-gray-400">Carregando dados de faturamento, clientes e performance...</div>
        </SectionCard>
      ) : readyReport ? (
        <>
          <SectionCard
            title={readyReport.unit.name}
            subtitle={`${readyReport.dateRangeLabel} • ${readyReport.unit.city ?? 'Cidade'}${readyReport.unit.state ? `/${readyReport.unit.state}` : ''}`}
            actions={
              <div className="rounded-2xl bg-brand-50 text-brand-700 px-4 py-2 text-sm font-medium">
                {readyReport.scopeLabel}
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <MetricTile label="Faturamento realizado" value={formatCurrency(readyReport.summary.realizedRevenue)} helper={`Agendado: ${formatCurrency(readyReport.summary.scheduledRevenue)}`} icon={<Wallet className="w-5 h-5" />} />
              <MetricTile label="Clientes únicos" value={formatNumber(readyReport.summary.uniqueClients)} helper={`${formatNumber(readyReport.summary.newClients)} novos • ${formatNumber(readyReport.summary.returningClients)} recorrentes`} icon={<Users className="w-5 h-5" />} />
              <MetricTile label="Agendamentos" value={formatNumber(readyReport.summary.totalAppointments)} helper={`${formatNumber(readyReport.summary.completedAppointments)} concluídos`} icon={<CalendarRange className="w-5 h-5" />} />
              <MetricTile label="Ticket médio" value={formatCurrency(readyReport.summary.averageTicket)} helper={`Receita perdida: ${formatCurrency(readyReport.summary.lostRevenue)}`} icon={<BarChart3 className="w-5 h-5" />} />
              <MetricTile label="Saúde operacional" value={formatPercent(readyReport.summary.completionRate)} helper={`Canc.: ${formatPercent(readyReport.summary.cancellationRate)} • No-show: ${formatPercent(readyReport.summary.noShowRate)}`} icon={<Sparkles className="w-5 h-5" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Serviços ativos</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(readyReport.unit.servicesCount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Profissionais ativos</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(readyReport.unit.professionalsCount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Avaliação da unidade</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{readyReport.unit.averageRating ? `${readyReport.unit.averageRating.toFixed(1)}★` : '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{formatNumber(readyReport.unit.reviews ?? 0)} avaliações</p>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard title="Faturamento por período" subtitle="Receita realizada pelos atendimentos concluídos.">
              <VerticalBarChart data={readyReport.revenueTimeline} valueFormatter={formatCurrency} />
            </SectionCard>

            <SectionCard title="Distribuição por status" subtitle="Entenda o volume de pendências, confirmações, cancelamentos e no-show.">
              <DonutChart report={readyReport} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard title="Demanda por dia da semana" subtitle="Mostra em quais dias a unidade mais recebe agendamentos.">
              <VerticalBarChart data={readyReport.weekdayDemand} valueFormatter={formatNumber} />
            </SectionCard>

            <SectionCard title="Horários de pico" subtitle="Identifica os horários com maior concentração de atendimentos.">
              <VerticalBarChart data={readyReport.hourlyDemand} valueFormatter={formatNumber} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RankingTable title="Serviços com maior faturamento" rows={readyReport.topServices} />
            <RankingTable title="Profissionais com maior faturamento" rows={readyReport.topProfessionals} />
          </div>

          <SectionCard title="Clientes mais valiosos" subtitle="Clientes com maior faturamento realizado e recorrência no período.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Visitas</th>
                    <th className="px-4 py-3 text-left">Receita</th>
                    <th className="px-4 py-3 text-left">Última visita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readyReport.topClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sem clientes concluídos suficientes neste período.</td>
                    </tr>
                  ) : readyReport.topClients.map((client: any) => (
                    <tr key={`${client.name}-${client.lastVisit ?? 'none'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(client.visits)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(client.revenue)}</td>
                      <td className="px-4 py-3 text-gray-600">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Insights automáticos" subtitle="Leituras rápidas para apoiar decisões da unidade.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyReport.insights.map((insight: any) => (
                <div key={insight} className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
