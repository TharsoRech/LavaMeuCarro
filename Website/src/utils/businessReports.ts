import type { BusinessReportsDto } from '../types';

export function formatPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '12m': 'Últimos 12 meses',
  };
  return labels[period] || period;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getEmptyReports(): BusinessReportsDto {
  return {
    period: '',
    appointmentsOverTime: [],
    revenueOverTime: [],
    servicesRanking: [],
    statusBreakdown: [],
    totalAppointments: 0,
    totalRevenue: 0,
    averageTicket: 0,
    cancellationRate: 0,
  };
}
