import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Search, Star, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { salonsApi, professionalsApi, servicesApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { Funcionario, ReviewDto } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';

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

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

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
  const [editTarget, setEditTarget] = useState<Funcionario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Funcionario | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Funcionario | null>(null);
  const [error, setError] = useState('');
  const [createPhotoBase64, setCreatePhotoBase64] = useState<string | undefined>();
  const [createPhotoPreview, setCreatePhotoPreview] = useState<string | undefined>();
  const [editPhotoBase64, setEditPhotoBase64] = useState<string | undefined>();
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | undefined>();
  const [createServiceIds, setCreateServiceIds] = useState<string[]>([]);
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [createSchedule, setCreateSchedule] = useState<Record<string, string[]>>({});
  const [editSchedule, setEditSchedule] = useState<Record<string, string[]>>({});
  const [createSelectedDay, setCreateSelectedDay] = useState('1');
  const [editSelectedDay, setEditSelectedDay] = useState('1');

  // Carrega dados do profissional quando editTarget muda
  useEffect(() => {
    if (!editTarget) {
      // Limpa o form quando fecha o modal
      editForm.reset();
      setEditPhotoBase64(undefined);
      setEditPhotoPreview(undefined);
      setEditServiceIds([]);
      setEditSchedule({});
      setEditSelectedDay('1');
      return;
    }

    // Carrega foto atual do profissional
    const photoSrc = normalizeImageSrc(editTarget.photoUrl);
    setEditPhotoPreview(photoSrc || undefined);

    // Normaliza schedule
    const normalized = normalizeSchedule(editTarget.schedule, editTarget.availableTimes);
    setEditSchedule(normalized);
    
    // Seleciona primeiro dia com horários
    const firstWithTimes = DAYS_OF_WEEK.find((day) => (normalized[day.id] || []).length > 0)?.id ?? '1';
    setEditSelectedDay(firstWithTimes);

    // Carrega serviços vinculados (garante que sejam strings e sempre seja array)
    const rawServiceIds = editTarget.serviceIds;
    const serviceIds = Array.isArray(rawServiceIds) 
      ? rawServiceIds.map(id => String(id))
      : [];
    setEditServiceIds(serviceIds);

    // Reseta o formulário com os dados do profissional
    editForm.reset({
      name: editTarget.name || '',
      specialty: editTarget.specialty || '',
      bio: editTarget.bio || '',
      isAdmin: editTarget.isAdmin,
      serviceIds: serviceIds,
    });
  }, [editTarget?.id]); // Só executa quando o ID muda (evita re-execuções desnecessárias)

  const { data: salons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits(),
  });

  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  const { data: professionals, isLoading, isError, error: professionalsError, refetch } = useQuery({
    queryKey: ['professionals', activeSalonId],
    queryFn: () => professionalsApi.bySalon(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const { data: services } = useQuery({
    queryKey: ['services-for-professionals', activeSalonId],
    queryFn: () => servicesApi.list(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const { data: timeOptionsData } = useQuery({
    queryKey: ['professional-time-options', activeSalonId],
    queryFn: () => professionalsApi.timeOptions(activeSalonId!),
    enabled: !!activeSalonId,
  });

    const timeOptions = useMemo(
    () => (timeOptionsData && timeOptionsData.length > 0 ? Array.from(new Set(timeOptionsData as string[])).sort() : DEFAULT_TIME_OPTIONS),
    [timeOptionsData]
  );

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['professional-reviews', reviewTarget?.id],
    queryFn: () => professionalsApi.reviews(reviewTarget!.id),
    enabled: !!reviewTarget,
  });

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) });

  const normalizeImageSrc = (value?: string) => {
    if (!value) return undefined;
    if (value.startsWith('http') || value.startsWith('data:image')) return value;
    return `data:image/jpeg;base64,${value}`;
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
      reader.readAsDataURL(file);
    });

  const normalizeSchedule = (schedule?: Record<string, string[]>, availableTimes?: string[]) => {
    if (schedule && Object.keys(schedule).length > 0) {
      return Object.fromEntries(
        Object.entries(schedule).map(([day, times]) => [day, Array.from(new Set((times || []).filter(Boolean))).sort()])
      );
    }
    const normalizedTimes = Array.from(new Set((availableTimes || []).filter(Boolean))).sort();
    return normalizedTimes.length ? { '1': normalizedTimes } : {};
  };

  const flattenSchedule = (schedule: Record<string, string[]>) =>
    Array.from(new Set(Object.values(schedule || {}).flat().filter(Boolean))).sort();

  const toggleTimeOnSchedule = (
    schedule: Record<string, string[]>,
    setSchedule: Dispatch<SetStateAction<Record<string, string[]>>>,
    day: string,
    time: string,
  ) => {
    const current = { ...schedule };
    const dayTimes = [...(current[day] || [])];
    const idx = dayTimes.indexOf(time);
    if (idx >= 0) dayTimes.splice(idx, 1);
    else dayTimes.push(time);
    current[day] = dayTimes.sort();
    setSchedule(current);
  };

  const toggleAllTimesOfDay = (
    schedule: Record<string, string[]>,
    setSchedule: Dispatch<SetStateAction<Record<string, string[]>>>,
    day: string,
  ) => {
    const current = { ...schedule };
    const isAllSelected = (current[day] || []).length === timeOptions.length;
    current[day] = isAllSelected ? [] : [...timeOptions];
    setSchedule(current);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateData) =>
      professionalsApi.createByDoc(activeSalonId!, {
        doc: data.doc,
        Nome: data.name, // Backend espera 'Nome' com N maiúsculo
        specialty: data.specialty,
        bio: data.bio,
        isAdmin: data.isAdmin ?? false,
        base64Image: createPhotoBase64,
        serviceIds: createServiceIds,
        availableTimes: JSON.stringify(createSchedule), // Salva schedule completo como JSON
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
    mutationFn: ({ id, data }: { id: number; data: EditData }) => {
      const payload = {
        ...data,
        salonId: activeSalonId,
        base64Image: editPhotoBase64,
        serviceIds: editServiceIds,
        availableTimes: JSON.stringify(editSchedule), // Salva schedule completo como JSON
        schedule: editSchedule,
      };
      console.log('[Professionals] Update payload:', payload);
      return professionalsApi.update(id, payload);
    },
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
    mutationFn: (id: number) => professionalsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500 text-sm">Gerencie a equipe da sua unidade.</p>
        </div>
        <div className="flex gap-3">
          {salons && salons.length > 0 && (
            <select value={activeSalonId ?? ''} onChange={e => handleSalonChange(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]">
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Button onClick={() => setCreateModal(true)} size="sm">
            <Plus className="w-4 h-4" />
            Novo Profissional
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!hasUnits && (
          <div className="p-10 text-center text-gray-400">Nenhuma unidade cadastrada para exibir profissionais.</div>
        )}
        {isError && (
          <div className="p-4 border-b border-gray-100">
            <ApiErrorAlert
              message={getApiErrorMessage(professionalsError, 'Falha ao carregar profissionais.')}
              onRetry={() => refetch()}
            />
          </div>
        )}
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Carregando...</div>
        ) : !professionals?.length ? (
          <div className="p-10 text-center text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhum profissional cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Nome</th>
                  <th className="px-5 py-3 text-left">Especialidade</th>
                  <th className="px-5 py-3 text-left">Avaliação</th>
                  <th className="px-5 py-3 text-left">Perfil</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {professionals.map((prof: Funcionario) => (
                  <tr key={prof.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {normalizeImageSrc(prof.photoUrl) ? (
                          <img src={normalizeImageSrc(prof.photoUrl)} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                            <span className="text-brand-700 text-xs font-semibold">{prof.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{prof.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{prof.specialty || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {prof.averageRating ? `${prof.averageRating.toFixed(1)}★ (${prof.totalReviews})` : 'Sem avaliações'}
                      <button
                        onClick={() => setReviewTarget(prof)}
                        className="ml-2 text-xs text-brand-600 hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        prof.isAdmin ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {prof.isAdmin ? 'Admin' : 'Profissional'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setEditTarget(prof);
                          }}
                          className="text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(prof)} className="text-gray-400 hover:text-red-600 transition-colors">
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

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); createForm.reset(); setError(''); setCreatePhotoBase64(undefined); setCreatePhotoPreview(undefined); setCreateServiceIds([]); setCreateSchedule({}); setCreateSelectedDay('1'); }} title="Novo Profissional"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreateModal(false); createForm.reset(); setError(''); setCreatePhotoBase64(undefined); setCreatePhotoPreview(undefined); setCreateServiceIds([]); setCreateSchedule({}); setCreateSelectedDay('1'); }}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={createForm.handleSubmit(d => createMutation.mutate(d))}>Cadastrar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="CPF / Documento *" placeholder="000.000.000-00" error={createForm.formState.errors.doc?.message} {...createForm.register('doc')} />
          <Input label="Nome completo *" placeholder="Nome do profissional" error={createForm.formState.errors.name?.message} {...createForm.register('name')} />
          <Input label="Especialidade" placeholder="Ex: Cabeleireiro, Esteticista..." {...createForm.register('specialty')} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
            <textarea rows={3} placeholder="Breve apresentação do profissional..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...createForm.register('bio')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Foto do profissional</label>
            {createPhotoPreview && (
              <img src={createPhotoPreview} alt="preview" className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-brand-200" />
            )}
            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const base64 = await fileToBase64(file);
                setCreatePhotoBase64(base64);
                setCreatePhotoPreview(URL.createObjectURL(file));
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Serviços vinculados</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
              {services?.map((service: any) => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createServiceIds.includes(String(service.id))}
                    onChange={(e) => {
                      setCreateServiceIds((current) =>
                        e.target.checked
                          ? [...current, String(service.id)]
                          : current.filter((id) => id !== String(service.id))
                      );
                    }}
                    className="rounded"
                  />
                  {service.name}
                </label>
              ))}
              {!services?.length && <p className="text-xs text-gray-500">Cadastre serviços para vincular profissionais.</p>}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...createForm.register('isAdmin')} className="rounded" />
            Este profissional é administrador da unidade
          </label>
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Agenda semanal</label>
              <button
                type="button"
                onClick={() => toggleAllTimesOfDay(createSchedule, setCreateSchedule, createSelectedDay)}
                className="text-xs text-brand-600 hover:underline"
              >
                {(createSchedule[createSelectedDay] || []).length === timeOptions.length ? 'Limpar dia' : 'Selecionar dia inteiro'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setCreateSelectedDay(day.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border ${createSelectedDay === day.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
              {timeOptions.map((time) => {
                const checked = (createSchedule[createSelectedDay] || []).includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeOnSchedule(createSchedule, setCreateSchedule, createSelectedDay, time)}
                    className={`text-xs rounded-md px-2 py-1.5 border ${checked ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        key={editTarget?.id || 'closed'} 
        open={!!editTarget} 
        onClose={() => { setEditTarget(null); editForm.reset(); setEditPhotoBase64(undefined); setEditPhotoPreview(undefined); setEditServiceIds([]); setEditSchedule({}); setEditSelectedDay('1'); }} 
        title="Editar Profissional"
        footer={
          <>
            <Button variant="outline" onClick={() => { setEditTarget(null); editForm.reset(); setEditPhotoBase64(undefined); setEditPhotoPreview(undefined); setEditServiceIds([]); setEditSchedule({}); setEditSelectedDay('1'); }}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={editForm.handleSubmit(d => editTarget && updateMutation.mutate({ id: editTarget.id, data: d }))}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-4">
          {editTarget?.doc && (
            <Input label="CPF" value={editTarget.doc} disabled />
          )}
          <Input label="Nome completo *" error={editForm.formState.errors.name?.message} {...editForm.register('name')} />
          <Input label="Especialidade" {...editForm.register('specialty')} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...editForm.register('bio')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Foto do profissional</label>
            {/* Photo preview - mostra foto atual ou nova */}
            {(editPhotoPreview || editTarget?.photoUrl) && (
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={editPhotoPreview || normalizeImageSrc(editTarget?.photoUrl) || ''}
                  alt="foto"
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-200"
                />
                <span className="text-xs text-gray-500">{editPhotoPreview ? 'Prévia da nova foto' : 'Foto atual'}</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const base64 = await fileToBase64(file);
                setEditPhotoBase64(base64);
                setEditPhotoPreview(URL.createObjectURL(file));
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Serviços vinculados</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
              {services?.map((service: any) => {
                const isChecked = Array.isArray(editServiceIds) && editServiceIds.includes(String(service.id));
                return (
                  <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setEditServiceIds((current) => {
                          const arr = Array.isArray(current) ? current : [];
                          return e.target.checked
                            ? [...arr, String(service.id)]
                            : arr.filter((id) => id !== String(service.id));
                        });
                      }}
                      className="rounded"
                    />
                    {service.name}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...editForm.register('isAdmin')} className="rounded" />
            Administrador da unidade
          </label>
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Agenda semanal</label>
              <button
                type="button"
                onClick={() => toggleAllTimesOfDay(editSchedule, setEditSchedule, editSelectedDay)}
                className="text-xs text-brand-600 hover:underline"
              >
                {(editSchedule[editSelectedDay] || []).length === timeOptions.length ? 'Limpar dia' : 'Selecionar dia inteiro'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setEditSelectedDay(day.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border ${editSelectedDay === day.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
              {timeOptions.map((time) => {
                const checked = (editSchedule[editSelectedDay] || []).includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeOnSchedule(editSchedule, setEditSchedule, editSelectedDay, time)}
                    className={`text-xs rounded-md px-2 py-1.5 border ${checked ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover Profissional"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Remover</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong> da equipe? Esta ação desvincula o profissional da unidade.</p>
      </Modal>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={`Avaliações - ${reviewTarget?.name ?? ''}`}
      >
        <div className="space-y-3 max-h-[380px] overflow-y-auto">
          {isLoadingReviews ? (
            <p className="text-sm text-gray-500">Carregando avaliações...</p>
          ) : !reviews?.length ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Este profissional ainda não possui avaliações.
            </div>
          ) : (
            reviews.map((review: ReviewDto) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{review.clientName}</p>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm text-gray-700">{review.comment || 'Sem comentário.'}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
