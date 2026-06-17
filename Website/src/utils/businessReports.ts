import type { BusinessReportsDto } from '../types';

export type ReportPeriodDays = 7 | 30 | 90 | 365;

export interface ReportSeriesDatum {
  date: string;
  value?: number;
  amount?: number;
  count?: number;
  secondaryValue?: number;
  color?: string;
  label?: string;
}

export interface BusinessReport {
  period: string;
  totalRevenue: number;
  totalAppointments: number;
  averageTicket: number;
  revenueSeries: ReportSeriesDatum[];
  appointmentsSeries: ReportSeriesDatum[];
  statusSeries: ReportSeriesDatum[];
  topServices: Array<{ name: string; count: number; revenue: number }>;
  topClients: Array<{ name: string; count: number; revenue: number }>;
  insights: string[];
  bySalon?: any[];
  summary?: any;
  unit?: any;
  weekdayDemand?: any[];
  topProfessionals?: any[];
  scopeLabel?: string;
  revenueTimeline?: any[];
  hourlyDemand?: any[];
  dateRangeLabel?: string;
}

export function computeBusinessReport(
  data: any,
  period: ReportPeriodDays
): BusinessReport {
  const { salon, appointments, services, professionals, rangeStart, rangeEnd } = data;
  
  if (!salon || !appointments || !services || !professionals) {
    return {
      period: `${period} days`,
      totalRevenue: 0,
      totalAppointments: 0,
      averageTicket: 0,
      revenueSeries: [],
      appointmentsSeries: [],
      statusSeries: [],
      topServices: [],
      topClients: [],
      insights: [],
      bySalon: [],
    };
  }

  // Filter appointments by date range
  const filteredAppointments = appointments.items?.filter((apt: any) => {
    const aptDate = new Date(apt.scheduledAt);
    return aptDate >= rangeStart && aptDate <= rangeEnd;
  }) || [];

  // Calculate metrics
  const completedAppointments = filteredAppointments.filter(
    (apt: any) => apt.status === 'Finalizado' || apt.status === 'Completed'
  );
  
  const canceledAppointments = filteredAppointments.filter(
    (apt: any) => apt.status === 'Cancelado' || apt.status === 'Cancelled'
  );

  const realizedRevenue = completedAppointments.reduce(
    (sum: number, apt: any) => sum + (apt.price || apt.totalPrice || 0), 0
  );

  const scheduledRevenue = filteredAppointments.reduce(
    (sum: number, apt: any) => sum + (apt.price || apt.totalPrice || 0), 0
  );

  const lostRevenue = canceledAppointments.reduce(
    (sum: number, apt: any) => sum + (apt.price || apt.totalPrice || 0), 0
  );

  const uniqueClientIds = new Set(filteredAppointments.map((apt: any) => apt.clientId));
  const newClientIds = new Set(
    filteredAppointments
      .filter((apt: any) => apt.isNewClient)
      .map((apt: any) => apt.clientId)
  );

  const averageTicket = filteredAppointments.length > 0 
    ? realizedRevenue / filteredAppointments.length 
    : 0;

  const completionRate = filteredAppointments.length > 0
    ? (completedAppointments.length / filteredAppointments.length) * 100
    : 0;

  const cancellationRate = filteredAppointments.length > 0
    ? (canceledAppointments.length / filteredAppointments.length) * 100
    : 0;

  const noShowRate = filteredAppointments.length > 0
    ? (filteredAppointments.filter((apt: any) => 
        apt.status === 'NoShow' || apt.status === 'No-show'
      ).length / filteredAppointments.length) * 100
    : 0;

  // Build date range label
  const startStr = rangeStart.toLocaleDateString('pt-BR');
  const endStr = rangeEnd.toLocaleDateString('pt-BR');
  const dateRangeLabel = `${startStr} - ${endStr}`;

  // Build revenue timeline
  const revenueTimeline: any[] = [];
  const appointmentsByDate: Record<string, number> = {};
  
  filteredAppointments.forEach((apt: any) => {
    const date = new Date(apt.scheduledAt).toLocaleDateString('pt-BR');
    appointmentsByDate[date] = (appointmentsByDate[date] || 0) + 1;
  });

  Object.entries(appointmentsByDate).forEach(([date, count]) => {
    revenueTimeline.push({ label: date, value: count });
  });

  // Build weekday demand
  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekdayCounts = new Array(7).fill(0);
  
  filteredAppointments.forEach((apt: any) => {
    const day = new Date(apt.scheduledAt).getDay();
    weekdayCounts[day]++;
  });

  const weekdayDemand = weekdayCounts.map((count, index) => ({
    label: weekdayNames[index],
    value: count
  }));

  // Build top services
  const serviceMap: Record<number, { name: string; count: number; revenue: number }> = {};
  
  filteredAppointments.forEach((apt: any) => {
    const serviceId = apt.serviceId;
    if (!serviceMap[serviceId]) {
      serviceMap[serviceId] = {
        name: apt.serviceName || 'Serviço',
        count: 0,
        revenue: 0
      };
    }
    serviceMap[serviceId].count++;
    serviceMap[serviceId].revenue += (apt.price || apt.totalPrice || 0);
  });

  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Build top professionals
  const professionalMap: Record<number, { name: string; count: number; revenue: number }> = {};
  
  completedAppointments.forEach((apt: any) => {
    const profId = apt.professionalId;
    if (!professionalMap[profId]) {
      professionalMap[profId] = {
        name: apt.professionalName || 'Profissional',
        count: 0,
        revenue: 0
      };
    }
    professionalMap[profId].count++;
    professionalMap[profId].revenue += (apt.price || apt.totalPrice || 0);
  });

  const topProfessionals = Object.values(professionalMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Build scope label
  const scopeLabel = `${filteredAppointments.length} agendamentos`;

  // Build status series for donut chart
  const statusMap: Record<string, { label: string; value: number; color: string }> = {};
  filteredAppointments.forEach((apt: any) => {
    const status = apt.status || 'Pendente';
    if (!statusMap[status]) {
      statusMap[status] = { label: status, value: 0, color: '#D63484' };
    }
    statusMap[status].value++;
  });
  const statusSeries = Object.values(statusMap).map(s => ({ ...s, date: s.label }));

  // Build top clients
  const clientMap: Record<number, { name: string; count: number; revenue: number; lastVisit?: string }> = {};
  completedAppointments.forEach((apt: any) => {
    const clientId = apt.clientId;
    if (!clientMap[clientId]) {
      clientMap[clientId] = {
        name: apt.clientName || 'Cliente',
        count: 0,
        revenue: 0,
      };
    }
    clientMap[clientId].count++;
    clientMap[clientId].revenue += (apt.price || apt.totalPrice || 0);
    const aptDate = new Date(apt.scheduledAt);
    if (!clientMap[clientId].lastVisit || aptDate > new Date(clientMap[clientId].lastVisit!)) {
      clientMap[clientId].lastVisit = apt.scheduledAt;
    }
  });
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(c => ({ name: c.name, count: c.count, revenue: c.revenue }));

  // Build insights
  const insights: string[] = [];
  if (completionRate > 80) {
    insights.push('Excelente taxa de conclusão! Mais de 80% dos agendamentos são finalizados.');
  } else if (completionRate < 50) {
    insights.push('Atenção: taxa de conclusão abaixo de 50%. Considere revisar o processo de confirmação.');
  }
  if (cancellationRate > 20) {
    insights.push('Taxa de cancelamento alta. Considere implementar política de cancelamento.');
  }
  if (topClients.length > 0) {
    insights.push(`Top cliente: ${topClients[0].name} com ${topClients[0].count} visitas e ${formatCurrency(topClients[0].revenue)}.`);
  }
  if (uniqueClientIds.size > 0) {
    const retentionRate = ((uniqueClientIds.size - newClientIds.size) / uniqueClientIds.size) * 100;
    insights.push(`Taxa de retenção: ${retentionRate.toFixed(1)}% dos clientes são recorrentes.`);
  }

  return {
    period: `${period} dias`,
    totalRevenue: realizedRevenue,
    totalAppointments: filteredAppointments.length,
    averageTicket,
    revenueSeries: [],
    appointmentsSeries: [],
    statusSeries,
    topServices,
    topClients,
    insights,
    bySalon: [],
    summary: {
      realizedRevenue,
      scheduledRevenue,
      uniqueClients: uniqueClientIds.size,
      newClients: newClientIds.size,
      returningClients: uniqueClientIds.size - newClientIds.size,
      totalAppointments: filteredAppointments.length,
      completedAppointments: completedAppointments.length,
      averageTicket,
      lostRevenue,
      completionRate,
      cancellationRate,
      noShowRate,
    },
    unit: {
      name: salon.name,
      city: salon.city,
      state: salon.state,
      servicesCount: services.length,
      professionalsCount: professionals.length,
      averageRating: salon.averageRating ? Number(salon.averageRating) : 0,
      reviews: salon.reviewsCount || salon.reviews || 0,
    },
    weekdayDemand,
    topProfessionals,
    scopeLabel,
    revenueTimeline,
    hourlyDemand: [],
    dateRangeLabel,
  };
}

export function buildBusinessReportPrintHtml(report: BusinessReport): string {
  return `
    <html>
      <head><title>Relatório - ${report.period}</title></head>
      <body>
        <h1>Relatório de Negócio</h1>
        <p>Período: ${report.period}</p>
        <p>Receita Total: R$ ${report.totalRevenue.toFixed(2)}</p>
        <p>Total de Agendamentos: ${report.totalAppointments}</p>
        <p>Ticket Médio: R$ ${report.averageTicket.toFixed(2)}</p>
      </body>
    </html>
  `;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '365d': 'Últimos 12 meses',
  };
  return labels[period] || period;
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
