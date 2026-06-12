import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Search, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { masterUsersApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { UserDto, UserType } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

const typeLabels: Record<string, string> = {
  Client: 'Cliente',
  Professional: 'Profissional',
  Owner: 'Proprietário',
  Admin: 'Admin',
};

interface UserEditForm {
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  active: boolean;
}

export function MasterUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const editForm = useForm<UserEditForm>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-users', page, debouncedSearch],
    queryFn: () => masterUsersApi.list(page, 20, debouncedSearch || undefined).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterUsersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-users'] }); setDeleteTarget(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserEditForm }) => masterUsersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-users'] }); setEditTarget(null); },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    setTimeout(() => setDebouncedSearch(val), 400);
    setPage(1);
  };

  const openEdit = (user: UserDto) => {
    setEditTarget(user);
    editForm.reset({ name: user.name, email: user.email, phone: user.phone || '', type: user.type, active: user.active });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-slate-400 text-sm">Gerencie todos os usuários da plataforma.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 max-w-md"
        />
      </div>

      {isError && (
        <ApiErrorAlert
          dark
          message={getApiErrorMessage(error, 'Falha ao carregar usuários.')}
          onRetry={() => refetch()}
        />
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Carregando...</div>
        ) : !data?.items?.length ? (
          <div className="p-10 text-center text-slate-500">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 uppercase text-xs border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left">Nome</th>
                  <th className="px-5 py-3 text-left">E-mail</th>
                  <th className="px-5 py-3 text-left">Tipo</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.items.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/50">
                    <td className="px-5 py-4 text-white font-medium">{user.name}</td>
                    <td className="px-5 py-4 text-slate-300">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                        {typeLabels[user.type] || user.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEdit(user)} className="text-slate-500 hover:text-blue-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(user)} className="text-slate-500 hover:text-red-400 transition-colors">
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
          <p className="text-sm text-slate-400">
            Mostrando {((page - 1) * 20) + 1} – {Math.min(page * 20, data?.total ?? 0)} de {data?.total ?? 0}
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-600">Próximo</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Usuário"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-3">
          <Input label="Nome *" {...editForm.register('name', { required: true })} />
          <Input label="E-mail *" {...editForm.register('email', { required: true })} />
          <Input label="Telefone" {...editForm.register('phone')} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" {...editForm.register('type')}>
              <option value="Client">Cliente</option>
              <option value="Professional">Profissional</option>
              <option value="Owner">Proprietário</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...editForm.register('active')} className="rounded" />
            Usuário ativo
          </label>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Usuário"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Excluir Permanentemente
            </Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          Tem certeza que deseja excluir o usuário <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
          Esta ação é irreversível.
        </p>
      </Modal>
    </div>
  );
}
