import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Scissors, Sparkles, Brush, Leaf, Eye, Droplets, type LucideIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { salonsApi, servicesApi, categoriesApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { ServiceDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';

interface FormData {
  name: string;
  categoryId: number;
  description?: string;
  price: number;
  durationMinutes: number;
  active?: boolean;
  isPromotion?: boolean;
  promoPrice?: number;
  promoDescription?: string;
  promoStartDate?: string;
  promoEndDate?: string;
}

interface SubServiceFormData {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  active?: boolean;
  isPromotion?: boolean;
  promoPrice?: number;
  promoDescription?: string;
  promoStartDate?: string;
  promoEndDate?: string;
}

interface CustomCategoryFormData {
  name: string;
  description?: string;
  iconKey: string;
  baseCategoryId: number;
}

interface CustomCategory {
  id: number;
  name: string;
  description?: string;
  iconKey: string;
  baseCategoryId: number;
}

const ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'cut-outline', label: 'Tesoura', icon: Scissors },
  { key: 'brush-outline', label: 'Pincel', icon: Brush },
  { key: 'color-palette-outline', label: 'Paleta', icon: Sparkles },
  { key: 'leaf-outline', label: 'Natural', icon: Leaf },
  { key: 'sparkles-outline', label: 'Brilho', icon: Sparkles },
  { key: 'eye-outline', label: 'Olhos', icon: Eye },
  { key: 'water-outline', label: 'Hidratacao', icon: Droplets },
];

const DEFAULT_ICON_KEY = 'cut-outline';

// --- Funções de formatação de preço ---
const formatPrice = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toFixed(2).replace('.', ',');
  }
  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return '';
  return (parseFloat(cleaned) / 100).toFixed(2).replace('.', ',');
};

const unformatPrice = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
};
// --- Fim das funções de formatação de preço ---


export function AdminServices() {
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const [categoryManagerId, setCategoryManagerId] = useState<number | null>(null);
  const [createCategoryModal, setCreateCategoryModal] = useState(false);
  const [editCategoryModal, setEditCategoryModal] = useState(false);
  const [categoryIcons, setCategoryIcons] = useState<Record<number, string>>({});
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [serviceCategoryAssignments, setServiceCategoryAssignments] = useState<Record<number, number>>({});
  const [editTarget, setEditTarget] = useState<ServiceDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceDto | null>(null);
  const [editCategoryTarget, setEditCategoryTarget] = useState<CustomCategory | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CustomCategory | null>(null);
  const [relocateModal, setRelocateModal] = useState<CustomCategory | null>(null);
  const [relocateTargetId, setRelocateTargetId] = useState<number | null>(null);

  const { data: salons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits().then(r => r.data),
  });

  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  useEffect(() => {
    if (!activeSalonId) return;
    const key = `admin_service_category_icons_${activeSalonId}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      setCategoryIcons({});
      return;
    }
    try {
      setCategoryIcons(JSON.parse(saved) as Record<number, string>);
    } catch {
      setCategoryIcons({});
    }
  }, [activeSalonId]);

  useEffect(() => {
    if (!activeSalonId) return;
    const key = `admin_service_category_icons_${activeSalonId}`;
    localStorage.setItem(key, JSON.stringify(categoryIcons));
  }, [activeSalonId, categoryIcons]);

  useEffect(() => {
    if (!activeSalonId) return;
    const saved = localStorage.getItem(`admin_custom_service_categories_${activeSalonId}`);
    if (!saved) {
      setCustomCategories([]);
      return;
    }
    try {
      setCustomCategories(JSON.parse(saved) as CustomCategory[]);
    } catch {
      setCustomCategories([]);
    }
  }, [activeSalonId]);

  useEffect(() => {
    if (!activeSalonId) return;
    localStorage.setItem(`admin_custom_service_categories_${activeSalonId}`, JSON.stringify(customCategories));
  }, [activeSalonId, customCategories]);

  useEffect(() => {
    if (!activeSalonId) return;
    const saved = localStorage.getItem(`admin_service_category_assignments_${activeSalonId}`);
    if (!saved) {
      setServiceCategoryAssignments({});
      return;
    }
    try {
      setServiceCategoryAssignments(JSON.parse(saved) as Record<number, number>);
    } catch {
      setServiceCategoryAssignments({});
    }
  }, [activeSalonId]);

  useEffect(() => {
    if (!activeSalonId) return;
    localStorage.setItem(`admin_service_category_assignments_${activeSalonId}`, JSON.stringify(serviceCategoryAssignments));
  }, [activeSalonId, serviceCategoryAssignments]);

  const { data: services, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['services', activeSalonId],
    queryFn: () => servicesApi.list(activeSalonId!).then(r => r.data),
    enabled: !!activeSalonId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  });

  const subServiceForm = useForm<SubServiceFormData>({
    defaultValues: { active: true, price: 0, durationMinutes: 30, description: '' },
  });
  const createCategoryForm = useForm<CustomCategoryFormData>({
    defaultValues: { iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: 0 },
  });
  const editCategoryForm = useForm<CustomCategoryFormData>({
    defaultValues: { iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: 0 },
  });
  const editForm = useForm<FormData>();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => servicesApi.update(activeSalonId!, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.delete(activeSalonId!, id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setDeleteTarget(null);
      setServiceCategoryAssignments((current) => {
        const next = { ...current };
        delete next[deletedId];
        return next;
      });
    },
  });

  const createFromCategoryMutation = useMutation({
    mutationFn: (data: SubServiceFormData) =>
      servicesApi.create(activeSalonId!, {
        ...data,
        categoryId: categoryManager?.baseCategoryId ?? categoryManagerId!,
      }),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['services'] });
      subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' });
      if (categoryManager && categoryManager.categoryId !== categoryManager.baseCategoryId) {
        setServiceCategoryAssignments((current) => ({
          ...current,
          [response.data.id]: categoryManager.categoryId,
        }));
      }
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CustomCategoryFormData) => {
      const generatedId = -Math.floor(Date.now());
      const nextCategory: CustomCategory = {
        id: generatedId,
        name: data.name.trim(),
        description: data.description?.trim(),
        iconKey: data.iconKey,
        baseCategoryId: data.baseCategoryId,
      };
      return Promise.resolve(nextCategory);
    },
    onSuccess: (newCategory) => {
      setCustomCategories((current) => [newCategory, ...current]);
      setCategoryIcons((current) => ({ ...current, [newCategory.id]: newCategory.iconKey }));
      setCreateCategoryModal(false);
      createCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 });
      setCategoryManagerId(newCategory.id);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomCategoryFormData }) => Promise.resolve({
      id,
      name: data.name.trim(),
      description: data.description?.trim(),
      iconKey: data.iconKey,
      baseCategoryId: data.baseCategoryId,
    } as CustomCategory),
    onSuccess: (updatedCategory) => {
      setCustomCategories((current) => current.map((item) => item.id === updatedCategory.id ? updatedCategory : item));
      setCategoryIcons((current) => ({ ...current, [updatedCategory.id]: updatedCategory.iconKey }));
      setEditCategoryModal(false);
      setEditCategoryTarget(null);
      editCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (category: CustomCategory) => Promise.resolve(category),
    onSuccess: (category) => {
      setCustomCategories((current) => current.filter((item) => item.id !== category.id));
      setCategoryIcons((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
      setServiceCategoryAssignments((current) => {
        const next: Record<number, number> = {};
        for (const [serviceId, groupId] of Object.entries(current)) {
          if (Number(groupId) !== category.id) next[Number(serviceId)] = Number(groupId);
        }
        return next;
      });
      if (categoryManagerId === category.id) setCategoryManagerId(null);
      setDeleteCategoryTarget(null);
    },
  });

  const ServiceForm = ({ form, onSubmit }: { form: ReturnType<typeof useForm<FormData>>; onSubmit: (d: FormData) => void }) => {
    const priceValue = form.watch('price');
    const durationValue = form.watch('durationMinutes');

    return (
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Input label="Nome do subserviço *" error={form.formState.errors.name?.message} {...form.register('name')} />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Serviço (categoria) *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...form.register('categoryId', { valueAsNumber: true })} // Garante que categoryId seja um número
          >
            <option value="">Selecione...</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {form.formState.errors.categoryId && <p className="text-xs text-red-500 mt-1">{form.formState.errors.categoryId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Descrição do subserviço</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...form.register('description')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Preço (R$) *"
            type="text" // Alterado para text para permitir máscara
            placeholder="0,00"
            error={form.formState.errors.price?.message}
            value={formatPrice(priceValue)} // Exibe o valor formatado
            onChange={(e) => form.setValue('price', unformatPrice(e.target.value))} // Converte para número ao mudar
          />
          <Input
            label="Duração (min) *"
            type="text" // Alterado para text para permitir controle de entrada
            placeholder="Ex: 45"
            error={form.formState.errors.durationMinutes?.message}
            value={durationValue}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, ''); // Permite apenas dígitos
              form.setValue('durationMinutes', Number(cleaned));
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" {...form.register('active')} className="rounded" />
          Serviço ativo
        </label>
        <div className="border-t pt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" {...form.register('isPromotion')} className="rounded" />
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Marcar como promoção
            </span>
          </label>
          {form.watch('isPromotion') && (
            <div className="space-y-2 pl-6">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Preço promocional (R$)"
                  type="text"
                  placeholder="0,00"
                  value={formatPrice(form.watch('promoPrice') ?? 0)}
                  onChange={(e) => form.setValue('promoPrice', unformatPrice(e.target.value))}
                />
                <div />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Início" type="date" {...form.register('promoStartDate')} />
                <Input label="Fim" type="date" {...form.register('promoEndDate')} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descrição da promoção</label>
                <textarea rows={2} placeholder="Ex: Para novos clientes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...form.register('promoDescription')} />
              </div>
            </div>
          )}
        </div>
      </form>
    );
  };

  const groupedServices = useMemo(() => {
    const items = services ?? [];
    const baseGroups = (categories ?? []).map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: '',
      baseCategoryId: category.id,
      isCustom: false,
      items: [] as ServiceDto[],
    }));

    const customGroups = customCategories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: category.description || '',
      baseCategoryId: category.baseCategoryId,
      isCustom: true,
      items: [] as ServiceDto[],
    }));

    const groups = [...baseGroups, ...customGroups];
    const groupById = new Map(groups.map((group) => [group.categoryId, group]));
    const baseByCategoryId = new Map(baseGroups.map((group) => [group.baseCategoryId, group.categoryId]));

    for (const service of items) {
      const assignedGroupId = serviceCategoryAssignments[service.id];
      const assignedGroup = assignedGroupId ? groupById.get(assignedGroupId) : undefined;
      if (assignedGroup && assignedGroup.baseCategoryId === Number(service.categoryId)) {
        assignedGroup.items.push(service);
        continue;
      }

      const baseGroupId = baseByCategoryId.get(Number(service.categoryId)) ?? Number(service.categoryId);
      const fallbackGroup = groupById.get(baseGroupId);
      if (fallbackGroup) fallbackGroup.items.push(service);
    }

    return groups
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) }))
      .filter((group) => group.isCustom || group.items.length > 0)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'pt-BR'));
  }, [services, categories, customCategories, serviceCategoryAssignments]);

  const categoryManager = groupedServices.find((group) => group.categoryId === categoryManagerId) ?? null;

  const resolveCategoryIconKey = (categoryId: number) => categoryIcons[categoryId] || DEFAULT_ICON_KEY;
  const resolveCategoryIcon = (categoryId: number) =>
    ICON_OPTIONS.find((option) => option.key === resolveCategoryIconKey(categoryId)) || ICON_OPTIONS[0];

  const openCreateForCategory = (categoryId: number) => {
    setCategoryManagerId(categoryId);
    subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' });
  };

  const openCreateCategory = () => {
    createCategoryForm.reset({
      iconKey: DEFAULT_ICON_KEY,
      name: '',
      description: '',
      baseCategoryId: categories?.[0]?.id ?? 0,
    });
    setCreateCategoryModal(true);
  };

  const openEditCategory = (category: CustomCategory) => {
    setEditCategoryTarget(category);
    editCategoryForm.reset({
      name: category.name,
      description: category.description || '',
      iconKey: category.iconKey,
      baseCategoryId: category.baseCategoryId,
    });
    setEditCategoryModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <div className="mt-2 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Como funciona</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center rounded-full bg-white border border-brand-100 px-2.5 py-1 text-gray-700">
                1. Crie a categoria e escolha o ícone
              </span>
              <span className="inline-flex items-center rounded-full bg-white border border-brand-100 px-2.5 py-1 text-gray-700">
                2. Cadastre os subserviços da categoria
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openCreateCategory} size="sm">
            <Plus className="w-4 h-4" />
            Nova categoria
          </Button>
          {salons && salons.length > 0 && (
            <select value={activeSalonId ?? ''} onChange={e => handleSalonChange(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]">
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!hasUnits && (
          <div className="p-10 text-center text-gray-400">Nenhuma unidade cadastrada para exibir serviços.</div>
        )}
        {isError && (
          <div className="p-4 border-b border-gray-100">
            <ApiErrorAlert
              message={getApiErrorMessage(error, 'Falha ao carregar serviços.')}
              onRetry={() => refetch()}
            />
          </div>
        )}
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Carregando...</div>
        ) : !groupedServices.length ? (
          <div className="p-10 text-center text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma categoria criada ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedServices.map((group) => (
              <div key={group.categoryId} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                      {(() => {
                        const Icon = resolveCategoryIcon(group.categoryId).icon;
                        return <Icon className="w-4 h-4" />;
                      })()}
                    </div>
                    <div>
                    <p className="text-sm font-semibold text-gray-900">{group.categoryName}</p>
                    <p className="text-xs text-gray-500">{group.items.length} subserviço{group.items.length !== 1 ? 's' : ''}{group.isCustom ? ' • categoria criada no admin' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.isCustom && (
                      <>
                        <button onClick={() => {
                          const target = customCategories.find((item) => item.id === group.categoryId);
                          if (target) openEditCategory(target);
                        }} className="text-gray-400 hover:text-brand-600 transition-colors" title="Editar categoria">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => {
                          const target = customCategories.find((item) => item.id === group.categoryId);
                          if (!target) return;
                          if (group.items.length > 0) {
                            setRelocateModal(target);
                            setRelocateTargetId(null);
                          } else {
                            setDeleteCategoryTarget(target);
                          }
                        }} className="text-gray-400 hover:text-red-600 transition-colors" title="Excluir categoria">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openCreateForCategory(group.categoryId)}>
                      <Plus className="w-4 h-4" />
                      Gerenciar subserviços
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  {group.items.map((svc) => (
                    <div key={svc.id} className="border border-gray-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                          {svc.name}
                          {svc.isPromotion && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              <Sparkles className="w-3 h-3" /> PROMO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {svc.isPromotion && svc.promoPrice != null ? (
                            <>
                              <span className="line-through text-gray-400">{svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>{' '}
                              <span className="text-amber-700 font-semibold">{Number(svc.promoPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </>
                          ) : (
                            svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          )}
                          {' • '}{svc.durationMinutes} min
                          {svc.description ? ` • ${svc.description}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${svc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {svc.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => { setEditTarget(svc); editForm.reset({ name: svc.name, categoryId: Number(svc.categoryId), description: svc.description || '', price: svc.price, durationMinutes: svc.durationMinutes, active: svc.active, isPromotion: !!svc.isPromotion, promoPrice: svc.promoPrice ?? undefined, promoDescription: svc.promoDescription ?? '', promoStartDate: svc.promoStartDate ? svc.promoStartDate.substring(0, 10) : '', promoEndDate: svc.promoEndDate ? svc.promoEndDate.substring(0, 10) : '' }); }}
                          className="text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(svc)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); editForm.reset(); }} title="Editar Subserviço"
        footer={
          <>
            <Button variant="outline" onClick={() => { setEditTarget(null); editForm.reset(); }}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <ServiceForm form={editForm} onSubmit={d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d })} />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Subserviço"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Tem certeza que deseja excluir o subserviço <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
      </Modal>

      {categoryManager && (
      <Modal
        open
        onClose={() => { setCategoryManagerId(null); subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' }); }}
        title={`Subserviços - ${categoryManager.categoryName}`}
        footer={<Button variant="outline" onClick={() => { setCategoryManagerId(null); subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' }); }}>Fechar</Button>}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-brand-600 border border-brand-100 flex items-center justify-center">
              {(() => {
                const Icon = resolveCategoryIcon(categoryManager.categoryId).icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{categoryManager.categoryName}</p>
              <p className="text-xs text-gray-600">Defina o icone e cadastre os itens desta categoria.</p>
            </div>
          </div>

          <form
            className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white"
            onSubmit={subServiceForm.handleSubmit((data) => createFromCategoryMutation.mutate(data))}
          >
            {categoryManager.isCustom ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Icone representativo</p>
                <p className="text-xs text-gray-500 mb-2">Escolha o icone que melhor representa esta categoria.</p>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = resolveCategoryIconKey(categoryManager.categoryId) === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setCategoryIcons((current) => ({ ...current, [categoryManager.categoryId]: option.key }))}
                        className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Categoria base da API (importada). Para personalizar igual ao app, crie uma nova categoria.</p>
            )}

            <div className="pt-1">
              <p className="text-sm font-medium text-gray-900">Adicionar novo subserviço</p>
              <p className="text-xs text-gray-500">Cadastre nome, preco e tempo estimado do item.</p>
            </div>
            <Input label="Nome do subserviço *" {...subServiceForm.register('name')} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço (R$) *"
                type="text" // Alterado para text para permitir máscara
                placeholder="Ex: 59,90"
                value={formatPrice(subServiceForm.watch('price'))} // Exibe o valor formatado
                onChange={(e) => subServiceForm.setValue('price', unformatPrice(e.target.value))} // Converte para número ao mudar
              />
              <Input
                label="Duração (min) *"
                type="text" // Alterado para text para permitir controle de entrada
                placeholder="Ex: 45"
                value={subServiceForm.watch('durationMinutes')}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, ''); // Permite apenas dígitos
                  subServiceForm.setValue('durationMinutes', Number(cleaned));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
              <textarea rows={2} placeholder="Ex: Indicado para cabelos curtos e medios." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...subServiceForm.register('description')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" {...subServiceForm.register('active')} className="rounded" />
              Subserviço ativo
            </label>
            <div className="border-t pt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" {...subServiceForm.register('isPromotion')} className="rounded" />
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Marcar como promoção
                </span>
              </label>
              {subServiceForm.watch('isPromotion') && (
                <div className="space-y-2 pl-6">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Preço promocional (R$)"
                      type="text"
                      placeholder="0,00"
                      value={formatPrice(subServiceForm.watch('promoPrice') ?? 0)}
                      onChange={(e) => subServiceForm.setValue('promoPrice', unformatPrice(e.target.value))}
                    />
                    <div />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Início" type="date" {...subServiceForm.register('promoStartDate')} />
                    <Input label="Fim" type="date" {...subServiceForm.register('promoEndDate')} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Descrição da promoção</label>
                    <textarea rows={2} placeholder="Ex: Para novos clientes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...subServiceForm.register('promoDescription')} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button loading={createFromCategoryMutation.isPending} type="submit" size="sm">
                <Plus className="w-4 h-4" />
                Adicionar item a categoria
              </Button>
            </div>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs text-gray-500">Itens cadastrados nesta categoria</p>
            {categoryManager?.items.map((svc) => (
              <div key={svc.id} className="border border-gray-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3 hover:bg-gray-50/70">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{svc.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {svc.durationMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditTarget(svc); editForm.reset({ name: svc.name, categoryId: Number(svc.categoryId), description: svc.description || '', price: svc.price, durationMinutes: svc.durationMinutes, active: svc.active }); }}
                    className="text-gray-400 hover:text-brand-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(svc)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {!categoryManager?.items.length && (
              <p className="text-sm text-gray-400 text-center py-3">Nenhum subserviço nesta categoria ainda.</p>
            )}
          </div>
        </div>
      </Modal>
      )}

      <Modal
        open={createCategoryModal}
        onClose={() => { setCreateCategoryModal(false); createCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 }); }}
        title="Nova categoria de servico"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreateCategoryModal(false); createCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 }); }}>Cancelar</Button>
            <Button loading={createCategoryMutation.isPending} onClick={createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))}>Criar categoria</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))}>
          <Input label="Nome da categoria *" placeholder="Ex: Estetica facial" {...createCategoryForm.register('name')} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descricao</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...createCategoryForm.register('description')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Icone</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = createCategoryForm.watch('iconKey') === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => createCategoryForm.setValue('iconKey', option.key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria base da API *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={createCategoryForm.watch('baseCategoryId')}
              onChange={(e) => createCategoryForm.setValue('baseCategoryId', Number(e.target.value))}
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">No app, a categoria e visual; o envio para API usa uma categoria base.</p>
          </div>
        </form>
      </Modal>

      <Modal
        open={editCategoryModal}
        onClose={() => { setEditCategoryModal(false); setEditCategoryTarget(null); editCategoryForm.reset(); }}
        title="Editar categoria"
        footer={
          <>
            <Button variant="outline" onClick={() => { setEditCategoryModal(false); setEditCategoryTarget(null); editCategoryForm.reset(); }}>Cancelar</Button>
            <Button loading={updateCategoryMutation.isPending} onClick={editCategoryForm.handleSubmit((data) => editCategoryTarget && updateCategoryMutation.mutate({ id: editCategoryTarget.id, data }))}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={editCategoryForm.handleSubmit((data) => editCategoryTarget && updateCategoryMutation.mutate({ id: editCategoryTarget.id, data }))}>
          <Input label="Nome da categoria *" placeholder="Ex: Estetica facial" {...editCategoryForm.register('name')} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descricao</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...editCategoryForm.register('description')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Icone</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = editCategoryForm.watch('iconKey') === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => editCategoryForm.setValue('iconKey', option.key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria base da API *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={editCategoryForm.watch('baseCategoryId')}
              onChange={(e) => editCategoryForm.setValue('baseCategoryId', Number(e.target.value))}
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">No app, a categoria e visual; o envio para API usa uma categoria base.</p>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!relocateModal}
        onClose={() => { setRelocateModal(null); setRelocateTargetId(null); }}
        title="Categoria com subserviços"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRelocateModal(null); setRelocateTargetId(null); }}>Cancelar</Button>
            <Button
              variant="danger"
              disabled={!relocateTargetId}
              onClick={() => {
                if (!relocateModal || !relocateTargetId) return;
                const affectedServices = groupedServices.find((g) => g.categoryId === relocateModal.id)?.items ?? [];
                setServiceCategoryAssignments((current) => {
                  const next = { ...current };
                  for (const svc of affectedServices) next[svc.id] = relocateTargetId;
                  return next;
                });
                deleteCategoryMutation.mutate(relocateModal);
                setRelocateModal(null);
                setRelocateTargetId(null);
              }}
            >
              Mover e excluir
            </Button>
          </>
        }
      >
        {relocateModal && (() => {
          const affectedServices = groupedServices.find((g) => g.categoryId === relocateModal.id)?.items ?? [];
          const availableTargets = groupedServices.filter((g) => g.categoryId !== relocateModal.id);
          return (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800">
                <p className="font-semibold mb-1">Esta categoria possui {affectedServices.length} subserviço{affectedServices.length !== 1 ? 's' : ''}.</p>
                <p className="text-xs">Antes de excluir, escolha para qual categoria deseja mover os itens abaixo.</p>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                {affectedServices.map((svc) => (
                  <p key={svc.id} className="text-xs text-gray-700 truncate">• {svc.name}</p>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mover para a categoria *</label>
                <select
                  value={relocateTargetId ?? ''}
                  onChange={(e) => setRelocateTargetId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione uma categoria...</option>
                  {availableTargets.map((g) => (
                    <option key={g.categoryId} value={g.categoryId}>{g.categoryName}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        open={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        title="Excluir categoria"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteCategoryTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteCategoryMutation.isPending} onClick={() => deleteCategoryTarget && deleteCategoryMutation.mutate(deleteCategoryTarget)}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Tem certeza que deseja excluir a categoria <strong>{deleteCategoryTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
