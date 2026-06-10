import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Users, Search } from 'lucide-react';
import { useState } from 'react';

export default function MasterUsuarios() {
  const [search, setSearch] = useState('');
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['all-users', search],
    queryFn: async () => (await api.get('/admin/users', { params: { search } })).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Carregando...</div> : !usuarios?.length ? (
          <div className="p-8 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhum usuário encontrado</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{u.tipo}</span></td>
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
