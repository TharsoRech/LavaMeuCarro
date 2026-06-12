import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const stateMap = {
    ACRE: 'AC', ALAGOAS: 'AL', AMAPA: 'AP', AMAZONAS: 'AM', BAHIA: 'BA', CEARA: 'CE',
    'DISTRITO FEDERAL': 'DF', ESPIRITO: 'ES', GOIAS: 'GO', MARANHAO: 'MA',
    'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS', MINAS: 'MG', PARA: 'PA',
    PARAIBA: 'PB', PARANA: 'PR', PERNAMBUCO: 'PE', PIAUI: 'PI', 'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN', 'RIO GRANDE DO SUL': 'RS', RONDONIA: 'RO',
    RORAIMA: 'RR', SANTA: 'SC', 'SAO PAULO': 'SP', SERGIPE: 'SE', TOCANTINS: 'TO'
};
const normalizeUf = (value) => {
    const v = (value || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(v))
        return v;
    for (const key of Object.keys(stateMap)) {
        if (v.includes(key))
            return stateMap[key];
    }
    return '';
};
const formatPhone = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 11);
    if (c.length <= 10) {
        const m = c.match(/^(\d{2})(\d{4})(\d{4})$/);
        return m ? `(${m[1]}) ${m[2]}-${m[3]}` : c;
    }
    const m = c.match(/^(\d{2})(\d{5})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : c;
};
const formatZipCode = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5)
        return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
export function AdminSalon() {
    const qc = useQueryClient();
    const { user } = useAdminAuth();
    const [saved, setSaved] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverBase64, setCoverBase64] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [galleryPayload, setGalleryPayload] = useState([]);
    const [createCoverPreview, setCreateCoverPreview] = useState(null);
    const [createCoverBase64, setCreateCoverBase64] = useState(null);
    const [createGalleryPreviews, setCreateGalleryPreviews] = useState([]);
    const [createGalleryPayload, setCreateGalleryPayload] = useState([]);
    const [apiError, setApiError] = useState('');
    const [publishFeedback, setPublishFeedback] = useState('');
    const [schedulingEditOpen, setSchedulingEditOpen] = useState(false);
    const [schedulingDraft, setSchedulingDraft] = useState([]);
    const [schedulingPendingPlatformDefault, setSchedulingPendingPlatformDefault] = useState(false);
    const [schedulingTouched, setSchedulingTouched] = useState(false);
    const [schedulingInterval, setSchedulingInterval] = useState(30);
    // Estados para geocodificação e endereço
    const [isZipLoading, setIsZipLoading] = useState(false);
    const [addressValidated, setAddressValidated] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
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
    const { salonId, setSalonId, activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);
    const activeSalon = salons?.find((s) => s.id === (activeSalonId ?? salons[0]?.id));
    const generateTimeSlots = useCallback((intervalMinutes) => {
        const slots = [];
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
        const g = (schedulingPoolGlobal?.filter(Boolean) ?? []);
        const eff = (activeSalon?.schedulingTimeOptionsEffective?.filter(Boolean) ?? []);
        const merged = g.length ? g : eff;
        const sorted = Array.from(new Set(merged)).sort();
        return sorted;
    }, [schedulingPoolGlobal, activeSalon?.schedulingTimeOptionsEffective, schedulingEditOpen, schedulingInterval, generateTimeSlots]);
    useEffect(() => {
        if (!activeSalon)
            return;
        const isCustom = activeSalon.schedulingUsesDefaultTimeOptions === false;
        setSchedulingEditOpen(isCustom);
        setSchedulingPendingPlatformDefault(false);
        setSchedulingTouched(false);
        setSchedulingDraft([...(activeSalon.schedulingTimeOptionsEffective ?? [])]);
        setSchedulingInterval(activeSalon.schedulingTimeInterval ?? 30);
    }, [activeSalon?.id]);
    const { data: reviews, isError: isReviewsError, error: reviewsError, refetch: refetchReviews } = useQuery({
        queryKey: ['salon-reviews', activeSalon?.id],
        queryFn: () => reviewsApi.bySalon(activeSalon.id).then(r => r.data),
        enabled: !!activeSalon && activeTab === 'reviews',
    });
    const { register, handleSubmit, reset, watch, setValue, getValues } = useForm();
    const createUnitForm = useForm();
    const toDisplayImage = useCallback((value) => {
        if (!value)
            return null;
        const trimmed = value.trim();
        if (!trimmed)
            return null;
        if (trimmed.startsWith('data:image') || trimmed.startsWith('http'))
            return trimmed;
        return `data:image/jpeg;base64,${trimmed}`;
    }, []);
    const stripImagePrefix = useCallback((value) => {
        if (!value)
            return null;
        const trimmed = value.trim();
        if (!trimmed)
            return null;
        const marker = 'base64,';
        const idx = trimmed.indexOf(marker);
        return idx >= 0 ? trimmed.slice(idx + marker.length) : trimmed;
    }, []);
    const parseGallery = useCallback((raw) => {
        if (!raw)
            return [];
        if (Array.isArray(raw))
            return raw.filter(Boolean);
        const value = raw.trim();
        if (!value)
            return [];
        if (value.startsWith('[')) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed))
                    return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
            }
            catch {
                // Keep fallback parsing below.
            }
        }
        if (value.includes(',')) {
            return value.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [value];
    }, []);
    const fileToBase64 = useCallback((file) => (new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
        reader.readAsDataURL(file);
    })), []);
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
    const selectedGallery = useMemo(() => galleryPreviews.length ? galleryPreviews : (parseGallery(activeSalon?.gallery).map((item) => toDisplayImage(item) || '').filter(Boolean)), [activeSalon?.gallery, galleryPreviews, parseGallery, toDisplayImage]);
    const selectedCover = coverPreview || toDisplayImage(activeSalon?.logoUrl ?? null);
    const handleSelectCoverImage = useCallback(async (file, mode = 'edit') => {
        if (!file)
            return;
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
    const handleAppendGallery = useCallback(async (files, mode = 'edit') => {
        if (!files?.length)
            return;
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
    const lookupAddressByZipCode = async (form) => {
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
            }
            catch {
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
        }
        catch (err) {
            alert('Erro ao buscar endereço pelo CEP.');
        }
        finally {
            setIsZipLoading(false);
        }
    };
    const nominatimSearch = async (url) => {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'HoraDaBelezaAdmin/1.0' } });
            if (!res.ok)
                return null;
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0)
                return data[0];
            return null;
        }
        catch {
            return null;
        }
    };
    const validateAndGeocodeAddress = async (form) => {
        const values = form.getValues();
        if (!values.address || !values.city || !values.state) {
            alert('Preencha logradouro, cidade e estado antes de validar.');
            return false;
        }
        const onlyZip = (values.zipCode || '').replace(/\D/g, '');
        const encode = encodeURIComponent;
        try {
            let best = null;
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
                }
                catch {
                    // continua para próximas estratégias
                }
            }
            // Estratégia 1: Nominatim por CEP
            if (!best && onlyZip.length === 8) {
                best = await nominatimSearch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&postalcode=${onlyZip}`);
            }
            // Estratégia 2: street + city + state (sem número)
            if (!best) {
                const q2 = `${values.address}, ${values.city}, ${values.state}, Brasil`;
                best = await nominatimSearch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&q=${encode(q2)}`);
            }
            // Estratégia 3: apenas cidade + estado
            if (!best) {
                const q3 = `${values.city}, ${values.state}, Brasil`;
                best = await nominatimSearch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&q=${encode(q3)}`);
            }
            if (best) {
                setLatitude(Number(best.lat));
                setLongitude(Number(best.lon));
                setAddressValidated(true);
                return true;
            }
            else {
                alert('Endereço não encontrado. Verifique os dados ou tente um endereço próximo.');
                setAddressValidated(false);
                return false;
            }
        }
        catch (err) {
            alert('Falha ao validar endereço.');
            setAddressValidated(false);
            return false;
        }
    };
    const buildSchedulingApiPatch = () => {
        if (!schedulingTouched)
            return undefined;
        if (schedulingPendingPlatformDefault)
            return { usePlatformDefault: true };
        const times = Array.from(new Set(schedulingDraft.filter(Boolean))).sort();
        return { usePlatformDefault: false, times };
    };
    const updateMutation = useMutation({
        mutationFn: (data) => {
            const schedulingPatch = buildSchedulingApiPatch();
            const payload = {
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
            return salonsApi.update(activeSalon.id, payload);
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
        mutationFn: (data) => salonsApi.create({
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
        mutationFn: (id) => salonsApi.delete(id),
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
    const toggleSchedulingDraftSlot = (slot) => {
        setSchedulingTouched(true);
        setSchedulingPendingPlatformDefault(false);
        setSchedulingDraft((prev) => {
            const next = new Set(prev);
            if (next.has(slot))
                next.delete(slot);
            else
                next.add(slot);
            return Array.from(next).sort();
        });
    };
    const handleUpdateSubmit = async (data) => {
        setApiError('');
        if (!addressValidated) {
            const ok = await validateAndGeocodeAddress({ getValues, setValue });
            if (!ok)
                return;
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
    const handleCreateSubmit = async (data) => {
        setApiError('');
        if (!addressValidated) {
            const ok = await validateAndGeocodeAddress(createUnitForm);
            if (!ok)
                return;
        }
        if (data.published && !canPublishCatalog) {
            setPublishFeedback('Voce precisa de uma assinatura ativa para publicar sua unidade. A nova unidade sera criada como rascunho.');
            createUnitMutation.mutate({ ...data, published: false });
            return;
        }
        setPublishFeedback('');
        createUnitMutation.mutate(data);
    };
    const getDisplayClientName = (clientName, clientId) => {
        const normalized = (clientName || '').trim();
        if (normalized && !/^\d+$/.test(normalized))
            return normalized;
        return clientId ? `Cliente ${clientId}` : 'Cliente';
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Minha Unidade" }), _jsx("p", { className: "text-gray-500 text-sm", children: "Atualize as informa\u00E7\u00F5es da sua unidade." })] }), _jsxs("div", { className: "flex gap-3", children: [salons && salons.length > 0 && (_jsx("select", { value: salonId ?? '', onChange: e => setSalonId(Number(e.target.value)), className: "border border-gray-300 rounded-lg px-3 py-2 text-sm", children: salons.map((s) => _jsx("option", { value: s.id, children: s.name }, s.id)) })), _jsxs(Button, { size: "sm", onClick: () => setCreateModal(true), children: [_jsx(Plus, { className: "w-4 h-4" }), "Nova unidade"] })] })] }), isSalonsError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(salonsError, 'Falha ao carregar unidades.'), onRetry: () => refetchSalons() })), apiError && _jsx(ApiErrorAlert, { message: apiError }), publishFeedback && (_jsx("div", { className: "p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800", children: publishFeedback })), activeTab === 'reviews' && isReviewsError && (_jsx(ApiErrorAlert, { message: getApiErrorMessage(reviewsError, 'Falha ao carregar avaliações da unidade.'), onRetry: () => refetchReviews() })), _jsxs("div", { className: "flex gap-1 border-b border-gray-200", children: [_jsxs("button", { onClick: () => setActiveTab('info'), className: `px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'info' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: [_jsx(Store, { className: "w-4 h-4 inline mr-1.5" }), "Informa\u00E7\u00F5es"] }), _jsxs("button", { onClick: () => setActiveTab('reviews'), className: `px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: [_jsx(Star, { className: "w-4 h-4 inline mr-1.5" }), "Avalia\u00E7\u00F5es"] })] }), activeTab === 'reviews' && (_jsx("div", { className: "space-y-4", children: !hasUnits ? (_jsx("div", { className: "bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400", children: "Nenhuma unidade cadastrada para exibir avalia\u00E7\u00F5es." })) : !activeSalon ? (_jsx("div", { className: "bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400", children: "Selecione uma unidade para visualizar avalia\u00E7\u00F5es." })) : !reviews ? (_jsx("div", { className: "bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400", children: "Carregando avalia\u00E7\u00F5es..." })) : reviews.length === 0 ? (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400", children: [_jsx(MessageSquare, { className: "w-8 h-8 mx-auto mb-2 opacity-40" }), "Nenhuma avalia\u00E7\u00E3o ainda."] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-bold text-indigo-600", children: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) }), _jsx("div", { className: "flex gap-0.5 justify-center mt-1", children: [1, 2, 3, 4, 5].map(n => (_jsx(Star, { className: `w-4 h-4 ${n <= Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}` }, n))) }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [reviews.length, " avalia\u00E7\u00E3o", reviews.length !== 1 ? 'ões' : ''] })] }) }), reviews.map((review) => {
                            const displayClientName = getDisplayClientName(review.clientName, review.clientId);
                            const initials = displayClientName
                                .split(' ')
                                .filter(n => n.length > 0)
                                .slice(0, 2)
                                .map(n => n[0].toUpperCase())
                                .join('');
                            return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm", children: initials || '?' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-sm text-slate-900 break-words", children: displayClientName }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: new Date(review.createdAt).toLocaleDateString('pt-BR') })] })] }), _jsx("div", { className: "flex gap-0.5 flex-shrink-0", children: [1, 2, 3, 4, 5].map(n => (_jsx(Star, { className: `w-4 h-4 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}` }, n))) })] }), review.comment && (_jsxs("p", { className: "text-sm text-gray-700 leading-relaxed bg-gray-50 rounded p-3 border border-gray-100", children: ["\"", review.comment, "\""] }))] }, review.id));
                        })] })) })), activeTab === 'info' && (_jsxs(_Fragment, { children: [saved && (_jsxs("div", { className: "p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2", children: [_jsx(Save, { className: "w-4 h-4" }), "Informa\u00E7\u00F5es salvas com sucesso!"] })), _jsx(Card, { title: "Unidade Selecionada", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4", children: [_jsx("div", { className: "border border-gray-200 rounded-lg bg-gray-50 overflow-hidden min-h-44 flex items-center justify-center", children: selectedCover ? (_jsx("img", { src: selectedCover, alt: "Capa da unidade", className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "text-center text-gray-400", children: [_jsx(ImageIcon, { className: "w-7 h-7 mx-auto mb-2" }), _jsx("p", { className: "text-sm", children: "Sem foto de capa" })] })) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm", children: [_jsx(Info, { label: "Nome", value: activeSalon?.name || '—' }), _jsx(Info, { label: "Status", value: activeSalon?.published ? 'Publicado' : 'Rascunho' }), _jsx(Info, { label: "Endere\u00E7o", value: activeSalon?.address || '—' }), _jsx(Info, { label: "Cidade / UF", value: activeSalon ? `${activeSalon.city || '—'} / ${activeSalon.state || '—'}` : '—' }), _jsx(Info, { label: "Telefone", value: activeSalon?.phone || '—' }), _jsx(Info, { label: "WhatsApp", value: activeSalon?.whatsApp || '—' }), _jsx(Info, { label: "Instagram", value: activeSalon?.instagramUrl || '—' }), _jsx(Info, { label: "E-mail", value: activeSalon?.email || '—' })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Galeria" }), selectedGallery.length === 0 ? (_jsx("p", { className: "text-sm text-gray-400", children: "Nenhuma foto na galeria." })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: selectedGallery.map((image, index) => (_jsx("div", { className: "h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50", children: _jsx("img", { src: image, alt: `Galeria ${index + 1}`, className: "w-full h-full object-cover" }) }, `${image}-${index}`))) }))] })] }) }), _jsx(Card, { title: "Hor\u00E1rios da agenda", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Estes hor\u00E1rios definem os ", _jsx("strong", { children: "intervalos permitidos" }), " na unidade (agenda dos profissionais e novos agendamentos). O padr\u00E3o vem da configura\u00E7\u00E3o da plataforma; voc\u00EA pode restringir a lista para esta unidade."] }), schedulingEditOpen && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-2", children: "Intervalo entre hor\u00E1rios" }), _jsxs("select", { value: schedulingInterval, onChange: (e) => {
                                                const newInterval = Number(e.target.value);
                                                setSchedulingInterval(newInterval);
                                                setSchedulingTouched(true);
                                                setSchedulingPendingPlatformDefault(false);
                                                const newSlots = generateTimeSlots(newInterval);
                                                setSchedulingDraft(newSlots);
                                            }, className: "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto", children: [_jsx("option", { value: 15, children: "15 minutos" }), _jsx("option", { value: 30, children: "30 minutos" }), _jsx("option", { value: 45, children: "45 minutos" }), _jsx("option", { value: 60, children: "1 hora" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Alterar o intervalo regenerar\u00E1 automaticamente os hor\u00E1rios dispon\u00EDveis" })] })), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: `text-xs font-semibold px-2 py-1 rounded-full ${activeSalon?.schedulingUsesDefaultTimeOptions && !schedulingTouched
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'bg-indigo-100 text-indigo-800'}`, children: activeSalon?.schedulingUsesDefaultTimeOptions && !schedulingTouched
                                                ? 'Padrão da plataforma'
                                                : schedulingPendingPlatformDefault && schedulingTouched
                                                    ? 'Voltará ao padrão ao salvar'
                                                    : 'Personalizado para esta unidade' }), _jsxs("span", { className: "text-xs text-gray-500", children: [(activeSalon?.schedulingTimeOptionsEffective?.length ?? 0), " hor\u00E1rios ativos"] })] }), !schedulingEditOpen ? (_jsx("div", { className: "flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-100", children: (activeSalon?.schedulingTimeOptionsEffective ?? []).length === 0 ? (_jsx("span", { className: "text-sm text-gray-400", children: "Carregando grade\u2026" })) : (activeSalon.schedulingTimeOptionsEffective.map((t) => (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700", children: t }, t)))) })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Toque para incluir ou remover. Altera\u00E7\u00F5es ser\u00E3o aplicadas ao salvar o formul\u00E1rio abaixo." }), _jsx("div", { className: "flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-indigo-50/50 rounded-lg border border-indigo-100", children: schedulingSlotPool.map((t) => {
                                                const on = schedulingDraft.includes(t);
                                                return (_jsx("button", { type: "button", onClick: () => toggleSchedulingDraftSlot(t), className: `text-xs px-2 py-1 rounded border transition-colors ${on
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`, children: t }, t));
                                            }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => {
                                                        setSchedulingTouched(true);
                                                        setSchedulingPendingPlatformDefault(false);
                                                        setSchedulingDraft([...schedulingSlotPool]);
                                                    }, children: "Marcar todos" }), _jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => {
                                                        setSchedulingTouched(true);
                                                        setSchedulingPendingPlatformDefault(false);
                                                        setSchedulingDraft([]);
                                                    }, children: "Limpar sele\u00E7\u00E3o" })] })] })), _jsxs("div", { className: "flex flex-wrap gap-2", children: [!schedulingEditOpen ? (_jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => {
                                                setSchedulingEditOpen(true);
                                                setSchedulingDraft([...(activeSalon?.schedulingTimeOptionsEffective ?? [])]);
                                                setSchedulingPendingPlatformDefault(false);
                                            }, children: [_jsx(Clock, { className: "w-4 h-4" }), "Personalizar hor\u00E1rios"] })) : (_jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => {
                                                setSchedulingEditOpen(false);
                                                setSchedulingDraft([...(activeSalon?.schedulingTimeOptionsEffective ?? [])]);
                                            }, children: "Fechar edi\u00E7\u00E3o" })), _jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => {
                                                setSchedulingTouched(true);
                                                setSchedulingPendingPlatformDefault(true);
                                                setSchedulingEditOpen(false);
                                            }, children: "Usar padr\u00E3o da plataforma" })] })] }) }), _jsxs("form", { onSubmit: handleSubmit(handleUpdateSubmit), className: "space-y-6", children: [_jsx(Card, { title: "Informa\u00E7\u00F5es Gerais", action: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Store, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${activeSalon?.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`, children: activeSalon?.published ? 'Publicado' : 'Rascunho' })] }), children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx("div", { className: "sm:col-span-2", children: _jsx(Input, { label: "Nome da unidade *", ...register('name', { required: true }) }) }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { rows: 3, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...register('description') })] }), _jsx(Input, { label: "Telefone *", ...register('phone', { required: true }), value: watch('phone'), onChange: (e) => setValue('phone', formatPhone(e.target.value)) }), _jsx(Input, { label: "E-mail", type: "email", ...register('email') }), _jsx(Input, { label: "WhatsApp", placeholder: "Ex: (11) 99999-9999", ...register('whatsApp'), value: watch('whatsApp'), onChange: (e) => setValue('whatsApp', formatPhone(e.target.value)) }), _jsx(Input, { label: "Instagram", placeholder: "https://instagram.com/...", ...register('instagramUrl') })] }) }), _jsx(Card, { title: "Endere\u00E7o", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "CEP *" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { className: "flex-1", ...register('zipCode', { required: true }), value: watch('zipCode'), onChange: (e) => {
                                                                setValue('zipCode', formatZipCode(e.target.value));
                                                                setAddressValidated(false);
                                                            }, placeholder: "00000-000" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => lookupAddressByZipCode({ getValues, setValue }), loading: isZipLoading, children: [_jsx(Search, { className: "w-4 h-4 mr-1" }), " Buscar"] })] })] }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Input, { label: "Logradouro *", ...register('address', { required: true }), onChange: () => setAddressValidated(false) }) }), _jsx(Input, { label: "N\u00FAmero", ...register('number'), onChange: () => setAddressValidated(false) }), _jsx(Input, { label: "Complemento", ...register('complement') }), _jsx(Input, { label: "Bairro", ...register('neighborhood'), onChange: () => setAddressValidated(false) }), _jsx("div", { className: "sm:col-span-1", children: _jsx(Input, { label: "Cidade *", ...register('city', { required: true }), onChange: () => setAddressValidated(false) }) }), _jsx("div", { className: "sm:col-span-1", children: _jsx(Input, { label: "Estado *", ...register('state', { required: true }), maxLength: 2, onChange: (e) => {
                                                    setValue('state', e.target.value.toUpperCase());
                                                    setAddressValidated(false);
                                                } }) }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Input, { label: "Ponto de Refer\u00EAncia", ...register('referencePoint') }) }), _jsxs("div", { className: "sm:col-span-2", children: [_jsxs(Button, { type: "button", variant: addressValidated ? "outline" : "primary", className: "w-full", onClick: () => validateAndGeocodeAddress({ getValues, setValue }), children: [_jsx(MapPin, { className: `w-4 h-4 mr-2 ${addressValidated ? 'text-green-500' : ''}` }), addressValidated ? 'Endereço Validado' : 'Validar Endereço e Coordenadas'] }), latitude && longitude && (_jsxs("p", { className: "text-[10px] text-gray-400 mt-1 text-center", children: ["Coordenadas: ", latitude.toFixed(6), ", ", longitude.toFixed(6)] }))] })] }) }), _jsx(Card, { title: "Hor\u00E1rios de Funcionamento", children: _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Hor\u00E1rios" }), _jsx("textarea", { rows: 4, placeholder: "Ex: Segunda a Sexta: 9h \u00E0s 19h\nS\u00E1bado: 9h \u00E0s 17h\nDomingo: Fechado", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...register('businessHours') })] }) }), _jsx(Card, { title: "Fotos da Unidade", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Foto de capa" }), _jsx("input", { type: "file", accept: "image/*", onChange: async (e) => {
                                                        await handleSelectCoverImage(e.target.files?.[0] ?? null, 'edit');
                                                        e.currentTarget.value = '';
                                                    }, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" })] }), selectedCover && (_jsx("div", { className: "h-40 rounded-lg border border-gray-200 overflow-hidden bg-gray-50", children: _jsx("img", { src: selectedCover, alt: "Pr\u00E9via da capa", className: "w-full h-full object-cover" }) })), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Galeria de fotos" }), _jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: async (e) => {
                                                        await handleAppendGallery(e.target.files, 'edit');
                                                        e.currentTarget.value = '';
                                                    }, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" })] }), galleryPreviews.length > 0 && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: galleryPreviews.map((image, index) => (_jsxs("div", { className: "relative h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50", children: [_jsx("img", { src: image, alt: `Nova galeria ${index + 1}`, className: "w-full h-full object-cover" }), _jsx("button", { type: "button", onClick: () => {
                                                            setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
                                                            setGalleryPayload((prev) => prev.filter((_, i) => i !== index));
                                                        }, className: "absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white", children: _jsx(Trash2, { className: "w-3 h-3" }) })] }, `${image}-${index}`))) }))] }) }), _jsx(Card, { title: "Visibilidade", children: _jsxs("label", { className: `flex items-center gap-3 ${canPublishCatalog ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`, children: [_jsx("input", { type: "checkbox", ...register('published'), disabled: !canPublishCatalog, className: "w-4 h-4 rounded text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Publicar unidade" }), _jsx("p", { className: "text-xs text-gray-500", children: "Quando publicada, sua unidade aparece nas buscas do aplicativo." }), !canPublishCatalog && (_jsx("p", { className: "text-xs text-amber-700 mt-1", children: "\u00C9 necess\u00E1rio uma assinatura ativa para publicar no cat\u00E1logo." }))] })] }) }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-between gap-4", children: [salons && salons.length > 1 && (_jsxs(Button, { type: "button", variant: "outline", className: "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700", onClick: () => setDeleteModal(true), children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Excluir Unidade"] })), _jsx("div", { className: "flex-1" }), _jsxs(Button, { type: "submit", loading: updateMutation.isPending, children: [_jsx(Save, { className: "w-4 h-4" }), "Salvar Altera\u00E7\u00F5es"] })] })] })] })), _jsx(Modal, { open: createModal, onClose: () => {
                    setCreateModal(false);
                    createUnitForm.reset();
                    setCreateCoverBase64(null);
                    setCreateCoverPreview(null);
                    setCreateGalleryPayload([]);
                    setCreateGalleryPreviews([]);
                    setLatitude(null);
                    setLongitude(null);
                    setAddressValidated(false);
                }, title: "Nova unidade", footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                setCreateModal(false);
                                createUnitForm.reset();
                                setCreateCoverBase64(null);
                                setCreateCoverPreview(null);
                                setCreateGalleryPayload([]);
                                setCreateGalleryPreviews([]);
                                setLatitude(null);
                                setLongitude(null);
                                setAddressValidated(false);
                            }, children: "Cancelar" }), _jsx(Button, { loading: createUnitMutation.isPending, onClick: createUnitForm.handleSubmit(handleCreateSubmit), children: "Criar unidade" })] })), children: _jsxs("form", { className: "space-y-4", children: [_jsx(Input, { label: "Nome do Estabelecimento *", placeholder: "Ex: Studio Glamour", ...createUnitForm.register('name', { required: true }) }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "CEP *" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { className: "flex-1", ...createUnitForm.register('zipCode', { required: true }), value: createUnitForm.watch('zipCode'), onChange: (e) => {
                                                createUnitForm.setValue('zipCode', formatZipCode(e.target.value));
                                                setAddressValidated(false);
                                            }, placeholder: "00000-000" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => lookupAddressByZipCode(createUnitForm), loading: isZipLoading, children: [_jsx(Search, { className: "w-4 h-4 mr-1" }), " Buscar"] })] })] }), _jsx(Input, { label: "Logradouro *", placeholder: "Rua/Avenida", ...createUnitForm.register('address', { required: true }), onChange: () => setAddressValidated(false) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "N\u00FAmero", ...createUnitForm.register('number'), onChange: () => setAddressValidated(false) }), _jsx(Input, { label: "Complemento", ...createUnitForm.register('complement') })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Bairro", ...createUnitForm.register('neighborhood'), onChange: () => setAddressValidated(false) }), _jsx(Input, { label: "Ponto de Refer\u00EAncia", ...createUnitForm.register('referencePoint') })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Cidade *", ...createUnitForm.register('city', { required: true }), onChange: () => setAddressValidated(false) }), _jsx(Input, { label: "Estado *", ...createUnitForm.register('state', { required: true }), maxLength: 2, onChange: (e) => {
                                        createUnitForm.setValue('state', e.target.value.toUpperCase());
                                        setAddressValidated(false);
                                    } })] }), _jsxs(Button, { type: "button", variant: addressValidated ? "outline" : "primary", className: "w-full", onClick: () => validateAndGeocodeAddress(createUnitForm), children: [_jsx(MapPin, { className: `w-4 h-4 mr-2 ${addressValidated ? 'text-green-500' : ''}` }), addressValidated ? 'Endereço Validado' : 'Validar Endereço e Coordenadas'] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Sobre o Sal\u00E3o" }), _jsx("textarea", { rows: 3, placeholder: "Conte um pouco sobre a hist\u00F3ria e especialidades do sal\u00E3o...", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", ...createUnitForm.register('description') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 block mb-1", children: "Hor\u00E1rios de funcionamento" }), _jsx("textarea", { rows: 3, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none", placeholder: "Ex: Seg-Sex 09h \u00E0s 19h", ...createUnitForm.register('businessHours') })] }), _jsx(Input, { label: "Telefone *", placeholder: "(11) 99999-9999", ...createUnitForm.register('phone', { required: true }), value: createUnitForm.watch('phone'), onChange: (e) => createUnitForm.setValue('phone', formatPhone(e.target.value)) }), _jsx(Input, { label: "WhatsApp (Com DDD)", placeholder: "Ex: (11) 99999-9999", ...createUnitForm.register('whatsApp'), value: createUnitForm.watch('whatsApp'), onChange: (e) => createUnitForm.setValue('whatsApp', formatPhone(e.target.value)) }), _jsx(Input, { label: "Instagram (opcional)", placeholder: "https://instagram.com/seuperfil", ...createUnitForm.register('instagramUrl') }), _jsx(Input, { label: "E-mail", type: "email", ...createUnitForm.register('email') }), _jsxs("label", { className: `flex items-center gap-2 text-sm text-gray-700 ${!canPublishCatalog ? 'cursor-not-allowed opacity-60' : ''}`, children: [_jsx("input", { type: "checkbox", ...createUnitForm.register('published'), disabled: !canPublishCatalog, className: "disabled:cursor-not-allowed" }), "Publicar unidade ap\u00F3s criar"] }), !canPublishCatalog && (_jsx("p", { className: "text-xs text-amber-700", children: "Sem assinatura ativa, a unidade sera criada como rascunho." })), _jsxs("div", { className: "space-y-3 border border-gray-200 rounded-lg p-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Fotos da unidade" }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-500 block mb-1", children: "Foto de capa" }), _jsx("input", { type: "file", accept: "image/*", onChange: async (e) => {
                                                await handleSelectCoverImage(e.target.files?.[0] ?? null, 'create');
                                                e.currentTarget.value = '';
                                            }, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" })] }), createCoverPreview && (_jsx("div", { className: "h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-50", children: _jsx("img", { src: createCoverPreview, alt: "Capa da nova unidade", className: "w-full h-full object-cover" }) })), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-500 block mb-1", children: "Galeria" }), _jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: async (e) => {
                                                await handleAppendGallery(e.target.files, 'create');
                                                e.currentTarget.value = '';
                                            }, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" })] }), createGalleryPreviews.length > 0 && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: createGalleryPreviews.map((image, index) => (_jsxs("div", { className: "relative h-20 rounded-lg border border-gray-200 overflow-hidden", children: [_jsx("img", { src: image, alt: `Nova galeria ${index + 1}`, className: "w-full h-full object-cover" }), _jsx("button", { type: "button", onClick: () => {
                                                    setCreateGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
                                                    setCreateGalleryPayload((prev) => prev.filter((_, i) => i !== index));
                                                }, className: "absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white", children: _jsx(Trash2, { className: "w-3 h-3" }) })] }, `${image}-${index}`))) }))] })] }) }), _jsx(Modal, { open: deleteModal, onClose: () => setDeleteModal(false), title: "Excluir Unidade", footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteModal(false), children: "Cancelar" }), _jsx(Button, { variant: "primary", className: "bg-red-600 hover:bg-red-700 text-white border-none", loading: deleteMutation.isPending, onClick: () => activeSalon && deleteMutation.mutate(activeSalon.id), children: "Confirmar Exclus\u00E3o" })] })), children: _jsxs("div", { className: "flex items-start gap-4 p-1", children: [_jsx("div", { className: "p-2 bg-red-100 rounded-full text-red-600 flex-shrink-0", children: _jsx(AlertTriangle, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-900 font-medium mb-1", children: "Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita." }), _jsxs("p", { className: "text-sm text-gray-500 leading-relaxed", children: ["Tem certeza que deseja excluir a unidade ", _jsxs("span", { className: "font-semibold", children: ["\"", activeSalon?.name, "\""] }), "? Todos os dados, agendamentos e profissionais vinculados a esta unidade ser\u00E3o removidos permanentemente."] })] })] }) })] }));
}
function Info({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-gray-200 px-3 py-2 bg-gray-50", children: [_jsx("p", { className: "text-[11px] uppercase tracking-wide text-gray-500", children: label }), _jsx("p", { className: "text-sm font-medium text-gray-900 break-words", children: value || '—' })] }));
}
