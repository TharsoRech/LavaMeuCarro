import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CreditCard } from 'lucide-react';

export default function MasterAssinaturas() {
  const { data: assinaturas, isLoading } = useQuery({
    queryKey: ['assinaturas'],
    queryFn: async () => (await api.get('/admin/assinaturas')).data,
  });

  const statusColors: Record<string, string> = {
    Ativa: 'bg-green-50 text-green-700',
    Inadimplente: 'bg-red-50 text-red-700',
    Cancelada: 'bg-gray-50 text-gray-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Assinaturas</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Carregando...</div> : !assinaturas?.length ? (
          <div className="p-8 text-center"><CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma assinatura</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plano</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assinaturas.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.unidadeNome || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.planoNome || '—'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">R$ {(a.valor ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[a.status] || 'bg-gray-100'}`}>{a.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.vencimento ? new Date(a.vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
