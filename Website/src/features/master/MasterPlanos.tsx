import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CreditCard, Check } from 'lucide-react';

export default function MasterPlanos() {
  const { data: planos, isLoading } = useQuery({
    queryKey: ['planos'],
    queryFn: async () => (await api.get('/planos')).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Planos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? <p className="text-gray-400 col-span-3 text-center py-8">Carregando...</p> : planos?.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900">{p.nome}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">R$ {p.preco?.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/mês</span></p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-green-500" />{p.limiteAgendamentos ?? '∞'} agendamentos/mês</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-green-500" />Dashboard básico</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-green-500" />Suporte por email</li>
            </ul>
            <span className={`mt-4 inline-block px-3 py-1 text-xs rounded-full font-medium ${p.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {p.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
