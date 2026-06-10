import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MapPin, Clock, Phone, Plus, Edit2 } from 'lucide-react';

export default function AdminUnidades() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: unidades, isLoading } = useQuery({
    queryKey: ['minhas-unidades'],
    queryFn: async () => (await api.get('/unidades/minhas')).data,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Unidades</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nova Unidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <p className="text-gray-400 col-span-2 text-center py-8">Carregando...</p>
        ) : !unidades?.length ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-100">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma unidade cadastrada</p>
          </div>
        ) : (
          unidades.map((u: any) => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{u.nome}</h3>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{u.endereco || 'Endereço não informado'}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{u.telefone || 'Não informado'}</p>
                <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{u.horarioAbertura} - {u.horarioFechamento}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </span>
                {u.latitude && u.longitude && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    Geolocalizado
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Nova Unidade</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label><input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label><input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
