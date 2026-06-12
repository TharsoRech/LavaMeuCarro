import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Search, Star, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { salonsApi, professionalsApi, servicesApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
// LavaMeuCarro doesn't have multi-salon selection
// import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
const createSchema = z.object({
    doc: z.string().min(3, 'CPF/documento obrigatório'),
    name: z.string().min(2, 'Nome obrigatório'),
    specialty: z.string().optional(),
    bio: z.string().optional(),
    isAdmin: z.boolean().optional(),
    serviceIds: z.array(z.string()).optional(),
});
const editSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    specialty: z.string().optional(),
    bio: z.string().optional(),
    isAdmin: z.boolean().optional(),
    serviceIds: z.array(z.string()).optional(),
});
const DAYS_OF_WEEK = [
    { id: '0', label: 'Dom' },
    { id: '1', label: 'Seg' },
    { id: '2', label: 'Ter' },
    { id: '3', label: 'Qua' },
    { id: '4', label: 'Qui' },
    { id: '5', label: 'Sex' },
    { id: '6', label: 'Sab' },
];
const DEFAULT_TIME_OPTIONS = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];
export function AdminProfessionals() {
    const qc = useQueryClient();
    const { user } = useAdminAuth();
    const [createModal, setCreateModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [error, setError] = useState('');
    const [createPhotoBase64, setCreatePhotoBase64] = useState();
    const [createPhotoPreview, setCreatePhotoPreview] = useState();
    const [editPhotoBase64, setEditPhotoBase64] = useState();
    const [editPhotoPreview, setEditPhotoPreview] = useState();
    const [createServiceIds, setCreateServiceIds] = useState([]);
    const [editServiceIds, setEditServiceIds] = useState([]);
    const [createSchedule, setCreateSchedule] = useState({});
    const [editSchedule, setEditSchedule] = useState({});
    const [createSelectedDay, setCreateSelectedDay] = useState('1');
    const [editSelectedDay, setEditSelectedDay] = useState('1');
    const { data: salons } = useQuery({
        queryKey: ['my-units'],
        queryFn: () => salonsApi.myUnits().then(r => r.data),
    });
    // LavaMeuCarro: simplified - no salon selection needed
    const activeSalonId = null; // Will use all professionals
    const hasUnits = false;
    const handleSalonChange = (_id) => { };
    const { data: professionals, isLoading, isError, error: professionalsError, refetch } = useQuery({
        queryKey: ['professionals', activeSalonId],
        queryFn: () => professionalsApi.bySalon(activeSalonId).then(r => r.data),
        enabled: !!activeSalonId,
    });
    const { data: services } = useQuery({
        queryKey: ['services-for-professionals', activeSalonId],
        queryFn: () => servicesApi.list(activeSalonId).then((r) => r.data),
        enabled: !!activeSalonId,
    });
    const { data: timeOptionsData } = useQuery({
        queryKey: ['professional-time-options', activeSalonId],
        queryFn: () => professionalsApi.timeOptions(activeSalonId).then((r) => r.data),
        enabled: !!activeSalonId,
    });
    const timeOptions = useMemo(() => (timeOptionsData && timeOptionsData.length > 0 ? Array.from(new Set(timeOptionsData)).sort() : DEFAULT_TIME_OPTIONS), [timeOptionsData]);
    const { data: reviews, isLoading: isLoadingReviews } = useQuery({
        queryKey: ['professional-reviews', reviewTarget?.id],
        queryFn: () => professionalsApi.reviews(reviewTarget.id).then((r) => r.data),
        enabled: !!reviewTarget,
    });
    const createForm = useForm({ resolver: zodResolver(createSchema) });
    const editForm = useForm({ resolver: zodResolver(editSchema) });
    const normalizeImageSrc = (value) => {
        if (!value)
            return undefined;
        if (value.startsWith('http') || value.startsWith('data:image'))
            return value;
        return `data:image/jpeg;base64,${value}`;
    };
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
        reader.readAsDataURL(file);
    });
    const normalizeSchedule = (schedule, availableTimes) => {
        if (schedule && Object.keys(schedule).length > 0) {
            return Object.fromEntries(Object.entries(schedule).map(([day, times]) => [day, Array.from(new Set((times || []).filter(Boolean))).sort()]));
        }
        const normalizedTimes = Array.from(new Set((availableTimes || []).filter(Boolean))).sort();
        return normalizedTimes.length ? { '1': normalizedTimes } : {};
    };
    const flattenSchedule = (schedule) => Array.from(new Set(Object.values(schedule || {}).flat().filter(Boolean))).sort();
    const toggleTimeOnSchedule = (schedule, setSchedule, day, time) => {
        const current = { ...schedule };
        const dayTimes = [...(current[day] || [])];
        const idx = dayTimes.indexOf(time);
        if (idx >= 0)
            dayTimes.splice(idx, 1);
        else
            dayTimes.push(time);
        current[day] = dayTimes.sort();
        setSchedule(current);
    };
    const toggleAllTimesOfDay = (schedule, setSchedule, day) => {
        const current = { ...schedule };
        const isAllSelected = (current[day] || []).length === timeOptions.length;
        current[day] = isAllSelected ? [] : [...timeOptions];
        setSchedule(current);
    };
    const createMutation = useMutation({
        mutationFn: (data) => professionalsApi.createByDoc(activeSalonId, {
            doc: data.doc,
            name: data.name,
            specialty: data.specialty,
            bio: data.bio,
            isAdmin: data.isAdmin ?? false,
            base64Image: createPhotoBase64,
            serviceIds: createServiceIds,
            availableTimes: flattenSchedule(createSchedule),
            schedule: createSchedule,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['professionals'] });
            setCreateModal(false);
            createForm.reset();
            setCreatePhotoBase64(undefined);
            setCreatePhotoPreview(undefined);
            setCreateServiceIds([]);
            setCreateSchedule({});
            setCreateSelectedDay('1');
            setError('');
        },
        onError: () => setError('Erro ao cadastrar profissional. Verifique os dados.'),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => professionalsApi.update(id, {
            ...data,
            salonId: activeSalonId,
            base64Image: editPhotoBase64,
            serviceIds: editServiceIds,
            availableTimes: flattenSchedule(editSchedule),
            schedule: editSchedule,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['professionals'] });
            setEditTarget(null);
            editForm.reset();
            setEditPhotoBase64(undefined);
            setEditPhotoPreview(undefined);
            setEditServiceIds([]);
            setEditSchedule({});
            setEditSelectedDay('1');
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => professionalsApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['professionals'] });
            setDeleteTarget(null);
        },
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Profissionais" }), _jsx("p", { className: "text-gray-500 text-sm", children: "Gerencie a equipe da sua unidade." })] }), _jsxs("div", { className: "flex gap-3", children: [salons && salons.length > 0 && (_jsx("select", { value: activeSalonId ?? '', onChange: e => handleSalonChange(Number(e.target.value)), className: "border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]", children: salons.map(s => _jsx("option", { value: s.id, children: s.name }, s.id)) })), _jsxs(Button, { onClick: () => setCreateModal(true), size: "sm", children: [_jsx(Plus, { className: "w-4 h-4" }), "Novo Profissional"] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [!hasUnits && (_jsx("div", { className: "p-10 text-center text-gray-400", children: "Nenhuma unidade cadastrada para exibir profissionais." })), isError && (_jsx("div", { className: "p-4 border-b border-gray-100", children: _jsx(ApiErrorAlert, { message: getApiErrorMessage(professionalsError, 'Falha ao carregar profissionais.'), onRetry: () => refetch() }) })), isLoading ? (_jsx("div", { className: "p-10 text-center text-gray-400", children: "Carregando..." })) : !professionals?.length ? (_jsxs("div", { className: "p-10 text-center text-gray-400", children: [_jsx(Search, { className: "w-8 h-8 mx-auto mb-2 opacity-40" }), "Nenhum profissional cadastrado."] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 text-gray-600 uppercase text-xs", children: _jsxs("tr", { children: [_jsx("th", { className: "px-5 py-3 text-left", children: "Nome" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Especialidade" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Avalia\u00E7\u00E3o" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Perfil" }), _jsx("th", { className: "px-5 py-3 text-center", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-50", children: professionals.map((prof) => (_jsxs("tr", { className: "hover:bg-gray-50/50", children: [_jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [normalizeImageSrc(prof.photoUrl) ? (_jsx("img", { src: normalizeImageSrc(prof.photoUrl), alt: prof.name, className: "w-8 h-8 rounded-full object-cover" })) : (_jsx("div", { className: "w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-brand-700 text-xs font-semibold", children: prof.name?.charAt(0)?.toUpperCase() }) })), _jsx("span", { className: "font-medium text-gray-900", children: prof.name })] }) }), _jsx("td", { className: "px-5 py-4 text-gray-600", children: prof.specialty || '—' }), _jsxs("td", { className: "px-5 py-4 text-gray-600", children: [prof.averageRating ? `${prof.averageRating.toFixed(1)}★ (${prof.totalReviews})` : 'Sem avaliações', _jsx("button", { onClick: () => setReviewTarget(prof), className: "ml-2 text-xs text-brand-600 hover:underline", children: "Ver" })] }), _jsx("td", { className: "px-5 py-4", children: _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prof.isAdmin ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`, children: prof.isAdmin ? 'Admin' : 'Profissional' }) }), _jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("button", { onClick: () => {
                                                                setEditTarget(prof);
                                                                setEditServiceIds(prof.serviceIds ?? []);
                                                                const normalized = normalizeSchedule(prof.schedule, prof.availableTimes);
                                                                setEditSchedule(normalized);
                                                                const firstWithTimes = DAYS_OF_WEEK.find((day) => (normalized[day.id] || []).length > 0)?.id ?? '1';
                                                                setEditSelectedDay(firstWithTimes);
                                                                editForm.reset({
                                                                    name: prof.name || '',
                                                                    specialty: prof.specialty || '',
                                                                    bio: prof.bio || '',
                                                                    isAdmin: prof.isAdmin,
                                                                    serviceIds: prof.serviceIds ?? [],
                                                                });
                                                            }, className: "text-gray-400 hover:text-brand-600 transition-colors", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteTarget(prof), className: "text-gray-400 hover:text-red-600 transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, prof.id))) })] }) }))] }), _jsx(Modal, { open: createModal, onClose: () => { setCreateModal(false); createForm.reset(); setError(''); setCreatePhotoBase64(undefined); setCreatePhotoPreview(undefined); setCreateServiceIds([]); setCreateSchedule({}); setCreateSelectedDay('1'); }, title: "Novo Profissional", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setCreateModal(false); createForm.reset(); setError(''); setCreatePhotoBase64(undefined); setCreatePhotoPreview(undefined); setCreateServiceIds([]); setCreateSchedule({}); setCreateSelectedDay('1'); }, children: "Cancelar" }), _jsx(Button, { loading: createMutation.isPending, onClick: createForm.handleSubmit(d => createMutation.mutate(d)), children: "Cadastrar" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "CPF / Documento *", placeholder: "000.000.000-00", error: createForm.formState.errors.doc?.message, ...createForm.register('doc') }), _jsx(Input, { label: "Nome completo *", placeholder: "Nome do profissional", error: createForm.formState.errors.name?.message, ...createForm.register('name') }), _jsx(Input, { label: "Especialidade", placeholder: "Ex: Cabeleireiro, Esteticista...", ...createForm.register('specialty') }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Bio" }), _jsx("textarea", { rows: 3, placeholder: "Breve apresenta\u00E7\u00E3o do profissional...", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...createForm.register('bio') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Foto do profissional" }), createPhotoPreview && (_jsx("img", { src: createPhotoPreview, alt: "preview", className: "w-16 h-16 rounded-full object-cover mb-2 border-2 border-brand-200" })), _jsx("input", { type: "file", accept: "image/*", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm", onChange: async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file)
                                            return;
                                        const base64 = await fileToBase64(file);
                                        setCreatePhotoBase64(base64);
                                        setCreatePhotoPreview(URL.createObjectURL(file));
                                    } })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-2", children: "Servi\u00E7os vinculados" }), _jsxs("div", { className: "max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2", children: [services?.map((service) => (_jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: createServiceIds.includes(String(service.id)), onChange: (e) => {
                                                        setCreateServiceIds((current) => e.target.checked
                                                            ? [...current, String(service.id)]
                                                            : current.filter((id) => id !== String(service.id)));
                                                    }, className: "rounded" }), service.name] }, service.id))), !services?.length && _jsx("p", { className: "text-xs text-gray-500", children: "Cadastre servi\u00E7os para vincular profissionais." })] })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...createForm.register('isAdmin'), className: "rounded" }), "Este profissional \u00E9 administrador da unidade"] }), _jsxs("div", { className: "space-y-3 border border-gray-200 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Agenda semanal" }), _jsx("button", { type: "button", onClick: () => toggleAllTimesOfDay(createSchedule, setCreateSchedule, createSelectedDay), className: "text-xs text-brand-600 hover:underline", children: (createSchedule[createSelectedDay] || []).length === timeOptions.length ? 'Limpar dia' : 'Selecionar dia inteiro' })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: DAYS_OF_WEEK.map((day) => (_jsx("button", { type: "button", onClick: () => setCreateSelectedDay(day.id), className: `px-2.5 py-1 text-xs rounded-full border ${createSelectedDay === day.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`, children: day.label }, day.id))) }), _jsx("div", { className: "grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1", children: timeOptions.map((time) => {
                                        const checked = (createSchedule[createSelectedDay] || []).includes(time);
                                        return (_jsx("button", { type: "button", onClick: () => toggleTimeOnSchedule(createSchedule, setCreateSchedule, createSelectedDay, time), className: `text-xs rounded-md px-2 py-1.5 border ${checked ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-600 border-gray-200'}`, children: time }, time));
                                    }) })] }), error && _jsx("p", { className: "text-sm text-red-600", children: error })] }) }), _jsx(Modal, { open: !!editTarget, onClose: () => { setEditTarget(null); editForm.reset(); setEditPhotoBase64(undefined); setEditPhotoPreview(undefined); setEditServiceIds([]); setEditSchedule({}); setEditSelectedDay('1'); }, title: "Editar Profissional", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setEditTarget(null); editForm.reset(); setEditPhotoBase64(undefined); setEditPhotoPreview(undefined); setEditServiceIds([]); setEditSchedule({}); setEditSelectedDay('1'); }, children: "Cancelar" }), _jsx(Button, { loading: updateMutation.isPending, onClick: editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d })), children: "Salvar" })] }), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Nome completo *", error: editForm.formState.errors.name?.message, ...editForm.register('name') }), _jsx(Input, { label: "Especialidade", ...editForm.register('specialty') }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Bio" }), _jsx("textarea", { rows: 3, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...editForm.register('bio') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Foto do profissional" }), editPhotoPreview && (_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("img", { src: editPhotoPreview, alt: "foto", className: "w-16 h-16 rounded-full object-cover border-2 border-brand-200" }), _jsx("span", { className: "text-xs text-gray-500", children: editPhotoPreview ? 'Prévia da nova foto' : 'Foto atual' })] })), _jsx("input", { type: "file", accept: "image/*", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm", onChange: async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file)
                                            return;
                                        const base64 = await fileToBase64(file);
                                        setEditPhotoBase64(base64);
                                        setEditPhotoPreview(URL.createObjectURL(file));
                                    } })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-2", children: "Servi\u00E7os vinculados" }), _jsx("div", { className: "max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2", children: services?.map((service) => (_jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: editServiceIds.includes(String(service.id)), onChange: (e) => {
                                                    setEditServiceIds((current) => e.target.checked
                                                        ? [...current, String(service.id)]
                                                        : current.filter((id) => id !== String(service.id)));
                                                }, className: "rounded" }), service.name] }, service.id))) })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", ...editForm.register('isAdmin'), className: "rounded" }), "Administrador da unidade"] }), _jsxs("div", { className: "space-y-3 border border-gray-200 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Agenda semanal" }), _jsx("button", { type: "button", onClick: () => toggleAllTimesOfDay(editSchedule, setEditSchedule, editSelectedDay), className: "text-xs text-brand-600 hover:underline", children: (editSchedule[editSelectedDay] || []).length === timeOptions.length ? 'Limpar dia' : 'Selecionar dia inteiro' })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: DAYS_OF_WEEK.map((day) => (_jsx("button", { type: "button", onClick: () => setEditSelectedDay(day.id), className: `px-2.5 py-1 text-xs rounded-full border ${editSelectedDay === day.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`, children: day.label }, day.id))) }), _jsx("div", { className: "grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1", children: timeOptions.map((time) => {
                                        const checked = (editSchedule[editSelectedDay] || []).includes(time);
                                        return (_jsx("button", { type: "button", onClick: () => toggleTimeOnSchedule(editSchedule, setEditSchedule, editSelectedDay, time), className: `text-xs rounded-md px-2 py-1.5 border ${checked ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-600 border-gray-200'}`, children: time }, time));
                                    }) })] })] }) }), _jsx(Modal, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), title: "Remover Profissional", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteTarget(null), children: "Cancelar" }), _jsx(Button, { variant: "danger", loading: deleteMutation.isPending, onClick: () => deleteTarget && deleteMutation.mutate(deleteTarget.id), children: "Remover" })] }), children: _jsxs("p", { className: "text-gray-600 text-sm", children: ["Tem certeza que deseja remover ", _jsx("strong", { children: deleteTarget?.name }), " da equipe? Esta a\u00E7\u00E3o desvincula o profissional da unidade."] }) }), _jsx(Modal, { open: !!reviewTarget, onClose: () => setReviewTarget(null), title: `Avaliações - ${reviewTarget?.name ?? ''}`, children: _jsx("div", { className: "space-y-3 max-h-[380px] overflow-y-auto", children: isLoadingReviews ? (_jsx("p", { className: "text-sm text-gray-500", children: "Carregando avalia\u00E7\u00F5es..." })) : !reviews?.length ? (_jsxs("div", { className: "text-sm text-gray-500 flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "Este profissional ainda n\u00E3o possui avalia\u00E7\u00F5es."] })) : (reviews.map((review) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: review.clientName }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(review.createdAt).toLocaleDateString('pt-BR') })] }), _jsx("div", { className: "flex items-center gap-1 text-amber-500 mb-2", children: Array.from({ length: review.rating }).map((_, index) => _jsx(Star, { className: "w-4 h-4 fill-current" }, index)) }), _jsx("p", { className: "text-sm text-gray-700", children: review.comment || 'Sem comentário.' })] }, review.id)))) }) })] }));
}
