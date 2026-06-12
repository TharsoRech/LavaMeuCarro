import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, Store, Plus, Star, MessageSquare, Image as ImageIcon, Trash2, MapPin, Search, AlertTriangle, Clock } from 'lucide-react';
import { salonsApi, reviewsApi, subscriptionsApi, professionalsApi } from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';

interface SalonForm {
  name: string;
  description: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint: string;
  phone: string;
  email: string;
  whatsApp: string;
  instagramUrl: string;
  businessHours: string;
  published: boolean;
  latitude?: number;
  longitude?: number;
}

interface CreateUnitForm {
  name: string;
  address: string;
  description: string;
  city: string;
  state: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  referencePoint?: string;
  businessHours?: string;
  published?: boolean;
  phone?: string;
  whatsApp?: string;
  instagramUrl?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

const stateMap: Record<string, string> = {
  ACRE: 'AC', ALAGOAS: 'AL', AMAPA: 'AP', AMAZONAS: 'AM', BAHIA: 'BA', CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF', ESPIRITO: 'ES', GOIAS: 'GO', MARANHAO: 'MA',
  'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS', MINAS: 'MG', PARA: 'PA',
  PARAIBA: 'PB', PARANA: 'PR', PERNAMBUCO: 'PE', PIAUI: 'PI', 'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN', 'RIO GRANDE DO SUL': 'RS', RONDONIA: 'RO',
  RORAIMA: 'RR', SANTA: 'SC', 'SAO PAULO': 'SP', SERGIPE: 'SE', TOCANTINS: 'TO'
};

const normalizeUf = (value?: string) => {
  const v = (value || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(v)) return v;
  for (const key of Object.keys(stateMap)) {
    if (v.includes(key)) return stateMap[key];
  }
  return '';
};

const formatPhone = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 11);
  if (c.length <= 10) {
    const m = c.match(/^(\d{2})(\d{4})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : c;
  }
  const m = c.match(/^(\d{2})(\d{5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : c;
};

const formatZipCode = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export function AdminSalon() {
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const [saved, setSaved] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryPayload, setGalleryPayload] = useState<string[]>([]);
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(null);
  const [createCoverBase64, setCreateCoverBase64] = useState<string | null>(null);
  const [createGalleryPreviews, setCreateGalleryPreviews] = useState<string[]>([]);
  const [createGalleryPayload, setCreateGalleryPayload] = useState<string[]>([]);
  const [apiError, setApiError] = useState('');
  const [publishFeedback, setPublishFeedback] = useState('');
  const [schedulingEditOpen, setSchedulingEditOpen] = useState(false);
  const [schedulingDraft, setSchedulingDraft] = useState<string[]>([]);
  const [schedulingPendingPlatformDefault, setSchedulingPendingPlatformDefault] = useState(false);
  const [schedulingTouched, setSchedulingTouched] = useState(false);
  const [schedulingInterval, setSchedulingInterval] = useState<number>(30);

  // Estados para geocodificação e endereço
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { data: salons, isError: isSalonsError, error: salonsError, refetch: refetchSalons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits().then(r => r.data),
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => subscriptionsApi.current().then((r) => r.data),
  });

  const canPublishCatalog = Boolean(currentSubscription?.isActive);

  const { data: schedulingPoolGlobal } = useQuery({
    queryKey: ['scheduling-pool-global'],
    queryFn: () => professionalsApi.timeOptions().then((r) => r.data),
  });

  const { salonId, setSalonId, activeSalonId, hasUnits } = useAdminSalonSelection(salons, user?.id);
  const activeSalon = salons?.find(s => s.id === (activeSalonId ?? salons[0]?.id));

  const generateTimeSlots = useCallback((intervalMinutes: number): string[] => {
    const slots: string[] = [];
    let current = 7 * 60; // 7:00 em minutos
    const end = 23 * 60 + 30; // 23:30 em minutos
    
    while (current <= end) {
      const hours = Math.floor(current / 60);
      const minutes = current % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      current += intervalMinutes;
    }
    
    return slots;
  }, []);

  const schedulingSlotPool = useMemo(() => {
    if (schedulingEditOpen) {
      return generateTimeSlots(schedulingInterval);
    }
    const g = schedulingPoolGlobal?.filter(Boolean) ?? [];
    const eff = activeSalon?.schedulingTimeOptionsEffective?.filter(Boolean) ?? [];
    const merged = g.length ? g : eff;
    const sorted = Array.from(new Set(merged)).sort();
    return sorted;
  }, [schedulingPoolGlobal, activeSalon?.schedulingTimeOptionsEffective, schedulingEditOpen, schedulingInterval, generateTimeSlots]);

  useEffect(() => {
    if (!activeSalon) return;
    const isCustom = activeSalon.schedulingUsesDefaultTimeOptions === false;
    setSchedulingEditOpen(isCustom);
    setSchedulingPendingPlatformDefault(false);
    setSchedulingTouched(false);
    setSchedulingDraft([...(activeSalon.schedulingTimeOptionsEffective ?? [])]);
    setSchedulingInterval((activeSalon as any).schedulingTimeInterval ?? 30);
  }, [activeSalon?.id]);

  const { data: reviews, isError: isReviewsError, error: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['salon-reviews', activeSalon?.id],
    queryFn: () => reviewsApi.bySalon(activeSalon!.id).then(r => r.data),
    enabled: !!activeSalon && activeTab === 'reviews',
  });

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<SalonForm>();
  const createUnitForm = useForm<CreateUnitForm>();

  const toDisplayImage = useCallback((value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image') || trimmed.startsWith('http')) return trimmed;
    return `data:image/jpeg;base64,${trimmed}`;
  }, []);

  const stripImagePrefix = useCallback((value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const marker = 'base64,';
    const idx = trimmed.indexOf(marker);
    return idx >= 0 ? trimmed.slice(idx + marker.length) : trimmed;
  }, []);

  const parseGallery = useCallback((raw?: string | string[]) => {
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) return raw.filter(Boolean);

    const value = raw.trim();
    if (!value) return [];

    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      } catch {
        // Keep fallback parsing below.
      }
    }

    if (value.includes(',')) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [value];
  }, []);

  const fileToBase64 = useCallback((file: File): Promise<string> => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
      reader.readAsDataURL(file);
    })
  ), []);

  useEffect(() => {
    if (activeSalon) {
      reset({
        name: activeSalon.name || '',
        description: activeSalon.description || '',
        address: activeSalon.address || '',
        number: activeSalon.number || '',
        complement: activeSalon.complement || '',
        neighborhood: activeSalon.neighborhood || '',
        city: activeSalon.city || '',
        state: activeSalon.state || '',
        zipCode: activeSalon.zipCode || '',
        referencePoint: activeSalon.referencePoint || '',
        phone: formatPhone(activeSalon.phone || ''),
        email: activeSalon.email || '',
        whatsApp: formatPhone(activeSalon.whatsApp || ''),
        instagramUrl: activeSalon.instagramUrl || '',
        businessHours: activeSalon.businessHours || '',
        published: activeSalon.published ?? false,
      });

      setLatitude(activeSalon.latitude ?? null);
      setLongitude(activeSalon.longitude ?? null);
      setAddressValidated(!!(activeSalon.latitude && activeSalon.longitude));

      const currentCover = toDisplayImage(activeSalon.logoUrl ?? null);
      setCoverPreview(currentCover);
      setCoverBase64(stripImagePrefix(activeSalon.logoUrl ?? null));

      const parsedGallery = parseGallery(activeSalon.gallery);
      setGalleryPreviews(parsedGallery.map((item) => toDisplayImage(item) || '').filter(Boolean));
      setGalleryPayload(parsedGallery.map((item) => stripImagePrefix(item) || '').filter(Boolean));
    }
  }, [activeSalon, parseGallery, reset, stripImagePrefix, toDisplayImage]);

  const selectedGallery = useMemo(
    () => galleryPreviews.length ? galleryPreviews : (parseGallery(activeSalon?.gallery).map((item) => toDisplayImage(item) || '').filter(Boolean)),
    [activeSalon?.gallery, galleryPreviews, parseGallery, toDisplayImage]
  );

  const selectedCover = coverPreview || toDisplayImage(activeSalon?.logoUrl ?? null);

  const handleSelectCoverImage = useCallback(async (file?: File | null, mode: 'edit' | 'create' = 'edit') => {
    if (!file) return;
    const b64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    if (mode === 'create') {
      setCreateCoverBase64(b64);
      setCreateCoverPreview(preview);
      return;
    }
    setCoverBase64(b64);
    setCoverPreview(preview);
  }, [fileToBase64]);

  const handleAppendGallery = useCallback(async (files: FileList | null, mode: 'edit' | 'create' = 'edit') => {
    if (!files?.length) return;

    const list = Array.from(files);
    const nextBase64 = await Promise.all(list.map((file) => fileToBase64(file)));
    const nextPreviews = list.map((file) => URL.createObjectURL(file));

    if (mode === 'create') {
      setCreateGalleryPayload((prev) => [...prev, ...nextBase64]);
      setCreateGalleryPreviews((prev) => [...prev, ...nextPreviews]);
      return;
    }

    setGalleryPayload((prev) => [...prev, ...nextBase64]);
    setGalleryPreviews((prev) => [...prev, ...nextPreviews]);
  }, [fileToBase64]);

  const lookupAddressByZipCode = async (form: any) => {
    const zip = form.getValues('zipCode');
    const onlyDigits = zip.replace(/\D/g, '');
    if (onlyDigits.length !== 8) {
      alert('Informe um CEP com 8 dígitos.');
      return;
    }

    setIsZipLoading(true);
    try {
      // Tenta AwesomeAPI primeiro: retorna endereço + coordenadas em um único request
      let addressFilled = false;
      try {
        const awRes = await fetch(`https://cep.awesomeapi.com.br/json/${onlyDigits}`);
        if (awRes.ok) {
          const awData = await awRes.json();
          if (awData?.address || awData?.address_name) {
            form.setValue('address', awData.address || awData.address_name || '');
            form.setValue('neighborhood', awData.district || '');
            form.setValue('city', awData.city || '');
            form.setValue('state', awData.state || '');
            form.setValue('zipCode', formatZipCode(onlyDigits));
            setAddressValidated(false);
            addressFilled = true;

            // Se já tem coordenadas, seta automaticamente
            const lat = parseFloat(awData.lat);
            const lng = parseFloat(awData.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              setLatitude(lat);
              setLongitude(lng);
              setAddressValidated(true);
            }
          }
        }
      } catch {
        // fallback para ViaCEP
      }

      // Fallback: ViaCEP (sem coordenadas)
      if (!addressFilled) {
        const response = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
        const data = await response.json();
        if (data?.erro) {
          alert('CEP não encontrado.');
          return;
        }
        form.setValue('address', data.logradouro || '');
        form.setValue('neighborhood', data.bairro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
        form.setValue('zipCode', formatZipCode(data.cep || onlyDigits));
        setAddressValidated(false);
      }
    } catch (err) {
      alert('Erro ao buscar endereço pelo CEP.');
    } finally {
      setIsZipLoading(false);
    }
  };

  const nominatimSearch = async (url: string): Promise<any | null> => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HoraDaBelezaAdmin/1.0' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data[0];
      return null;
    } catch {
      return null;
    }
  };

  const validateAndGeocodeAddress = async (form: any): Promise<boolean> => {
    const values = form.getValues();
    if (!values.address || !values.city || !values.state) {
      alert('Preencha logradouro, cidade e estado antes de validar.');
      return false;
    }

    const onlyZip = (values.zipCode || '').replace(/\D/g, '');
    const encode = encodeURIComponent;

    try {
      let best: any = null;

      // Estratégia 0: AwesomeAPI por CEP — retorna lat/lng diretamente (mais confiável para BR)
      if (onlyZip.length === 8) {
        try {
          const awRes = await fetch(`https://cep.awesomeapi.com.br/json/${onlyZip}`);
          if (awRes.ok) {
            const awData = await awRes.json();
            const lat = parseFloat(awData?.lat);
            const lng = parseFloat(awData?.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              setLatitude(lat);
              setLongitude(lng);
              setAddressValidated(true);
              return true;
            }
          }
        } catch {
          // continua para próximas estratégias
        }
      }

      // Estratégia 1: Nominatim por CEP
      if (!best && onlyZip.length === 8) {
        best = await nominatimSearch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&postalcode=${onlyZip}`
        );
      }

      // Estratégia 2: street + city + state (sem número)
      if (!best) {
        const q2 = `${values.address}, ${values.city}, ${values.state}, Brasil`;
        best = await nominatimSearch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&q=${encode(q2)}`
        );
      }

      // Estratégia 3: apenas cidade + estado
      if (!best) {
        const q3 = `${values.city}, ${values.state}, Brasil`;
        best = await nominatimSearch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&q=${encode(q3)}`
        );
      }

      if (best) {
        setLatitude(Number(best.lat));
        setLongitude(Number(best.lon));
        setAddressValidated(true);
        return true;
      } else {
        alert('Endereço não encontrado. Verifique os dados ou tente um endereço próximo.');
        setAddressValidated(false);
        return false;
      }
    } catch (err) {
      alert('Falha ao validar endereço.');
      setAddressValidated(false);
      return false;
    }
  };

  const buildSchedulingApiPatch = (): { usePlatformDefault: boolean; times?: string[] } | undefined => {
    if (!schedulingTouched) return undefined;
    if (schedulingPendingPlatformDefault) return { usePlatformDefault: true };
    const times = Array.from(new Set(schedulingDraft.filter(Boolean))).sort();
    return { usePlatformDefault: false, times };
  };

  const updateMutation = useMutation({
    mutationFn: (data: SalonForm) => {
      const schedulingPatch = buildSchedulingApiPatch();
      const payload: any = {
        ...data,
        phone: data.phone.replace(/\D/g, ''),
        whatsApp: data.whatsApp.replace(/\D/g, ''),
        state: normalizeUf(data.state),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        logoUrl: coverBase64 || undefined,
        gallery: galleryPayload.length > 0 ? JSON.stringify(galleryPayload) : undefined,
        ...(schedulingPatch ? { schedulingTimeOptions: schedulingPatch } : {}),
      };
      
      // Só envia schedulingTimeInterval se for diferente do padrão ou se houver mudança
      if (schedulingInterval !== 30 || schedulingTouched) {
        payload.schedulingTimeInterval = Number(schedulingInterval);
      }
      
      return salonsApi.update(activeSalon!.id, payload);
    },
    onSuccess: (response) => {
      setApiError('');
      qc.invalidateQueries({ queryKey: ['my-units'] });
      setSchedulingTouched(false);
      setSchedulingPendingPlatformDefault(false);
      setSchedulingEditOpen(false);
      
      // Update local state with fresh data from server
      if (response.data) {
        setSchedulingInterval(response.data.schedulingTimeInterval ?? 30);
        setSchedulingDraft([...(response.data.schedulingTimeOptionsEffective ?? [])]);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error, 'Nao foi possivel salvar a unidade.'));
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: CreateUnitForm) =>
      salonsApi.create({
        ...data,
        phone: data.phone?.replace(/\D/g, ''),
        whatsApp: data.whatsApp?.replace(/\D/g, ''),
        state: normalizeUf(data.state),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        zipCode: data.zipCode?.replace(/\D/g, '') || '',
        businessHours: data.businessHours || '',
        published: data.published ?? false,
        logoUrl: createCoverBase64 || undefined,
        gallery: createGalleryPayload.length > 0 ? JSON.stringify(createGalleryPayload) : undefined,
        active: true,
      }),
    onSuccess: (response) => {
      setApiError('');
      qc.invalidateQueries({ queryKey: ['my-units'] });
      setSalonId(response.data.id);
      setCreateModal(false);
      createUnitForm.reset();
      setCreateCoverBase64(null);
      setCreateCoverPreview(null);
      setCreateGalleryPayload([]);
      setCreateGalleryPreviews([]);
      setLatitude(null);
      setLongitude(null);
      setAddressValidated(false);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error, 'Nao foi possivel criar a unidade.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salonsApi.delete(id),
    onSuccess: () => {
      setApiError('');
      qc.invalidateQueries({ queryKey: ['my-units'] });
      setDeleteModal(false);
      setSalonId(null);
    },
    onError: (error) => {
      setApiError(getApiErrorMessage(error, 'Não foi possível excluir a unidade.'));
      setDeleteModal(false);
    },
  });

  const toggleSchedulingDraftSlot = (slot: string) => {
    setSchedulingTouched(true);
    setSchedulingPendingPlatformDefault(false);
    setSchedulingDraft((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return Array.from(next).sort();
    });
  };

  const handleUpdateSubmit = async (data: SalonForm) => {
    setApiError('');

    if (!addressValidated) {
      const ok = await validateAndGeocodeAddress({ getValues, setValue });
      if (!ok) return;
    }

    if (data.published && !canPublishCatalog) {
      setPublishFeedback('Voce precisa de uma assinatura ativa para publicar sua unidade. Salvamos as alteracoes como rascunho.');
      updateMutation.mutate({ ...data, published: false });
      return;
    }

    if (schedulingTouched && !schedulingPendingPlatformDefault && schedulingDraft.length === 0) {
      setApiError('Selecione ao menos um horário permitido ou clique em "Usar padrão da plataforma".');
      return;
    }

    setPublishFeedback('');
    updateMutation.mutate(data);
  };

  const handleCreateSubmit = async (data: CreateUnitForm) => {
    setApiError('');

    if (!addressValidated) {
      const ok = await validateAndGeocodeAddress(createUnitForm);
      if (!ok) return;
    }

    if (data.published && !canPublishCatalog) {
      setPublishFeedback('Voce precisa de uma assinatura ativa para publicar sua unidade. A nova unidade sera criada como rascunho.');
      createUnitMutation.mutate({ ...data, published: false });
      return;
    }

    setPublishFeedback('');
    createUnitMutation.mutate(data);
  };

  const getDisplayClientName = (clientName?: string, clientId?: number) => {
    const normalized = (clientName || '').trim();
    if (normalized && !/^\d+$/.test(normalized)) return normalized;
    return clientId ? `Cliente ${clientId}` : 'Cliente';
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Unidade</h1>
          <p className="text-gray-500 text-sm">Atualize as informações da sua unidade.</p>
        </div>
        <div className="flex gap-3">
          {salons && salons.length > 0 && (
            <select value={salonId ?? ''} onChange={e => setSalonId(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Button size="sm" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Nova unidade
          </Button>
        </div>
      </div>

      {isSalonsError && (
        <ApiErrorAlert
          message={getApiErrorMessage(salonsError, 'Falha ao carregar unidades.')}
          onRetry={() => refetchSalons()}
        />
      )}

      {apiError && <ApiErrorAlert message={apiError} />}

      {publishFeedback && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {publishFeedback}
        </div>
      )}

      {activeTab === 'reviews' && isReviewsError && (
        <ApiErrorAlert
          message={getApiErrorMessage(reviewsError, 'Falha ao carregar avaliações da unidade.')}
          onRetry={() => refetchReviews()}
        />
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'info' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Store className="w-4 h-4 inline mr-1.5" />
          Informações
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Star className="w-4 h-4 inline mr-1.5" />
          Avaliações
        </button>
      </div>

      {/* Tabs */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {!hasUnits ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">Nenhuma unidade cadastrada para exibir avaliações.</div>
          ) : !activeSalon ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">Selecione uma unidade para visualizar avaliações.</div>
          ) : !reviews ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">Carregando avaliações...</div>
          ) : reviews.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhuma avaliação ainda.
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(reviews.reduce((s,r) => s+r.rating,0)/reviews.length) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
                </div>
              </div>
              {/* List */}
              {reviews.map(review => {
                const displayClientName = getDisplayClientName(review.clientName, review.clientId);
                const initials = displayClientName
                  .split(' ')
                  .filter(n => n.length > 0)
                  .slice(0, 2)
                  .map(n => n[0].toUpperCase())
                  .join('');
                
                return (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar com iniciais */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
                          {initials || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 break-words">{displayClientName}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-4 h-4 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded p-3 border border-gray-100">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <>
          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Informações salvas com sucesso!
            </div>
          )}

          <Card title="Unidade Selecionada">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
                <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden min-h-44 flex items-center justify-center">
                  {selectedCover ? (
                    <img src={selectedCover} alt="Capa da unidade" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-7 h-7 mx-auto mb-2" />
                      <p className="text-sm">Sem foto de capa</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Nome" value={activeSalon?.name || '—'} />
                  <Info label="Status" value={activeSalon?.published ? 'Publicado' : 'Rascunho'} />
                  <Info label="Endereço" value={activeSalon?.address || '—'} />
                  <Info label="Cidade / UF" value={activeSalon ? `${activeSalon.city || '—'} / ${activeSalon.state || '—'}` : '—'} />
                  <Info label="Telefone" value={activeSalon?.phone || '—'} />
                  <Info label="WhatsApp" value={activeSalon?.whatsApp || '—'} />
                  <Info label="Instagram" value={activeSalon?.instagramUrl || '—'} />
                  <Info label="E-mail" value={activeSalon?.email || '—'} />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Galeria</p>
                {selectedGallery.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma foto na galeria.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedGallery.map((image, index) => (
                      <div key={`${image}-${index}`} className="h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                        <img src={image} alt={`Galeria ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="Horários da agenda">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Estes horários definem os <strong>intervalos permitidos</strong> na unidade (agenda dos profissionais e novos agendamentos).
                O padrão vem da configuração da plataforma; você pode restringir a lista para esta unidade.
              </p>
              
              {schedulingEditOpen && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Intervalo entre horários
                  </label>
                  <select
                    value={schedulingInterval}
                    onChange={(e) => {
                      const newInterval = Number(e.target.value);
                      setSchedulingInterval(newInterval);
                      setSchedulingTouched(true);
                      setSchedulingPendingPlatformDefault(false);
                      const newSlots = generateTimeSlots(newInterval);
                      setSchedulingDraft(newSlots);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Alterar o intervalo regenerará automaticamente os horários disponíveis
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    activeSalon?.schedulingUsesDefaultTimeOptions && !schedulingTouched
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {activeSalon?.schedulingUsesDefaultTimeOptions && !schedulingTouched
                    ? 'Padrão da plataforma'
                    : schedulingPendingPlatformDefault && schedulingTouched
                      ? 'Voltará ao padrão ao salvar'
                      : 'Personalizado para esta unidade'}
                </span>
                <span className="text-xs text-gray-500">
                  {(activeSalon?.schedulingTimeOptionsEffective?.length ?? 0)} horários ativos
                </span>
              </div>
              {!schedulingEditOpen ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {(activeSalon?.schedulingTimeOptionsEffective ?? []).length === 0 ? (
                    <span className="text-sm text-gray-400">Carregando grade…</span>
                  ) : (
                    activeSalon!.schedulingTimeOptionsEffective!.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                        {t}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Toque para incluir ou remover. Alterações serão aplicadas ao salvar o formulário abaixo.</p>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    {schedulingSlotPool.map((t) => {
                      const on = schedulingDraft.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleSchedulingDraftSlot(t)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            on
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSchedulingTouched(true);
                        setSchedulingPendingPlatformDefault(false);
                        setSchedulingDraft([...schedulingSlotPool]);
                      }}
                    >
                      Marcar todos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSchedulingTouched(true);
                        setSchedulingPendingPlatformDefault(false);
                        setSchedulingDraft([]);
                      }}
                    >
                      Limpar seleção
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {!schedulingEditOpen ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSchedulingEditOpen(true);
                      setSchedulingDraft([...(activeSalon?.schedulingTimeOptionsEffective ?? [])]);
                      setSchedulingPendingPlatformDefault(false);
                    }}
                  >
                    <Clock className="w-4 h-4" />
                    Personalizar horários
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSchedulingEditOpen(false);
                      setSchedulingDraft([...(activeSalon?.schedulingTimeOptionsEffective ?? [])]);
                    }}
                  >
                    Fechar edição
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSchedulingTouched(true);
                    setSchedulingPendingPlatformDefault(true);
                    setSchedulingEditOpen(false);
                  }}
                >
                  Usar padrão da plataforma
                </Button>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit(handleUpdateSubmit)} className="space-y-6">
            <Card title="Informações Gerais" action={
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-400" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeSalon?.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {activeSalon?.published ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nome da unidade *" {...register('name', { required: true })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
              <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" {...register('description')} />
            </div>
            <Input 
              label="Telefone *" 
              {...register('phone', { required: true })} 
              value={watch('phone')}
              onChange={(e) => setValue('phone', formatPhone(e.target.value))}
            />
            <Input label="E-mail" type="email" {...register('email')} />
            <Input 
              label="WhatsApp" 
              placeholder="Ex: (11) 99999-9999" 
              {...register('whatsApp')} 
              value={watch('whatsApp')}
              onChange={(e) => setValue('whatsApp', formatPhone(e.target.value))}
            />
            <Input label="Instagram" placeholder="https://instagram.com/..." {...register('instagramUrl')} />
          </div>
        </Card>

        <Card title="Endereço">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">CEP *</label>
              <div className="flex gap-2">
                <Input 
                  className="flex-1"
                  {...register('zipCode', { required: true })} 
                  value={watch('zipCode')}
                  onChange={(e) => {
                    setValue('zipCode', formatZipCode(e.target.value));
                    setAddressValidated(false);
                  }}
                  placeholder="00000-000"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => lookupAddressByZipCode({ getValues, setValue })}
                  loading={isZipLoading}
                >
                  <Search className="w-4 h-4 mr-1" /> Buscar
                </Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Input 
                label="Logradouro *" 
                {...register('address', { required: true })} 
                onChange={() => setAddressValidated(false)}
              />
            </div>
            <Input 
              label="Número" 
              {...register('number')} 
              onChange={() => setAddressValidated(false)}
            />
            <Input label="Complemento" {...register('complement')} />
            <Input 
              label="Bairro" 
              {...register('neighborhood')} 
              onChange={() => setAddressValidated(false)}
            />
            <div className="sm:col-span-1">
              <Input 
                label="Cidade *" 
                {...register('city', { required: true })} 
                onChange={() => setAddressValidated(false)}
              />
            </div>
            <div className="sm:col-span-1">
              <Input 
                label="Estado *" 
                {...register('state', { required: true })} 
                maxLength={2}
                onChange={(e) => {
                  setValue('state', e.target.value.toUpperCase());
                  setAddressValidated(false);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Input label="Ponto de Referência" {...register('referencePoint')} />
            </div>
            <div className="sm:col-span-2">
              <Button 
                type="button" 
                variant={addressValidated ? "outline" : "primary"} 
                className="w-full"
                onClick={() => validateAndGeocodeAddress({ getValues, setValue })}
              >
                <MapPin className={`w-4 h-4 mr-2 ${addressValidated ? 'text-green-500' : ''}`} />
                {addressValidated ? 'Endereço Validado' : 'Validar Endereço e Coordenadas'}
              </Button>
              {latitude && longitude && (
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Horários de Funcionamento">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Horários</label>
            <textarea
              rows={4}
              placeholder="Ex: Segunda a Sexta: 9h às 19h&#10;Sábado: 9h às 17h&#10;Domingo: Fechado"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              {...register('businessHours')}
            />
          </div>
        </Card>

        <Card title="Fotos da Unidade">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Foto de capa</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  await handleSelectCoverImage(e.target.files?.[0] ?? null, 'edit');
                  e.currentTarget.value = '';
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {selectedCover && (
              <div className="h-40 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img src={selectedCover} alt="Prévia da capa" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Galeria de fotos</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  await handleAppendGallery(e.target.files, 'edit');
                  e.currentTarget.value = '';
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {galleryPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {galleryPreviews.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <img src={image} alt={`Nova galeria ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
                        setGalleryPayload((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="Visibilidade">
          <label className={`flex items-center gap-3 ${canPublishCatalog ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              {...register('published')}
              disabled={!canPublishCatalog}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Publicar unidade</p>
              <p className="text-xs text-gray-500">Quando publicada, sua unidade aparece nas buscas do aplicativo.</p>
              {!canPublishCatalog && (
                <p className="text-xs text-amber-700 mt-1">É necessário uma assinatura ativa para publicar no catálogo.</p>
              )}
            </div>
          </label>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {salons && salons.length > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Unidade
            </Button>
          )}
          <div className="flex-1" />
          <Button type="submit" loading={updateMutation.isPending}>
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </div>
          </form>
        </>
      )}

      {/* Create Unit Modal */}
      <Modal
        open={createModal}
        onClose={() => {
          setCreateModal(false);
          createUnitForm.reset();
          setCreateCoverBase64(null);
          setCreateCoverPreview(null);
          setCreateGalleryPayload([]);
          setCreateGalleryPreviews([]);
          setLatitude(null);
          setLongitude(null);
          setAddressValidated(false);
        }}
        title="Nova unidade"
        footer={(
          <>
            <Button variant="outline" onClick={() => {
              setCreateModal(false);
              createUnitForm.reset();
              setCreateCoverBase64(null);
              setCreateCoverPreview(null);
              setCreateGalleryPayload([]);
              setCreateGalleryPreviews([]);
              setLatitude(null);
              setLongitude(null);
              setAddressValidated(false);
            }}>
              Cancelar
            </Button>
            <Button loading={createUnitMutation.isPending} onClick={createUnitForm.handleSubmit(handleCreateSubmit)}>Criar unidade</Button>
          </>
        )}
      >
        <form className="space-y-4">
          <Input label="Nome do Estabelecimento *" placeholder="Ex: Studio Glamour" {...createUnitForm.register('name', { required: true })} />
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">CEP *</label>
            <div className="flex gap-2">
              <Input 
                className="flex-1"
                {...createUnitForm.register('zipCode', { required: true })} 
                value={createUnitForm.watch('zipCode')}
                onChange={(e) => {
                  createUnitForm.setValue('zipCode', formatZipCode(e.target.value));
                  setAddressValidated(false);
                }}
                placeholder="00000-000"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => lookupAddressByZipCode(createUnitForm)}
                loading={isZipLoading}
              >
                <Search className="w-4 h-4 mr-1" /> Buscar
              </Button>
            </div>
          </div>

          <Input 
            label="Logradouro *" 
            placeholder="Rua/Avenida" 
            {...createUnitForm.register('address', { required: true })} 
            onChange={() => setAddressValidated(false)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Número" 
              {...createUnitForm.register('number')} 
              onChange={() => setAddressValidated(false)}
            />
            <Input label="Complemento" {...createUnitForm.register('complement')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Bairro" 
              {...createUnitForm.register('neighborhood')} 
              onChange={() => setAddressValidated(false)}
            />
            <Input label="Ponto de Referência" {...createUnitForm.register('referencePoint')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Cidade *" 
              {...createUnitForm.register('city', { required: true })} 
              onChange={() => setAddressValidated(false)}
            />
            <Input 
              label="Estado *" 
              {...createUnitForm.register('state', { required: true })} 
              maxLength={2}
              onChange={(e) => {
                createUnitForm.setValue('state', e.target.value.toUpperCase());
                setAddressValidated(false);
              }}
            />
          </div>

          <Button 
            type="button" 
            variant={addressValidated ? "outline" : "primary"} 
            className="w-full"
            onClick={() => validateAndGeocodeAddress(createUnitForm)}
          >
            <MapPin className={`w-4 h-4 mr-2 ${addressValidated ? 'text-green-500' : ''}`} />
            {addressValidated ? 'Endereço Validado' : 'Validar Endereço e Coordenadas'}
          </Button>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Sobre o Salão</label>
            <textarea
              rows={3}
              placeholder="Conte um pouco sobre a história e especialidades do salão..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              {...createUnitForm.register('description')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Horários de funcionamento</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Ex: Seg-Sex 09h às 19h"
              {...createUnitForm.register('businessHours')}
            />
          </div>
          <Input 
            label="Telefone *" 
            placeholder="(11) 99999-9999" 
            {...createUnitForm.register('phone', { required: true })} 
            value={createUnitForm.watch('phone')}
            onChange={(e) => createUnitForm.setValue('phone', formatPhone(e.target.value))}
          />
          <Input 
            label="WhatsApp (Com DDD)" 
            placeholder="Ex: (11) 99999-9999" 
            {...createUnitForm.register('whatsApp')} 
            value={createUnitForm.watch('whatsApp')}
            onChange={(e) => createUnitForm.setValue('whatsApp', formatPhone(e.target.value))}
          />
          <Input label="Instagram (opcional)" placeholder="https://instagram.com/seuperfil" {...createUnitForm.register('instagramUrl')} />
          <Input label="E-mail" type="email" {...createUnitForm.register('email')} />
          <label className={`flex items-center gap-2 text-sm text-gray-700 ${!canPublishCatalog ? 'cursor-not-allowed opacity-60' : ''}`}>
            <input
              type="checkbox"
              {...createUnitForm.register('published')}
              disabled={!canPublishCatalog}
              className="disabled:cursor-not-allowed"
            />
            Publicar unidade após criar
          </label>
          {!canPublishCatalog && (
            <p className="text-xs text-amber-700">Sem assinatura ativa, a unidade sera criada como rascunho.</p>
          )}

          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700">Fotos da unidade</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Foto de capa</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  await handleSelectCoverImage(e.target.files?.[0] ?? null, 'create');
                  e.currentTarget.value = '';
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {createCoverPreview && (
              <div className="h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img src={createCoverPreview} alt="Capa da nova unidade" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Galeria</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  await handleAppendGallery(e.target.files, 'create');
                  e.currentTarget.value = '';
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {createGalleryPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {createGalleryPreviews.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-20 rounded-lg border border-gray-200 overflow-hidden">
                    <img src={image} alt={`Nova galeria ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCreateGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
                        setCreateGalleryPayload((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Excluir Unidade"
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancelar</Button>
            <Button 
              variant="primary" 
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              loading={deleteMutation.isPending} 
              onClick={() => activeSalon && deleteMutation.mutate(activeSalon.id)}
            >
              Confirmar Exclusão
            </Button>
          </>
        )}
      >
        <div className="flex items-start gap-4 p-1">
          <div className="p-2 bg-red-100 rounded-full text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-900 font-medium mb-1">Esta ação não pode ser desfeita.</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tem certeza que deseja excluir a unidade <span className="font-semibold">"{activeSalon?.name}"</span>? 
              Todos os dados, agendamentos e profissionais vinculados a esta unidade serão removidos permanentemente.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value || '—'}</p>
    </div>
  );
}
