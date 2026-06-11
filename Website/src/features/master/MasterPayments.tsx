import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { masterPaymentsApi } from '../../api';
import type { MasterPaymentRecordDto } from '../../types';
import { formatCurrency } from '../../utils/businessReports';

export default function MasterPayments() {
  const [payments, setPayments] = useState<MasterPaymentRecordDto[]>([]);
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
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const getStatusVariant = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
      Paid: 'success',
      Pending: 'warning',
      Overdue: 'danger',
      Cancelled: 'gray',
      Refunded: 'gray',
    };
    return map[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      Paid: 'Pago',
      Pending: 'Pendente',
      Overdue: 'Vencido',
      Cancelled: 'Cancelado',
      Refunded: 'Reembolsado',
    };
    return map[status] || status;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pagamentos</h1>
      <p className="text-gray-500 mb-6">Acompanhe todos os pagamentos da plataforma.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <select
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos os status</option>
            <option value="Paid">Pago</option>
            <option value="Pending">Pendente</option>
            <option value="Overdue">Vencido</option>
            <option value="Cancelled">Cancelado</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-400 animate-pulse">Carregando...</div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum pagamento encontrado.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Proprietário</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Valor</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Método</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-900">{p.ownerName || `Usuário #${p.ownerId}`}</td>
                        <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-2">
                          <Badge variant={getStatusVariant(p.status)}>
                            {getStatusLabel(p.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{p.method || '-'}</td>
                        <td className="py-3 px-2 text-gray-600">
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString('pt-BR')
                            : p.dueDate
                            ? `Venc: ${new Date(p.dueDate).toLocaleDateString('pt-BR')}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} de {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
