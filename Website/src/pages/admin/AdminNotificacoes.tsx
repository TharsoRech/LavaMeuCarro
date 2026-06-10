import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Bell, Check } from 'lucide-react';

export default function AdminNotificacoes() {
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => (await api.get('/notificacoes')).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notificações</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : !notificacoes?.length ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificacoes.map((n: any) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.lida ? 'bg-blue-50/50' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${!n.lida ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{n.titulo}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.mensagem}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.dataCriacao ? new Date(n.dataCriacao).toLocaleString('pt-BR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
