import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Tag } from 'lucide-react';
import { useState } from 'react';

export default function MasterCategorias() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await api.get('/categorias')).data,
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) => api.delete(`/categorias/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <p className="text-gray-400 col-span-3 text-center py-8">Carregando...</p> : !categorias?.length ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma categoria</p>
          </div>
        ) : categorias.map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.nome}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.descricao || 'Sem descrição'}</p>
              </div>
              <button onClick={() => deleteCat.mutate(c.id)} className="text-red-400 hover:text-red-600 text-sm">Remover</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Nova Categoria</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label><textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
