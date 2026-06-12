import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { masterPaymentsApi } from '../../api';
import { formatCurrency } from '../../utils/businessReports';
export default function MasterPayments() {
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const pageSize = 25;
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const data = await masterPaymentsApi.list({
                status: statusFilter || undefined,
                page,
                pageSize,
            });
            setPayments(data.items || []);
            setTotal(data.total || 0);
        }
        catch {
            // silently fail
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPayments();
    }, [page, statusFilter]);
    const getStatusVariant = (status) => {
        const map = {
            Paid: 'success',
            Pending: 'warning',
            Overdue: 'danger',
            Cancelled: 'gray',
            Refunded: 'gray',
        };
        return map[status] || 'gray';
    };
    const getStatusLabel = (status) => {
        const map = {
            Paid: 'Pago',
            Pending: 'Pendente',
            Overdue: 'Vencido',
            Cancelled: 'Cancelado',
            Refunded: 'Reembolsado',
        };
        return map[status] || status;
    };
    const totalPages = Math.ceil(total / pageSize);
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Pagamentos" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Acompanhe todos os pagamentos da plataforma." }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { children: "Hist\u00F3rico de Pagamentos" }), _jsxs("select", { className: "px-3 py-1.5 border border-gray-300 rounded-lg text-sm", value: statusFilter, onChange: (e) => { setStatusFilter(e.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "Todos os status" }), _jsx("option", { value: "Paid", children: "Pago" }), _jsx("option", { value: "Pending", children: "Pendente" }), _jsx("option", { value: "Overdue", children: "Vencido" }), _jsx("option", { value: "Cancelled", children: "Cancelado" })] })] }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "py-8 text-center text-gray-400 animate-pulse", children: "Carregando..." })) : payments.length === 0 ? (_jsx("div", { className: "py-8 text-center text-gray-500", children: "Nenhum pagamento encontrado." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "text-left py-3 px-2 font-medium text-gray-500", children: "Propriet\u00E1rio" }), _jsx("th", { className: "text-left py-3 px-2 font-medium text-gray-500", children: "Valor" }), _jsx("th", { className: "text-left py-3 px-2 font-medium text-gray-500", children: "Status" }), _jsx("th", { className: "text-left py-3 px-2 font-medium text-gray-500", children: "M\u00E9todo" }), _jsx("th", { className: "text-left py-3 px-2 font-medium text-gray-500", children: "Data" })] }) }), _jsx("tbody", { children: payments.map((p) => (_jsxs("tr", { className: "border-b border-gray-50 hover:bg-gray-50", children: [_jsx("td", { className: "py-3 px-2 text-gray-900", children: p.ownerName || `Usuário #${p.ownerId}` }), _jsx("td", { className: "py-3 px-2 font-medium text-gray-900", children: formatCurrency(p.amount) }), _jsx("td", { className: "py-3 px-2", children: _jsx(Badge, { variant: getStatusVariant(p.status), children: getStatusLabel(p.status) }) }), _jsx("td", { className: "py-3 px-2 text-gray-600", children: p.method || '-' }), _jsx("td", { className: "py-3 px-2 text-gray-600", children: p.paymentDate
                                                                ? new Date(p.paymentDate).toLocaleDateString('pt-BR')
                                                                : p.dueDate
                                                                    ? `Venc: ${new Date(p.dueDate).toLocaleDateString('pt-BR')}`
                                                                    : '-' })] }, p.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-gray-100", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["Mostrando ", (page - 1) * pageSize + 1, "-", Math.min(page * pageSize, total), " de ", total] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: page === 1, onClick: () => setPage((p) => p - 1), children: "Anterior" }), _jsx(Button, { variant: "outline", size: "sm", disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), children: "Pr\u00F3xima" })] })] }))] })) })] })] }));
}
