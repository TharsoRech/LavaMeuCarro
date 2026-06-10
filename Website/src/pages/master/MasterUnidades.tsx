import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Building2, MapPin } from 'lucide-react';

export default function MasterUnidades() {
  const { data: unidades, isLoading } = useQuery({
    queryKey: ['all-unidades'],
    queryFn: async () => (await api.get('/unidades')).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Todas as Unidades</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Carregando...</div> : !unidades?.length ? (
          <div className="p-8 text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma unidade encontrada</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Endereço</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Horário</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unidades.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{u.endereco || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.horarioAbertura} - {u.horarioFechamento}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${u.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
