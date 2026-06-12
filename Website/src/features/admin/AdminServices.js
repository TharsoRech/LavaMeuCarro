import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Scissors, Sparkles, Brush, Leaf, Eye, Droplets } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { salonsApi, servicesApi, categoriesApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
const ICON_OPTIONS = [
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
const formatPrice = (value) => {
    if (typeof value === 'number') {
        return value.toFixed(2).replace('.', ',');
    }
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned)
        return '';
    return (parseFloat(cleaned) / 100).toFixed(2).replace('.', ',');
};
const unformatPrice = (value) => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
};
// --- Fim das funções de formatação de preço ---
export function AdminServices() {
    const qc = useQueryClient();
    const { user } = useAdminAuth();
    const [categoryManagerId, setCategoryManagerId] = useState(null);
    const [createCategoryModal, setCreateCategoryModal] = useState(false);
    const [editCategoryModal, setEditCategoryModal] = useState(false);
    const [categoryIcons, setCategoryIcons] = useState({});
    const [customCategories, setCustomCategories] = useState([]);
    const [serviceCategoryAssignments, setServiceCategoryAssignments] = useState({});
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editCategoryTarget, setEditCategoryTarget] = useState(null);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
    const [relocateModal, setRelocateModal] = useState(null);
    const [relocateTargetId, setRelocateTargetId] = useState(null);
    const { data: salons } = useQuery({
        queryKey: ['my-units'],
        queryFn: () => salonsApi.myUnits().then(r => r.data),
    });
    // LavaMeuCarro: simplified - no salon selection needed
    const activeSalonId = null;
    const hasUnits = false;
    const handleSalonChange = (_id) => { };
    useEffect(() => {
        if (!activeSalonId)
            return;
        const key = `admin_service_category_icons_${activeSalonId}`;
        const saved = localStorage.getItem(key);
        if (!saved) {
            setCategoryIcons({});
            return;
        }
        try {
            setCategoryIcons(JSON.parse(saved));
        }
        catch {
            setCategoryIcons({});
        }
    }, [activeSalonId]);
    useEffect(() => {
        if (!activeSalonId)
            return;
        const key = `admin_service_category_icons_${activeSalonId}`;
        localStorage.setItem(key, JSON.stringify(categoryIcons));
    }, [activeSalonId, categoryIcons]);
    useEffect(() => {
        if (!activeSalonId)
            return;
        const saved = localStorage.getItem(`admin_custom_service_categories_${activeSalonId}`);
        if (!saved) {
            setCustomCategories([]);
            return;
        }
        try {
            setCustomCategories(JSON.parse(saved));
        }
        catch {
            setCustomCategories([]);
        }
    }, [activeSalonId]);
    useEffect(() => {
        if (!activeSalonId)
            return;
        localStorage.setItem(`admin_custom_service_categories_${activeSalonId}`, JSON.stringify(customCategories));
    }, [activeSalonId, customCategories]);
    useEffect(() => {
        if (!activeSalonId)
            return;
        const saved = localStorage.getItem(`admin_service_category_assignments_${activeSalonId}`);
        if (!saved) {
            setServiceCategoryAssignments({});
            return;
        }
        try {
            setServiceCategoryAssignments(JSON.parse(saved));
        }
        catch {
            setServiceCategoryAssignments({});
        }
    }, [activeSalonId]);
    useEffect(() => {
        if (!activeSalonId)
            return;
        localStorage.setItem(`admin_service_category_assignments_${activeSalonId}`, JSON.stringify(serviceCategoryAssignments));
    }, [activeSalonId, serviceCategoryAssignments]);
    const { data: services, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['services', activeSalonId],
        queryFn: () => servicesApi.list(activeSalonId).then(r => r.data),
        enabled: !!activeSalonId,
    });
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.list().then(r => r.data),
    });
    const subServiceForm = useForm({
        defaultValues: { active: true, price: 0, durationMinutes: 30, description: '' },
    });
    const createCategoryForm = useForm({
        defaultValues: { iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: 0 },
    });
    const editCategoryForm = useForm({
        defaultValues: { iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: 0 },
    });
    const editForm = useForm();
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => servicesApi.update(activeSalonId, id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setEditTarget(null); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => servicesApi.delete(activeSalonId, id),
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
        mutationFn: (data) => servicesApi.create(activeSalonId, {
            ...data,
            categoryId: categoryManager?.baseCategoryId ?? categoryManagerId,
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
        mutationFn: (data) => {
            const generatedId = -Math.floor(Date.now());
            const nextCategory = {
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
        mutationFn: ({ id, data }) => Promise.resolve({
            id,
            name: data.name.trim(),
            description: data.description?.trim(),
            iconKey: data.iconKey,
            baseCategoryId: data.baseCategoryId,
        }),
        onSuccess: (updatedCategory) => {
            setCustomCategories((current) => current.map((item) => item.id === updatedCategory.id ? updatedCategory : item));
            setCategoryIcons((current) => ({ ...current, [updatedCategory.id]: updatedCategory.iconKey }));
            setEditCategoryModal(false);
            setEditCategoryTarget(null);
            editCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 });
        },
    });
    const deleteCategoryMutation = useMutation({
        mutationFn: (category) => Promise.resolve(category),
        onSuccess: (category) => {
            setCustomCategories((current) => current.filter((item) => item.id !== category.id));
            setCategoryIcons((current) => {
                const next = { ...current };
                delete next[category.id];
                return next;
            });
            setServiceCategoryAssignments((current) => {
                const next = {};
                for (const [serviceId, groupId] of Object.entries(current)) {
                    if (Number(groupId) !== category.id)
                        next[Number(serviceId)] = Number(groupId);
                }
                return next;
            });
            if (categoryManagerId === category.id)
                setCategoryManagerId(null);
            setDeleteCategoryTarget(null);
        },
    });
    const ServiceForm = ({ form, onSubmit }) => {
        const priceValue = form.watch('price');
        const durationValue = form.watch('durationMinutes');
        return (_jsxs("form", { className: "space-y-4", onSubmit: form.handleSubmit(onSubmit), children: [_jsx(Input, { label: "Nome do subservi\u00E7o *", error: form.formState.errors.name?.message, ...form.register('name') }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Servi\u00E7o (categoria) *" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500", ...form.register('categoryId', { valueAsNumber: true }), children: [_jsx("option", { value: "", children: "Selecione..." }), categories?.map(c => _jsx("option", { value: c.id, children: c.name }, c.id))] }), form.formState.errors.categoryId && _jsx("p", { className: "text-xs text-red-500 mt-1", children: form.formState.errors.categoryId.message })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descri\u00E7\u00E3o do subservi\u00E7o" }), _jsx("textarea", { rows: 2, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...form.register('description') })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Pre\u00E7o (R$) *", type: "text" // Alterado para text para permitir máscara
                            , placeholder: "0,00", error: form.formState.errors.price?.message, value: formatPrice(priceValue), onChange: (e) => form.setValue('price', unformatPrice(e.target.value)) }), _jsx(Input, { label: "Dura\u00E7\u00E3o (min) *", type: "text" // Alterado para text para permitir controle de entrada
                            , placeholder: "Ex: 45", error: form.formState.errors.durationMinutes?.message, value: durationValue, onChange: (e) => {
                                const cleaned = e.target.value.replace(/\D/g, ''); // Permite apenas dígitos
                                form.setValue('durationMinutes', Number(cleaned));
                            } })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...form.register('active'), className: "rounded" }), "Servi\u00E7o ativo"] }), _jsxs("div", { className: "border-t pt-3 space-y-2", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...form.register('isPromotion'), className: "rounded" }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Sparkles, { className: "w-4 h-4 text-amber-500" }), "Marcar como promo\u00E7\u00E3o"] })] }), form.watch('isPromotion') && (_jsxs("div", { className: "space-y-2 pl-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Pre\u00E7o promocional (R$)", type: "text", placeholder: "0,00", value: formatPrice(form.watch('promoPrice') ?? 0), onChange: (e) => form.setValue('promoPrice', unformatPrice(e.target.value)) }), _jsx("div", {})] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "In\u00EDcio", type: "date", ...form.register('promoStartDate') }), _jsx(Input, { label: "Fim", type: "date", ...form.register('promoEndDate') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descri\u00E7\u00E3o da promo\u00E7\u00E3o" }), _jsx("textarea", { rows: 2, placeholder: "Ex: Para novos clientes", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...form.register('promoDescription') })] })] }))] })] }));
    };
    const groupedServices = useMemo(() => {
        const items = services ?? [];
        const baseGroups = (categories ?? []).map((category) => ({
            categoryId: category.id,
            categoryName: category.name,
            categoryDescription: '',
            baseCategoryId: category.id,
            isCustom: false,
            items: [],
        }));
        const customGroups = customCategories.map((category) => ({
            categoryId: category.id,
            categoryName: category.name,
            categoryDescription: category.description || '',
            baseCategoryId: category.baseCategoryId,
            isCustom: true,
            items: [],
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
            if (fallbackGroup)
                fallbackGroup.items.push(service);
        }
        return groups
            .map((group) => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) }))
            .filter((group) => group.isCustom || group.items.length > 0)
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'pt-BR'));
    }, [services, categories, customCategories, serviceCategoryAssignments]);
    const categoryManager = groupedServices.find((group) => group.categoryId === categoryManagerId) ?? null;
    const resolveCategoryIconKey = (categoryId) => categoryIcons[categoryId] || DEFAULT_ICON_KEY;
    const resolveCategoryIcon = (categoryId) => ICON_OPTIONS.find((option) => option.key === resolveCategoryIconKey(categoryId)) || ICON_OPTIONS[0];
    const openCreateForCategory = (categoryId) => {
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
    const openEditCategory = (category) => {
        setEditCategoryTarget(category);
        editCategoryForm.reset({
            name: category.name,
            description: category.description || '',
            iconKey: category.iconKey,
            baseCategoryId: category.baseCategoryId,
        });
        setEditCategoryModal(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Servi\u00E7os" }), _jsxs("div", { className: "mt-2 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2", children: [_jsx("p", { className: "text-xs font-semibold text-brand-700 uppercase tracking-wide", children: "Como funciona" }), _jsxs("div", { className: "mt-1 flex flex-wrap gap-2 text-xs", children: [_jsx("span", { className: "inline-flex items-center rounded-full bg-white border border-brand-100 px-2.5 py-1 text-gray-700", children: "1. Crie a categoria e escolha o \u00EDcone" }), _jsx("span", { className: "inline-flex items-center rounded-full bg-white border border-brand-100 px-2.5 py-1 text-gray-700", children: "2. Cadastre os subservi\u00E7os da categoria" })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "outline", onClick: openCreateCategory, size: "sm", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nova categoria"] }), salons && salons.length > 0 && (_jsx("select", { value: activeSalonId ?? '', onChange: e => handleSalonChange(Number(e.target.value)), className: "border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]", children: salons.map(s => _jsx("option", { value: s.id, children: s.name }, s.id)) }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [!hasUnits && (_jsx("div", { className: "p-10 text-center text-gray-400", children: "Nenhuma unidade cadastrada para exibir servi\u00E7os." })), isError && (_jsx("div", { className: "p-4 border-b border-gray-100", children: _jsx(ApiErrorAlert, { message: getApiErrorMessage(error, 'Falha ao carregar serviços.'), onRetry: () => refetch() }) })), isLoading ? (_jsx("div", { className: "p-10 text-center text-gray-400", children: "Carregando..." })) : !groupedServices.length ? (_jsxs("div", { className: "p-10 text-center text-gray-400", children: [_jsx(Search, { className: "w-8 h-8 mx-auto mb-2 opacity-40" }), "Nenhuma categoria criada ainda."] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: groupedServices.map((group) => (_jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center", children: (() => {
                                                        const Icon = resolveCategoryIcon(group.categoryId).icon;
                                                        return _jsx(Icon, { className: "w-4 h-4" });
                                                    })() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-900", children: group.categoryName }), _jsxs("p", { className: "text-xs text-gray-500", children: [group.items.length, " subservi\u00E7o", group.items.length !== 1 ? 's' : '', group.isCustom ? ' • categoria criada no admin' : ''] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [group.isCustom && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => {
                                                                const target = customCategories.find((item) => item.id === group.categoryId);
                                                                if (target)
                                                                    openEditCategory(target);
                                                            }, className: "text-gray-400 hover:text-brand-600 transition-colors", title: "Editar categoria", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                                const target = customCategories.find((item) => item.id === group.categoryId);
                                                                if (!target)
                                                                    return;
                                                                if (group.items.length > 0) {
                                                                    setRelocateModal(target);
                                                                    setRelocateTargetId(null);
                                                                }
                                                                else {
                                                                    setDeleteCategoryTarget(target);
                                                                }
                                                            }, className: "text-gray-400 hover:text-red-600 transition-colors", title: "Excluir categoria", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => openCreateForCategory(group.categoryId), children: [_jsx(Plus, { className: "w-4 h-4" }), "Gerenciar subservi\u00E7os"] })] })] }), _jsx("div", { className: "grid gap-2", children: group.items.map((svc) => (_jsxs("div", { className: "border border-gray-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "font-medium text-sm text-gray-900 truncate flex items-center gap-2", children: [svc.name, svc.isPromotion && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700", children: [_jsx(Sparkles, { className: "w-3 h-3" }), " PROMO"] }))] }), _jsxs("p", { className: "text-xs text-gray-500 truncate", children: [svc.isPromotion && svc.promoPrice != null ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "line-through text-gray-400", children: svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }), ' ', _jsx("span", { className: "text-amber-700 font-semibold", children: Number(svc.promoPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })] })) : (svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })), ' • ', svc.durationMinutes, " min", svc.description ? ` • ${svc.description}` : ''] })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${svc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`, children: svc.active ? 'Ativo' : 'Inativo' }), _jsx("button", { onClick: () => { setEditTarget(svc); editForm.reset({ name: svc.name, categoryId: Number(svc.categoryId), description: svc.description || '', price: svc.price, durationMinutes: svc.durationMinutes, active: svc.active, isPromotion: !!svc.isPromotion, promoPrice: svc.promoPrice ?? undefined, promoDescription: svc.promoDescription ?? '', promoStartDate: svc.promoStartDate ? svc.promoStartDate.substring(0, 10) : '', promoEndDate: svc.promoEndDate ? svc.promoEndDate.substring(0, 10) : '' }); }, className: "text-gray-400 hover:text-brand-600 transition-colors", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteTarget(svc), className: "text-gray-400 hover:text-red-600 transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, svc.id))) })] }, group.categoryId))) }))] }), _jsx(Modal, { open: !!editTarget, onClose: () => { setEditTarget(null); editForm.reset(); }, title: "Editar Subservi\u00E7o", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setEditTarget(null); editForm.reset(); }, children: "Cancelar" }), _jsx(Button, { loading: updateMutation.isPending, onClick: editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d })), children: "Salvar" })] }), children: _jsx(ServiceForm, { form: editForm, onSubmit: d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }) }) }), _jsx(Modal, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), title: "Excluir Subservi\u00E7o", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteTarget(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", loading: deleteMutation.isPending, onClick: () => deleteTarget && deleteMutation.mutate(deleteTarget.id), children: "Excluir" })] }), children: _jsxs("p", { className: "text-gray-600 text-sm", children: ["Tem certeza que deseja excluir o subservi\u00E7o ", _jsx("strong", { children: deleteTarget?.name }), "? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita."] }) }), categoryManager && (_jsx(Modal, { open: true, onClose: () => { setCategoryManagerId(null); subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' }); }, title: `Subserviços - ${categoryManager.categoryName}`, footer: _jsx(Button, { variant: "outline", onClick: () => { setCategoryManagerId(null); subServiceForm.reset({ active: true, price: 0, durationMinutes: 30, description: '' }); }, children: "Fechar" }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-white text-brand-600 border border-brand-100 flex items-center justify-center", children: (() => {
                                        const Icon = resolveCategoryIcon(categoryManager.categoryId).icon;
                                        return _jsx(Icon, { className: "w-4 h-4" });
                                    })() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-900", children: categoryManager.categoryName }), _jsx("p", { className: "text-xs text-gray-600", children: "Defina o icone e cadastre os itens desta categoria." })] })] }), _jsxs("form", { className: "space-y-3 border border-gray-200 rounded-xl p-4 bg-white", onSubmit: subServiceForm.handleSubmit((data) => createFromCategoryMutation.mutate(data)), children: [categoryManager.isCustom ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900 mb-1", children: "Icone representativo" }), _jsx("p", { className: "text-xs text-gray-500 mb-2", children: "Escolha o icone que melhor representa esta categoria." }), _jsx("div", { className: "flex flex-wrap gap-2", children: ICON_OPTIONS.map((option) => {
                                                const Icon = option.icon;
                                                const selected = resolveCategoryIconKey(categoryManager.categoryId) === option.key;
                                                return (_jsxs("button", { type: "button", onClick: () => setCategoryIcons((current) => ({ ...current, [categoryManager.categoryId]: option.key })), className: `px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), option.label] }, option.key));
                                            }) })] })) : (_jsx("p", { className: "text-xs text-gray-500", children: "Categoria base da API (importada). Para personalizar igual ao app, crie uma nova categoria." })), _jsxs("div", { className: "pt-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Adicionar novo subservi\u00E7o" }), _jsx("p", { className: "text-xs text-gray-500", children: "Cadastre nome, preco e tempo estimado do item." })] }), _jsx(Input, { label: "Nome do subservi\u00E7o *", ...subServiceForm.register('name') }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Pre\u00E7o (R$) *", type: "text" // Alterado para text para permitir máscara
                                            , placeholder: "Ex: 59,90", value: formatPrice(subServiceForm.watch('price')), onChange: (e) => subServiceForm.setValue('price', unformatPrice(e.target.value)) }), _jsx(Input, { label: "Dura\u00E7\u00E3o (min) *", type: "text" // Alterado para text para permitir controle de entrada
                                            , placeholder: "Ex: 45", value: subServiceForm.watch('durationMinutes'), onChange: (e) => {
                                                const cleaned = e.target.value.replace(/\D/g, ''); // Permite apenas dígitos
                                                subServiceForm.setValue('durationMinutes', Number(cleaned));
                                            } })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { rows: 2, placeholder: "Ex: Indicado para cabelos curtos e medios.", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...subServiceForm.register('description') })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...subServiceForm.register('active'), className: "rounded" }), "Subservi\u00E7o ativo"] }), _jsxs("div", { className: "border-t pt-3 space-y-2", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...subServiceForm.register('isPromotion'), className: "rounded" }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Sparkles, { className: "w-4 h-4 text-amber-500" }), "Marcar como promo\u00E7\u00E3o"] })] }), subServiceForm.watch('isPromotion') && (_jsxs("div", { className: "space-y-2 pl-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Pre\u00E7o promocional (R$)", type: "text", placeholder: "0,00", value: formatPrice(subServiceForm.watch('promoPrice') ?? 0), onChange: (e) => subServiceForm.setValue('promoPrice', unformatPrice(e.target.value)) }), _jsx("div", {})] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "In\u00EDcio", type: "date", ...subServiceForm.register('promoStartDate') }), _jsx(Input, { label: "Fim", type: "date", ...subServiceForm.register('promoEndDate') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descri\u00E7\u00E3o da promo\u00E7\u00E3o" }), _jsx("textarea", { rows: 2, placeholder: "Ex: Para novos clientes", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...subServiceForm.register('promoDescription') })] })] }))] }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { loading: createFromCategoryMutation.isPending, type: "submit", size: "sm", children: [_jsx(Plus, { className: "w-4 h-4" }), "Adicionar item a categoria"] }) })] }), _jsxs("div", { className: "space-y-2 max-h-72 overflow-y-auto pr-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Itens cadastrados nesta categoria" }), categoryManager?.items.map((svc) => (_jsxs("div", { className: "border border-gray-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3 hover:bg-gray-50/70", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-medium text-sm text-gray-900 truncate", children: svc.name }), _jsxs("p", { className: "text-xs text-gray-500 truncate", children: [svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), " \u2022 ", svc.durationMinutes, " min"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => { setEditTarget(svc); editForm.reset({ name: svc.name, categoryId: Number(svc.categoryId), description: svc.description || '', price: svc.price, durationMinutes: svc.durationMinutes, active: svc.active }); }, className: "text-gray-400 hover:text-brand-600 transition-colors", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteTarget(svc), className: "text-gray-400 hover:text-red-600 transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, svc.id))), !categoryManager?.items.length && (_jsx("p", { className: "text-sm text-gray-400 text-center py-3", children: "Nenhum subservi\u00E7o nesta categoria ainda." }))] })] }) })), _jsx(Modal, { open: createCategoryModal, onClose: () => { setCreateCategoryModal(false); createCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 }); }, title: "Nova categoria de servico", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setCreateCategoryModal(false); createCategoryForm.reset({ iconKey: DEFAULT_ICON_KEY, name: '', description: '', baseCategoryId: categories?.[0]?.id ?? 0 }); }, children: "Cancelar" }), _jsx(Button, { loading: createCategoryMutation.isPending, onClick: createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data)), children: "Criar categoria" })] }), children: _jsxs("form", { className: "space-y-4", onSubmit: createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data)), children: [_jsx(Input, { label: "Nome da categoria *", placeholder: "Ex: Estetica facial", ...createCategoryForm.register('name') }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descricao" }), _jsx("textarea", { rows: 2, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...createCategoryForm.register('description') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Icone" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ICON_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const selected = createCategoryForm.watch('iconKey') === option.key;
                                        return (_jsxs("button", { type: "button", onClick: () => createCategoryForm.setValue('iconKey', option.key), className: `px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), option.label] }, option.key));
                                    }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Categoria base da API *" }), _jsx("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500", value: createCategoryForm.watch('baseCategoryId'), onChange: (e) => createCategoryForm.setValue('baseCategoryId', Number(e.target.value)), children: categories?.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "No app, a categoria e visual; o envio para API usa uma categoria base." })] })] }) }), _jsx(Modal, { open: editCategoryModal, onClose: () => { setEditCategoryModal(false); setEditCategoryTarget(null); editCategoryForm.reset(); }, title: "Editar categoria", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setEditCategoryModal(false); setEditCategoryTarget(null); editCategoryForm.reset(); }, children: "Cancelar" }), _jsx(Button, { loading: updateCategoryMutation.isPending, onClick: editCategoryForm.handleSubmit((data) => editCategoryTarget && updateCategoryMutation.mutate({ id: editCategoryTarget.id, data })), children: "Salvar" })] }), children: _jsxs("form", { className: "space-y-4", onSubmit: editCategoryForm.handleSubmit((data) => editCategoryTarget && updateCategoryMutation.mutate({ id: editCategoryTarget.id, data })), children: [_jsx(Input, { label: "Nome da categoria *", placeholder: "Ex: Estetica facial", ...editCategoryForm.register('name') }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descricao" }), _jsx("textarea", { rows: 2, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...editCategoryForm.register('description') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Icone" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ICON_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const selected = editCategoryForm.watch('iconKey') === option.key;
                                        return (_jsxs("button", { type: "button", onClick: () => editCategoryForm.setValue('iconKey', option.key), className: `px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), option.label] }, option.key));
                                    }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Categoria base da API *" }), _jsx("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500", value: editCategoryForm.watch('baseCategoryId'), onChange: (e) => editCategoryForm.setValue('baseCategoryId', Number(e.target.value)), children: categories?.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "No app, a categoria e visual; o envio para API usa uma categoria base." })] })] }) }), _jsx(Modal, { open: !!relocateModal, onClose: () => { setRelocateModal(null); setRelocateTargetId(null); }, title: "Categoria com subservi\u00E7os", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setRelocateModal(null); setRelocateTargetId(null); }, children: "Cancelar" }), _jsx(Button, { variant: "danger", disabled: !relocateTargetId, onClick: () => {
                                if (!relocateModal || !relocateTargetId)
                                    return;
                                const affectedServices = groupedServices.find((g) => g.categoryId === relocateModal.id)?.items ?? [];
                                setServiceCategoryAssignments((current) => {
                                    const next = { ...current };
                                    for (const svc of affectedServices)
                                        next[svc.id] = relocateTargetId;
                                    return next;
                                });
                                deleteCategoryMutation.mutate(relocateModal);
                                setRelocateModal(null);
                                setRelocateTargetId(null);
                            }, children: "Mover e excluir" })] }), children: relocateModal && (() => {
                    const affectedServices = groupedServices.find((g) => g.categoryId === relocateModal.id)?.items ?? [];
                    const availableTargets = groupedServices.filter((g) => g.categoryId !== relocateModal.id);
                    return (_jsxs("div", { className: "space-y-4 text-sm", children: [_jsxs("div", { className: "rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800", children: [_jsxs("p", { className: "font-semibold mb-1", children: ["Esta categoria possui ", affectedServices.length, " subservi\u00E7o", affectedServices.length !== 1 ? 's' : '', "."] }), _jsx("p", { className: "text-xs", children: "Antes de excluir, escolha para qual categoria deseja mover os itens abaixo." })] }), _jsx("div", { className: "space-y-1 max-h-40 overflow-y-auto border border-gray-100 rounded-lg px-3 py-2 bg-gray-50", children: affectedServices.map((svc) => (_jsxs("p", { className: "text-xs text-gray-700 truncate", children: ["\u2022 ", svc.name] }, svc.id))) }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Mover para a categoria *" }), _jsxs("select", { value: relocateTargetId ?? '', onChange: (e) => setRelocateTargetId(Number(e.target.value)), className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500", children: [_jsx("option", { value: "", children: "Selecione uma categoria..." }), availableTargets.map((g) => (_jsx("option", { value: g.categoryId, children: g.categoryName }, g.categoryId)))] })] })] }));
                })() }), _jsx(Modal, { open: !!deleteCategoryTarget, onClose: () => setDeleteCategoryTarget(null), title: "Excluir categoria", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteCategoryTarget(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", loading: deleteCategoryMutation.isPending, onClick: () => deleteCategoryTarget && deleteCategoryMutation.mutate(deleteCategoryTarget), children: "Excluir" })] }), children: _jsxs("p", { className: "text-gray-600 text-sm", children: ["Tem certeza que deseja excluir a categoria ", _jsx("strong", { children: deleteCategoryTarget?.name }), "? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita."] }) })] }));
}
