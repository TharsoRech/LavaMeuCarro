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
});

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  isAdmin: z.boolean().optional(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

const DAYS_OF_WEEK = [
  { id: '1', label: 'Segunda' },
  { id: '2', label: 'Terça' },
  { id: '3', label: 'Quarta' },
  { id: '4', label: 'Quinta' },
  { id: '5', label: 'Sexta' },
  { id: '6', label: 'Sábado' },
  { id: '7', label: 'Domingo' },
];

const DEFAULT_TIME_OPTIONS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];

const normalizeSchedule = (
  schedule?: Record<string, string[]>,
  availableTimes?: string | string[] | null,
): Record<string, string[]> => {
  if (schedule && typeof schedule === 'object' && Object.keys(schedule).length > 0) {
    return Object.fromEntries(
      Object.entries(schedule).map(([day, times]) => [day, Array.isArray(times) ? Array.from(new Set(times.filter(Boolean))).sort() : []])
    );
  }
  
  if (Array.isArray(availableTimes)) {
    const normalized = Array.from(new Set(availableTimes.filter(Boolean))).sort();
    return normalized.length ? { '1': normalized } : {};
  }
  
  if (typeof availableTimes === 'string' && availableTimes.length > 0) {
    try {
      const parsed = JSON.parse(availableTimes);
      if (Array.isArray(parsed)) {
        const normalized = Array.from(new Set(parsed.filter(Boolean))).sort();
        return normalized.length ? { '1': normalized } : {};
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.fromEntries(
          Object.entries(parsed).map(([day, times]) => [
            day, 
            Array.isArray(times) ? Array.from(new Set(times.filter(Boolean))).sort() : []
          ])
        );
      }
    } catch {
      // ignore parse errors
    }
  }
  
  return {};
};

export const AdminProfessionals: React.FC = () => {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Funcionario | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Funcionario | null>(null);
  const [error, setError] = useState('');
  
  // Create modal state
  const [createPhotoBase64, setCreatePhotoBase64] = useState<string>();
  const [createPhotoPreview, setCreatePhotoPreview] = useState<string>();
  const [createServiceIds, setCreateServiceIds] = useState<string[]>([]);
  const [createSchedule, setCreateSchedule] = useState<Record<string, string[]>>({});
  const [createSelectedDay, setCreateSelectedDay] = useState('1');
  
  // Edit modal state
  const [editPhotoBase64, setEditPhotoBase64] = useState<string>();
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>();
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [editSchedule, setEditSchedule] = useState<Record<string, string[]>>({});
  const [editSelectedDay, setEditSelectedDay] = useState('1');

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) });

  // Load edit data when editTarget changes
  useEffect(() => {
    if (!editTarget) {
      editForm.reset({ name: '', specialty: '', bio: '', isAdmin: false });
      setEditPhotoBase64(undefined);
      setEditPhotoPreview(undefined);
      setEditServiceIds([]);
      setEditSchedule({});
      setEditSelectedDay('1');
      return;
    }

    const photoSrc = editTarget.photoUrl 
      ? (editTarget.photoUrl.startsWith('http') || editTarget.photoUrl.startsWith('data:image') 
        ? editTarget.photoUrl 
        : `data:image/jpeg;base64,${editTarget.photoUrl}`)
      : undefined;
    setEditPhotoPreview(photoSrc);

    const normalized = normalizeSchedule(editTarget.schedule, editTarget.availableTimes);
    setEditSchedule(normalized);
    
    const firstWithTimes = DAYS_OF_WEEK.find((day) => (normalized[day.id] || []).length > 0)?.id ?? '1';
    setEditSelectedDay(firstWithTimes);

    const rawServiceIds = editTarget.serviceIds;
    const serviceIds = Array.isArray(rawServiceIds) ? rawServiceIds.map(id => String(id)) : [];
    setEditServiceIds(serviceIds);

    editForm.setValue('name', editTarget.name || '');
    editForm.setValue('specialty', editTarget.specialty || '');
    editForm.setValue('bio', editTarget.bio || '');
    editForm.setValue('isAdmin', editTarget.isAdmin || false);
  }, [editTarget?.id]);

  const { data: salons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits(),
  });

  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals', activeSalonId],
    queryFn: () => professionalsApi.bySalon(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const { data: timeOptionsData } = useQuery({
    queryKey: ['time-options'],
    queryFn: () => professionalsApi.timeOptions(),
  });

  const timeOptions = useMemo(
    () => (Array.isArray(timeOptionsData) && timeOptionsData.length > 0 ? Array.from(new Set(timeOptionsData as string[])).sort() : DEFAULT_TIME_OPTIONS),
    [timeOptionsData]
  );

  const { data: reviews } = useQuery({
    queryKey: ['professional-reviews', reviewTarget?.id],
    queryFn: () => professionalsApi.reviews(reviewTarget!.id),
    enabled: !!reviewTarget,
  });

  const { data: services } = useQuery({
    queryKey: ['services-for-professionals', activeSalonId],
    queryFn: () => servicesApi.list(activeSalonId!),
    enabled: !!activeSalonId,
  });

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
        name: data.name, // Backend espera 'Name' (System.Text.Json converte camelCase -> PascalCase)
        specialty: data.specialty,
        bio: data.bio,
        isAdmin: data.isAdmin ?? false,
        base64Image: createPhotoBase64,
        serviceIds: createServiceIds,
        availableTimes: JSON.stringify(createSchedule),
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
        availableTimes: JSON.stringify(editSchedule),
        schedule: editSchedule,
      };
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
      setError('');
    },
    onError: () => setError('Erro ao atualizar profissional. Verifique os dados.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => professionalsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals'] });
      setError('');
    },
    onError: () => setError('Erro ao excluir profissional.'),
  });

  const filteredProfessionals = useMemo(() => {
    if (!Array.isArray(professionals)) return [];
    if (!search) return professionals;
    const q = search.toLowerCase();
    return professionals.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.specialty?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [professionals, search]);

  const getAverageRating = (prof: Funcionario) => {
    return prof.averageRating ?? 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Profissional
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliação</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.isArray(filteredProfessionals) && filteredProfessionals.map((prof: Funcionario) => (
                <tr key={prof.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {prof.photoUrl ? (
                        <img 
                          src={prof.photoUrl.startsWith('http') || prof.photoUrl.startsWith('data:image') ? prof.photoUrl : `data:image/jpeg;base64,${prof.photoUrl}`} 
                          alt={prof.name} 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <span className="text-brand-600 font-medium text-sm">{prof.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prof.name || '-'}</p>
                        <p className="text-xs text-gray-500">{prof.email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{prof.specialty || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getAverageRating(prof) > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      <span className="text-sm text-gray-600">{getAverageRating(prof).toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({prof.totalReviews || 0})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prof.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReviewTarget(prof)}
                        className="text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditTarget(prof)}
                        className="text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
                            deleteMutation.mutate(prof.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!Array.isArray(filteredProfessionals) || filteredProfessionals.length === 0) && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Nenhum profissional encontrado</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); createForm.reset(); setCreatePhotoBase64(undefined); setCreatePhotoPreview(undefined); setCreateServiceIds([]); setCreateSchedule({}); setCreateSelectedDay('1'); }} title="Novo Profissional">
        <form
          onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">CPF/Documento *</label>
            <Input {...createForm.register('doc')} placeholder="000.000.000-00" />
            {createForm.formState.errors.doc && <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.doc.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Nome completo *</label>
            <Input {...createForm.register('name')} placeholder="Nome do profissional" />
            {createForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Especialidade</label>
            <Input {...createForm.register('specialty')} placeholder="Ex: Pintor, Funileiro" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Bio</label>
            <textarea {...createForm.register('bio')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Foto</label>
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
            {createPhotoPreview && (
              <img src={createPhotoPreview} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Serviços vinculados</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
              {Array.isArray(services) && services.map((service: any) => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createServiceIds.includes(String(service.id))}
                    onChange={(e) => {
                      setCreateServiceIds((current) => 
                        e.target.checked ? [...current, String(service.id)] : current.filter((id) => id !== String(service.id))
                      );
                    }}
                    className="rounded"
                  />
                  {service.name}
                </label>
              ))}
              {(!Array.isArray(services) || services.length === 0) && (
                <p className="text-xs text-gray-500">Nenhum serviço disponível</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Agenda semanal</label>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setCreateSelectedDay(day.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      createSelectedDay === day.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">
                  {(createSchedule[createSelectedDay] || []).length} horários selecionados
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const current = createSchedule[createSelectedDay] || [];
                    if (current.length === timeOptions.length) {
                      const newSchedule = { ...createSchedule };
                      delete newSchedule[createSelectedDay];
                      setCreateSchedule(newSchedule);
                    } else {
                      setCreateSchedule({ ...createSchedule, [createSelectedDay]: [...timeOptions] });
                    }
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  {(createSchedule[createSelectedDay] || []).length === timeOptions.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {timeOptions.map((time) => {
                  const isSelected = (createSchedule[createSelectedDay] || []).includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleTimeOnSchedule(createSchedule, setCreateSchedule, createSelectedDay, time)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...createForm.register('isAdmin')} className="rounded" />
            <span>É administrador da unidade?</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        key={editTarget?.id || 'closed'} 
        open={!!editTarget} 
        onClose={() => { setEditTarget(null); editForm.reset(); setEditPhotoBase64(undefined); setEditPhotoPreview(undefined); setEditServiceIds([]); setEditSchedule({}); setEditSelectedDay('1'); }} 
        title="Editar Profissional"
      >
        <form
          onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: editTarget!.id, data }))}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Nome completo *</label>
            <Input {...editForm.register('name')} placeholder="Nome do profissional" />
            {editForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Especialidade</label>
            <Input {...editForm.register('specialty')} placeholder="Ex: Pintor, Funileiro" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Bio</label>
            <textarea {...editForm.register('bio')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Foto</label>
            {editPhotoPreview && (
              <div className="mb-2 flex items-center gap-3">
                <img src={editPhotoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                <span className="text-xs text-gray-500">{editPhotoBase64 ? 'Nova foto selecionada' : 'Foto atual'}</span>
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
              {Array.isArray(services) && services.map((service: any) => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Array.isArray(editServiceIds) && editServiceIds.includes(String(service.id))}
                    onChange={(e) => {
                      setEditServiceIds((current) => {
                        const arr = Array.isArray(current) ? current : [];
                        return e.target.checked ? [...arr, String(service.id)] : arr.filter((id) => id !== String(service.id));
                      });
                    }}
                    className="rounded"
                  />
                  {service.name}
                </label>
              ))}
              {(!Array.isArray(services) || services.length === 0) && (
                <p className="text-xs text-gray-500">Nenhum serviço disponível</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Agenda semanal</label>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setEditSelectedDay(day.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      editSelectedDay === day.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">
                  {(editSchedule[editSelectedDay] || []).length} horários selecionados
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const current = editSchedule[editSelectedDay] || [];
                    if (current.length === timeOptions.length) {
                      const newSchedule = { ...editSchedule };
                      delete newSchedule[editSelectedDay];
                      setEditSchedule(newSchedule);
                    } else {
                      setEditSchedule({ ...editSchedule, [editSelectedDay]: [...timeOptions] });
                    }
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  {(editSchedule[editSelectedDay] || []).length === timeOptions.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {timeOptions.map((time) => {
                  const isSelected = (editSchedule[editSelectedDay] || []).includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleTimeOnSchedule(editSchedule, setEditSchedule, editSelectedDay, time)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <span>É administrador da unidade?</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reviews Modal */}
      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Avaliações" size="lg">
        <div className="space-y-4">
          {Array.isArray(reviews) && reviews.length > 0 ? (
            reviews.map((review: ReviewDto) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="w-4 h-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm text-gray-700">{review.comment}</p>
                <p className="text-xs text-gray-500 mt-2">- {review.clientName || 'Cliente'}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhuma avaliação ainda</p>
          )}
        </div>
      </Modal>
    </div>
  );
};
