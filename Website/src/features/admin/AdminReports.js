import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarRange, Download, Sparkles, Users, Wallet } from 'lucide-react';
import { appointmentsApi, professionalsApi, salonsApi, servicesApi } from '../../api';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
import { buildBusinessReportPrintHtml, computeBusinessReport, } from '../../utils/businessReports';
const reportPeriods = [
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
function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}
function formatNumber(value) {
    return numberFormatter.format(Number.isFinite(value) ? value : 0);
}
function formatPercent(value) {
    return `${value.toFixed(1).replace('.', ',')}%`;
}
function SectionCard({ title, subtitle, children, actions }) {
    return (_jsxs("section", { className: "bg-white rounded-2xl border border-gray-200 shadow-sm p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: title }), subtitle && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: subtitle })] }), actions] }), children] }));
}
function MetricTile({ label, value, helper, icon }) {
    return (_jsx("div", { className: "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: label }), _jsx("p", { className: "text-2xl font-semibold text-gray-900 mt-1", children: value }), helper && _jsx("p", { className: "text-xs text-gray-500 mt-1", children: helper })] }), _jsx("div", { className: "w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center", children: icon })] }) }));
}
function VerticalBarChart({ data, valueFormatter }) {
    const sanitized = data.filter((item) => item.value > 0 || (item.secondaryValue ?? 0) > 0);
    const chartData = sanitized.length ? sanitized : data;
    const maxValue = Math.max(...chartData.map((item) => item.value), 1);
    const width = Math.max(chartData.length * 76, 360);
    const chartHeight = 220;
    const barWidth = 32;
    const baseY = 170;
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("svg", { width: width, height: chartHeight, role: "img", "aria-label": "Gr\u00E1fico de barras", children: [_jsx("line", { x1: "20", y1: baseY, x2: width - 20, y2: baseY, stroke: "#E5E7EB", strokeWidth: "1" }), chartData.map((item, index) => {
                    const barHeight = (item.value / maxValue) * 110;
                    const x = 28 + index * 76;
                    const y = baseY - barHeight;
                    return (_jsxs("g", { children: [_jsx("rect", { x: x, y: y, width: barWidth, height: barHeight, rx: "10", fill: item.color || '#D63484' }), _jsx("text", { x: x + barWidth / 2, y: y - 10, textAnchor: "middle", fontSize: "11", fill: "#4B5563", children: valueFormatter(item.value) }), item.secondaryValue ? (_jsxs("text", { x: x + barWidth / 2, y: baseY + 16, textAnchor: "middle", fontSize: "10", fill: "#9CA3AF", children: [formatNumber(item.secondaryValue), " ag."] })) : null, _jsx("text", { x: x + barWidth / 2, y: baseY + 32, textAnchor: "middle", fontSize: "10", fill: "#374151", children: item.label })] }, `${item.label}-${index}`));
                })] }) }));
}
function DonutChart({ report }) {
    const total = report.statusSeries.reduce((sum, item) => sum + item.value, 0);
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;
    return (_jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-center lg:items-start", children: [_jsxs("svg", { width: "180", height: "180", viewBox: "0 0 180 180", role: "img", "aria-label": "Distribui\u00E7\u00E3o por status", children: [_jsx("circle", { cx: "90", cy: "90", r: radius, fill: "transparent", stroke: "#F3F4F6", strokeWidth: "22" }), report.statusSeries.map((item) => {
                        const length = total ? (item.value / total) * circumference : 0;
                        const circle = (_jsx("circle", { cx: "90", cy: "90", r: radius, fill: "transparent", stroke: item.color || '#D63484', strokeWidth: "22", strokeDasharray: `${length} ${circumference}`, strokeDashoffset: -currentOffset, strokeLinecap: "round", transform: "rotate(-90 90 90)" }, item.label));
                        currentOffset += length;
                        return circle;
                    }), _jsx("text", { x: "90", y: "84", textAnchor: "middle", fontSize: "14", fill: "#6B7280", children: "Total" }), _jsx("text", { x: "90", y: "104", textAnchor: "middle", fontSize: "24", fontWeight: "700", fill: "#111827", children: formatNumber(total) })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 w-full", children: report.statusSeries.map((item) => (_jsxs("div", { className: "rounded-xl border border-gray-200 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color } }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: item.label })] }), _jsx("p", { className: "text-xl font-semibold text-gray-900", children: formatNumber(item.value) }), _jsxs("p", { className: "text-xs text-gray-500", children: [formatPercent(total ? (item.value / total) * 100 : 0), " do per\u00EDodo"] })] }, item.label))) })] }));
}
function RankingTable({ title, rows, }) {
    return (_jsxs("div", { className: "rounded-2xl border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 bg-gray-50 border-b border-gray-200", children: _jsx("h3", { className: "font-semibold text-gray-900", children: title }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white text-gray-500 uppercase text-xs", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left", children: "Atend." }), _jsx("th", { className: "px-4 py-3 text-left", children: "Receita" }), _jsx("th", { className: "px-4 py-3 text-left", children: "Ticket" }), _jsx("th", { className: "px-4 py-3 text-left", children: "Share" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100 bg-white", children: rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-gray-400", children: "Sem dados suficientes neste per\u00EDodo." }) })) : rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: row.name }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatNumber(row.appointments) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatCurrency(row.revenue) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatCurrency(row.averageTicket) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatPercent(row.share) })] }, row.name))) })] }) })] }));
}
function startOfDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}
function endOfDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}
function addDays(value, days) {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
}
function formatDateParam(value) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
export function AdminReports() {
    const { user } = useAdminAuth();
    const [periodDays, setPeriodDays] = useState(30);
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
        const hasValidCustomRange = !!parsedStart
            && !!parsedEnd
            && !Number.isNaN(parsedStart.getTime())
            && !Number.isNaN(parsedEnd.getTime())
            && parsedStart <= parsedEnd;
        const effectiveEnd = hasValidCustomRange ? endOfDay(parsedEnd) : endOfDay(new Date());
        const effectiveStart = hasValidCustomRange ? startOfDay(parsedStart) : startOfDay(addDays(effectiveEnd, -(periodDays - 1)));
        return {
            start: effectiveStart,
            end: effectiveEnd,
            startDateParam: formatDateParam(effectiveStart),
            endDateParam: formatDateParam(effectiveEnd),
        };
    }, [endDate, periodDays, startDate]);
    const { data: appointments, isLoading: isLoadingAppointments, isError: isAppointmentsError, error: appointmentsError, refetch: refetchAppointments } = useQuery({
        queryKey: ['reports-appointments', activeSalonId, effectiveReportRange.startDateParam, effectiveReportRange.endDateParam],
        queryFn: () => appointmentsApi.bySalon(activeSalonId, undefined, undefined, true, effectiveReportRange.startDateParam, effectiveReportRange.endDateParam, true).then((response) => response.data),
        enabled: !!activeSalonId,
    });
    const { data: services, isError: isServicesError, error: servicesError, refetch: refetchServices } = useQuery({
        queryKey: ['reports-services', activeSalonId],
        queryFn: () => servicesApi.list(activeSalonId).then((response) => response.data),
        enabled: !!activeSalonId,
    });
    const { data: professionals, isError: isProfessionalsError, error: professionalsError, refetch: refetchProfessionals } = useQuery({
        queryKey: ['reports-professionals', activeSalonId],
        queryFn: () => professionalsApi.bySalon(activeSalonId).then((response) => response.data),
        enabled: !!activeSalonId,
    });
    const report = useMemo(() => {
        if (!selectedSalon || !appointments || !services || !professionals)
            return null;
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
        if (!readyReport || isExportingPdf)
            return;
        setIsExportingPdf(true);
        try {
            // Gera o HTML do PDF e injeta script para print automático
            let html = buildBusinessReportPrintHtml(readyReport);
            html = html.replace('</body>', '<script>window.onload=function(){window.print();}</script></body>');
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=900');
        }
        finally {
            setTimeout(() => setIsExportingPdf(false), 1000);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Relat\u00F3rios com gr\u00E1ficos" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Vis\u00E3o completa e real da unidade, faturamento, clientes, profissionais, servi\u00E7os e performance operacional." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [salons && salons.length > 0 && (_jsx("select", { value: activeSalonId ?? '', onChange: (event) => handleSalonChange(Number(event.target.value)), className: "border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white", children: salons.map((salon) => (_jsx("option", { value: salon.id, children: salon.name }, salon.id))) })), _jsx("button", { type: "button", onClick: handleExportPdf, disabled: !readyReport || isExportingPdf, className: "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed", children: isExportingPdf ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4 mr-2", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), "Preparando PDF..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4" }), "Exportar PDF"] })) })] })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: reportPeriods.map((period) => (_jsx("button", { type: "button", onClick: () => setPeriodDays(period.value), className: `px-4 py-2 rounded-full text-sm border transition-colors ${periodDays === period.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'}`, children: period.label }, period.value))) }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 lg:flex-row lg:items-end", children: [_jsxs("div", { className: "flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("label", { className: "text-sm text-gray-700", children: ["Data inicial", _jsx("input", { type: "date", value: pendingStartDate, onChange: (event) => setPendingStartDate(event.target.value), className: "mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" })] }), _jsxs("label", { className: "text-sm text-gray-700", children: ["Data final", _jsx("input", { type: "date", value: pendingEndDate, onChange: (event) => setPendingEndDate(event.target.value), className: "mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" })] })] }), _jsxs("div", { className: "flex gap-2 mt-3 lg:mt-0", children: [_jsx("button", { type: "button", onClick: () => {
                                    setStartDate(pendingStartDate);
                                    setEndDate(pendingEndDate);
                                }, className: `text-sm font-semibold px-4 py-2 rounded-xl border border-brand-200 bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 ${pendingStartDate === startDate && pendingEndDate === endDate ? 'opacity-50 cursor-not-allowed' : ''}`, disabled: pendingStartDate === startDate && pendingEndDate === endDate, children: "Aplicar datas" }), _jsx("button", { type: "button", onClick: () => {
                                    setStartDate('');
                                    setEndDate('');
                                    setPendingStartDate('');
                                    setPendingEndDate('');
                                    setPeriodDays(30); // volta ao modo automático padrão
                                }, className: "text-sm text-brand-700 border border-brand-200 rounded-xl px-4 py-2 hover:bg-brand-50", children: "Limpar datas" })] })] }), isSalonsError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(salonsError, 'Falha ao carregar unidades.'), onRetry: () => refetchSalons() })), isAppointmentsError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(appointmentsError, 'Falha ao carregar agendamentos para os relatórios.'), onRetry: () => refetchAppointments() })), isServicesError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(servicesError, 'Falha ao carregar serviços para os relatórios.'), onRetry: () => refetchServices() })), isProfessionalsError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(professionalsError, 'Falha ao carregar profissionais para os relatórios.'), onRetry: () => refetchProfessionals() })), !hasUnits && (_jsx(SectionCard, { title: "Sem unidades cadastradas", subtitle: "Crie uma unidade para come\u00E7ar a gerar relat\u00F3rios.", children: _jsx("div", { className: "py-4 text-sm text-gray-500", children: "N\u00E3o h\u00E1 dados para consolidar porque sua conta ainda n\u00E3o possui unidade cadastrada." }) })), hasUnits && (!readyReport || isLoadingAppointments) ? (_jsx(SectionCard, { title: "Preparando relat\u00F3rio", subtitle: "Consolidando dados reais da unidade.", children: _jsx("div", { className: "py-16 text-center text-gray-400", children: "Carregando dados de faturamento, clientes e performance..." }) })) : readyReport ? (_jsxs(_Fragment, { children: [_jsxs(SectionCard, { title: readyReport.unit.name, subtitle: `${readyReport.dateRangeLabel} • ${readyReport.unit.city ?? 'Cidade'}${readyReport.unit.state ? `/${readyReport.unit.state}` : ''}`, actions: _jsx("div", { className: "rounded-2xl bg-brand-50 text-brand-700 px-4 py-2 text-sm font-medium", children: readyReport.scopeLabel }), children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4", children: [_jsx(MetricTile, { label: "Faturamento realizado", value: formatCurrency(readyReport.summary.realizedRevenue), helper: `Agendado: ${formatCurrency(readyReport.summary.scheduledRevenue)}`, icon: _jsx(Wallet, { className: "w-5 h-5" }) }), _jsx(MetricTile, { label: "Clientes \u00FAnicos", value: formatNumber(readyReport.summary.uniqueClients), helper: `${formatNumber(readyReport.summary.newClients)} novos • ${formatNumber(readyReport.summary.returningClients)} recorrentes`, icon: _jsx(Users, { className: "w-5 h-5" }) }), _jsx(MetricTile, { label: "Agendamentos", value: formatNumber(readyReport.summary.totalAppointments), helper: `${formatNumber(readyReport.summary.completedAppointments)} concluídos`, icon: _jsx(CalendarRange, { className: "w-5 h-5" }) }), _jsx(MetricTile, { label: "Ticket m\u00E9dio", value: formatCurrency(readyReport.summary.averageTicket), helper: `Receita perdida: ${formatCurrency(readyReport.summary.lostRevenue)}`, icon: _jsx(BarChart3, { className: "w-5 h-5" }) }), _jsx(MetricTile, { label: "Sa\u00FAde operacional", value: formatPercent(readyReport.summary.completionRate), helper: `Canc.: ${formatPercent(readyReport.summary.cancellationRate)} • No-show: ${formatPercent(readyReport.summary.noShowRate)}`, icon: _jsx(Sparkles, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-5", children: [_jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-4", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Servi\u00E7os ativos" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900 mt-1", children: formatNumber(readyReport.unit.servicesCount) })] }), _jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-4", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Profissionais ativos" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900 mt-1", children: formatNumber(readyReport.unit.professionalsCount) })] }), _jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-4", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Avalia\u00E7\u00E3o da unidade" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900 mt-1", children: readyReport.unit.averageRating ? `${readyReport.unit.averageRating.toFixed(1)}★` : '—' }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [formatNumber(readyReport.unit.reviews ?? 0), " avalia\u00E7\u00F5es"] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsx(SectionCard, { title: "Faturamento por per\u00EDodo", subtitle: "Receita realizada pelos atendimentos conclu\u00EDdos.", children: _jsx(VerticalBarChart, { data: readyReport.revenueTimeline, valueFormatter: formatCurrency }) }), _jsx(SectionCard, { title: "Distribui\u00E7\u00E3o por status", subtitle: "Entenda o volume de pend\u00EAncias, confirma\u00E7\u00F5es, cancelamentos e no-show.", children: _jsx(DonutChart, { report: readyReport }) })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsx(SectionCard, { title: "Demanda por dia da semana", subtitle: "Mostra em quais dias a unidade mais recebe agendamentos.", children: _jsx(VerticalBarChart, { data: readyReport.weekdayDemand, valueFormatter: formatNumber }) }), _jsx(SectionCard, { title: "Hor\u00E1rios de pico", subtitle: "Identifica os hor\u00E1rios com maior concentra\u00E7\u00E3o de atendimentos.", children: _jsx(VerticalBarChart, { data: readyReport.hourlyDemand, valueFormatter: formatNumber }) })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsx(RankingTable, { title: "Servi\u00E7os com maior faturamento", rows: readyReport.topServices }), _jsx(RankingTable, { title: "Profissionais com maior faturamento", rows: readyReport.topProfessionals })] }), _jsx(SectionCard, { title: "Clientes mais valiosos", subtitle: "Clientes com maior faturamento realizado e recorr\u00EAncia no per\u00EDodo.", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 text-gray-500 uppercase text-xs", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left", children: "Cliente" }), _jsx("th", { className: "px-4 py-3 text-left", children: "Visitas" }), _jsx("th", { className: "px-4 py-3 text-left", children: "Receita" }), _jsx("th", { className: "px-4 py-3 text-left", children: "\u00DAltima visita" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: readyReport.topClients.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-400", children: "Sem clientes conclu\u00EDdos suficientes neste per\u00EDodo." }) })) : readyReport.topClients.map((client) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: client.name }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatNumber(client.visits) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: formatCurrency(client.revenue) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR') : '—' })] }, `${client.name}-${client.lastVisit ?? 'none'}`))) })] }) }) }), _jsx(SectionCard, { title: "Insights autom\u00E1ticos", subtitle: "Leituras r\u00E1pidas para apoiar decis\u00F5es da unidade.", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: readyReport.insights.map((insight) => (_jsx("div", { className: "rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-gray-700", children: insight }, insight))) }) })] })) : null] }));
}
