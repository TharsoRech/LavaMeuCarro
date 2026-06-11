import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { masterCategoriesApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { CategoryDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

interface CategoryForm { name: string; iconUrl?: string; }

function CategoryIcon({ iconUrl, name }: { iconUrl?: string; name: string }) {
  const [error, setError] = useState(false);
  if (iconUrl && !error) {
    return <img src={iconUrl} alt={name} className="w-8 h-8 rounded-lg object-cover" onError={() => setError(true)} />;
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
      <Tag className="w-4 h-4 text-slate-400" />
    </div>
  );
}

export function MasterCategories() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);

  const { data: categories, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-categories'],
    queryFn: () => masterCategoriesApi.list().then(r => r.data),
  });

  const createForm = useForm<CategoryForm>();
  const editForm = useForm<CategoryForm>();

  const createMutation = useMutation({
    mutationFn: (d: CategoryForm) => masterCategoriesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-categories'] }); setCreateModal(false); createForm.reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryForm }) => masterCategoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-categories'] }); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterCategoriesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-categories'] }); setDeleteTarget(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-slate-400 text-sm">Gerencie as categorias de serviços da plataforma.</p>
        </div>
        <Button onClick={() => setCreateModal(true)} size="sm" className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isError && (
          <div className="p-4 border-b border-slate-700">
            <ApiErrorAlert
              dark
              message={getApiErrorMessage(error, 'Falha ao carregar categorias.')}
              onRetry={() => refetch()}
            />
          </div>
        )}
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Carregando...</div>
        ) : !categories?.length ? (
          <div className="p-10 text-center text-slate-500">Nenhuma categoria cadastrada.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <CategoryIcon iconUrl={cat.iconUrl} name={cat.name} />
                  <div>
                    <p className="font-medium text-white">{cat.name}</p>
                    <span className={`text-xs ${cat.active ? 'text-green-400' : 'text-slate-500'}`}>
                      {cat.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setEditTarget(cat); editForm.reset({ name: cat.name, iconUrl: cat.iconUrl || '' }); }} className="text-slate-500 hover:text-blue-400 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(cat)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={createModal} onClose={() => { setCreateModal(false); createForm.reset(); }} title="Nova Categoria"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreateModal(false); createForm.reset(); }}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={createForm.handleSubmit(d => createMutation.mutate(d))}>Criar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Nome *" {...createForm.register('name', { required: true })} />
          <Input label="URL do ícone" placeholder="https://..." {...createForm.register('iconUrl')} />
          {createForm.watch('iconUrl') && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Pré-visualização:</span>
              <CategoryIcon iconUrl={createForm.watch('iconUrl')} name="preview" />
            </div>
          )}
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); editForm.reset(); }} title="Editar Categoria"
        footer={
          <>
            <Button variant="outline" onClick={() => { setEditTarget(null); editForm.reset(); }}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Nome *" {...editForm.register('name', { required: true })} />
          <Input label="URL do ícone" {...editForm.register('iconUrl')} />
          {editForm.watch('iconUrl') && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Pré-visualização:</span>
              <CategoryIcon iconUrl={editForm.watch('iconUrl')} name="preview" />
            </div>
          )}
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Categoria"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Excluir a categoria <strong>{deleteTarget?.name}</strong>? Serviços vinculados podem ser afetados.</p>
      </Modal>
    </div>
  );
}

