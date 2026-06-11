import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { masterPlansApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { PlanDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

interface PlanForm {
  name: string;
  description?: string;
  price: number;
  periodDays: number;
  appointmentLimit: number;
  active: boolean;
}

export function MasterPlans() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PlanDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlanDto | null>(null);
  const createForm = useForm<PlanForm>({ defaultValues: { active: true, price: 0, periodDays: 30, appointmentLimit: 0 } });
  const editForm = useForm<PlanForm>();

  const { data: plans, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-plans'],
    queryFn: () => masterPlansApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: PlanForm) => masterPlansApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-plans'] }); setCreateModal(false); createForm.reset({ active: true, price: 0, periodDays: 30, appointmentLimit: 0 }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlanForm }) => masterPlansApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-plans'] }); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterPlansApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-plans'] }); setDeleteTarget(null); },
  });

  const openEdit = (plan: PlanDto) => {
    setEditTarget(plan);
    editForm.reset({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      periodDays: plan.periodDays,
      appointmentLimit: plan.appointmentLimit,
      active: plan.active,
    });
  };

  const PlanFormFields = ({ form }: { form: ReturnType<typeof useForm<PlanForm>> }) => (
    <div className="space-y-3">
      <Input label="Nome *" {...form.register('name', { required: true })} />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
        <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" {...form.register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Preço (R$) *" type="number" step="0.01" {...form.register('price')} />
        <Input label="Período (dias) *" type="number" {...form.register('periodDays')} />
      </div>
      <Input label="Limite de agendamentos" type="number" {...form.register('appointmentLimit')} />
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" {...form.register('active')} className="rounded" />
          Ativo
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-slate-400 text-sm">Gerencie os planos disponíveis na plataforma.</p>
        </div>
        <Button onClick={() => setCreateModal(true)} size="sm" className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      {isLoading && <p className="text-slate-400">Carregando...</p>}

      {isError && (
        <ApiErrorAlert
          dark
          message={getApiErrorMessage(error, 'Falha ao carregar planos.')}
          onRetry={() => refetch()}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map(plan => (
          <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{plan.name}</h3>
                {plan.price === 0 && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full font-medium">Trial</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(plan)} className="text-slate-500 hover:text-blue-400 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(plan)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {plan.description && <p className="text-slate-400 text-sm mb-4">{plan.description}</p>}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Preço</span>
                <span className="text-white font-semibold">{plan.price === 0 ? 'Grátis' : plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duração</span>
                <span className="text-white">{plan.periodDays} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Limite de agendamentos</span>
                <span className="text-white">{plan.appointmentLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={plan.active ? 'text-green-400' : 'text-slate-500'}>{plan.active ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Plano"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={createForm.handleSubmit(d => createMutation.mutate(d))}>Criar</Button>
          </>
        }
      >
        <PlanFormFields form={createForm} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Plano"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <PlanFormFields form={editForm} />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Plano"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Excluir o plano <strong>{deleteTarget?.name}</strong>? Assinaturas vinculadas podem ser afetadas.</p>
      </Modal>
    </div>
  );
}
