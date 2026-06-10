import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function AdminEquipe() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => (await api.get('/funcionarios')).data,
  });

  const deleteFunc = useMutation({
    mutationFn: (id: string) => api.delete(`/funcionarios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-400 col-span-3 text-center py-8">Carregando...</p>
        ) : !funcionarios?.length ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum funcionário cadastrado</p>
          </div>
        ) : (
          funcionarios.map((f: any) => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {f.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.nome}</h3>
                    <p className="text-sm text-gray-500">{f.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFunc.mutate(f.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                  {f.especialidade || 'Geral'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  f.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {f.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Novo Funcionário</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
