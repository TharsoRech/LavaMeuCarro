import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { masterSalonsApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { SalonDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

interface SalonEditForm {
  name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  address: string;
  published: boolean;
  active: boolean;
}

export function MasterSalons() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editTarget, setEditTarget] = useState<SalonDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalonDto | null>(null);
  const editForm = useForm<SalonEditForm>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-salons', page, debouncedSearch],
    queryFn: () => masterSalonsApi.list(page, 20, debouncedSearch || undefined).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SalonEditForm }) => masterSalonsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-salons'] }); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterSalonsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-salons'] }); setDeleteTarget(null); },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    setTimeout(() => setDebouncedSearch(val), 400);
    setPage(1);
  };

  const openEdit = (salon: SalonDto) => {
    setEditTarget(salon);
    editForm.reset({
      name: salon.name,
      city: salon.city,
      state: salon.state,
      phone: salon.phone || '',
      email: salon.email || '',
      address: salon.address,
      published: salon.published,
      active: salon.active,
    });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Unidades</h1>
        <p className="text-slate-400 text-sm">Visualize e gerencie todos os salões da plataforma.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome, cidade..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 max-w-md"
        />
      </div>

      {isError && (
        <ApiErrorAlert
          dark
          message={getApiErrorMessage(error, 'Falha ao carregar unidades.')}
          onRetry={() => refetch()}
        />
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Carregando...</div>
        ) : !data?.items?.length ? (
          <div className="p-10 text-center text-slate-500">Nenhum salão encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 uppercase text-xs border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left">Nome</th>
                  <th className="px-5 py-3 text-left">Cidade</th>
                  <th className="px-5 py-3 text-left">Avaliação</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.items.map(salon => (
                  <tr key={salon.id} className="hover:bg-slate-700/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {salon.logoUrl
                          ? <img src={salon.logoUrl} alt={salon.name} className="w-8 h-8 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-bold">{salon.name[0]}</div>
                        }
                        <span className="font-medium text-white">{salon.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{salon.city}, {salon.state}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {salon.averageRating ? `${salon.averageRating.toFixed(1)}★ (${salon.reviews})` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${salon.published ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                        {salon.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEdit(salon)} className="text-slate-500 hover:text-blue-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(salon)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Total: {data?.total ?? 0} salões</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Próximo</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Unidade"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-3">
          <Input label="Nome *" {...editForm.register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade *" {...editForm.register('city', { required: true })} />
            <Input label="Estado *" {...editForm.register('state', { required: true })} />
          </div>
          <Input label="Endereço" {...editForm.register('address')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefone" {...editForm.register('phone')} />
            <Input label="E-mail" {...editForm.register('email')} />
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" {...editForm.register('published')} className="rounded" />
              Publicado
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" {...editForm.register('active')} className="rounded" />
              Ativo
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Unidade"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          Tem certeza que deseja excluir o salão <strong>{deleteTarget?.name}</strong>? Esta ação é irreversível.
        </p>
      </Modal>
    </div>
  );
}

