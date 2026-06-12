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
  data: BusinessReportsDto,
  period: ReportPeriodDays
): BusinessReport {
  // Simplified computation for LavaMeuCarro
  return {
    period: `${period} days`,
    totalRevenue: data.totalRevenue || 0,
    totalAppointments: data.totalAppointments || 0,
    averageTicket: data.averageTicket || 0,
    revenueSeries: data.revenueOverTime || [],
    appointmentsSeries: data.appointmentsOverTime || [],
    statusSeries: [],
    topServices: data.servicesRanking || [],
    topClients: [],
    insights: [],
    bySalon: [],
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
