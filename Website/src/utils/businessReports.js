export function computeBusinessReport(data, period) {
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
export function buildBusinessReportPrintHtml(report) {
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
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
export function formatPeriodLabel(period) {
    const labels = {
        '7d': 'Últimos 7 dias',
        '30d': 'Últimos 30 dias',
        '90d': 'Últimos 90 dias',
        '365d': 'Últimos 12 meses',
    };
    return labels[period] || period;
}
export function formatPercentage(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}
