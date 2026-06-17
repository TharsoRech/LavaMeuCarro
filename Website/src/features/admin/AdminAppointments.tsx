import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Filter, Search, UserRound, Scissors, Clock3, LayoutList, Calendar, ChevronLeft, ChevronRight, Loader2, Plus, MessageCircle, MapPin, History, X, RefreshCw, Car } from 'lucide-react';
import { salonsApi, appointmentsApi, professionalsApi, servicesApi, clientsApi, getVeiculosByUnidade, getVeiculoAdmin, getVeiculoAppointments } from '../../api';
import { getStatusBadge as StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { AppointmentClientDto, AppointmentDto, AppointmentPagedResponseDto, AppointmentProfessionalOptionDto, ClientAppointmentHistoryItemDto, Servico, Veiculo } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminAuth } from '../../stores/authStore';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';
import { useNotifications } from '../../hooks/useNotifications';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00
const DEFAULT_LOOKBACK_DAYS = 60;
const DEFAULT_LOOKAHEAD_DAYS = 120;
const APPOINTMENTS_PAGE_SIZE = 25;
const PENDING_APPOINTMENT_DETAIL_KEY = 'admin_open_appointment_detail_id';
// Refresh silencioso da lista de agendamentos a cada 30s e ao receber novas notifs.
const APPOINTMENTS_SILENT_REFRESH_INTERVAL_MS = 30 * 1000;

export function AdminAppointments() {
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const [dateFilter, setDateFilter] = useState('');
  const [pendingDateFilter, setPendingDateFilter] = useState('');
  const [professionalFilter, setProfessionalFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AppointmentDto['status'] | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AppointmentDto | null>(null);
  const [detailInlineAction, setDetailInlineAction] = useState<null | 'cancel' | 'reassign'>(null);
  const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reassignProfessionalId, setReassignProfessionalId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: number; action: 'confirm' | 'complete' | 'noshow' | 'cancel' } | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updateBannerVisible, setUpdateBannerVisible] = useState(false);
  const previousItemCountRef = useRef<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createProfessionalId, setCreateProfessionalId] = useState<number | null>(null);
  const [createServiceId, setCreateServiceId] = useState<number | null>(null);
  const [createScheduledAt, setCreateScheduledAt] = useState('');
  const [createPickDate, setCreatePickDate] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createClientMode, setCreateClientMode] = useState<'existing' | 'new'>('existing');
  const [createClientSearch, setCreateClientSearch] = useState('');
  const [createSelectedClientId, setCreateSelectedClientId] = useState<number | null>(null);
  const [createClientName, setCreateClientName] = useState('');
  const [createClientPhone, setCreateClientPhone] = useState('');
  const [createClientEmail, setCreateClientEmail] = useState('');
  const [createClientDoc, setCreateClientDoc] = useState('');
  const [createMsg, setCreateMsg] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'vehicles'>(() => {
    const saved = localStorage.getItem('appointments_view_mode');
    return (saved === 'calendar' || saved === 'list' || saved === 'vehicles') ? saved : 'list';
  });
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [calendarWeek, setCalendarWeek] = useState(new Date());
  const [vehicleDetailId, setVehicleDetailId] = useState<number | null>(null);

  const { data: salons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits(),
  });

  const { activeSalonId: activeSalon, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);

  // Keep pendingDateFilter in sync with dateFilter when dateFilter changes externally
  useEffect(() => {
    setPendingDateFilter(dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchFilter(searchFilter.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchFilter]);

  const onSalonChange = (nextSalonId: number) => {
    handleSalonChange(nextSalonId);
    setProfessionalFilter('all');
  };

  const { data: professionals } = useQuery({
    queryKey: ['professionals-filter', activeSalon],
    queryFn: () => professionalsApi.bySalon(activeSalon as number),
    enabled: !!activeSalon,
  });

  useEffect(() => {
    if (professionalFilter === 'all') return;
    if (!professionals?.length) {
      setProfessionalFilter('all');
      return;
    }

    const filterStillExists = professionals.some((professional) => professional.userId === professionalFilter);
    if (!filterStillExists) {
      setProfessionalFilter('all');
    }
  }, [professionalFilter, professionals]);

  const { data: services } = useQuery({
    queryKey: ['services-for-appointments', activeSalon],
    queryFn: () => servicesApi.list(activeSalon as number),
    enabled: !!activeSalon,
  });

  const listStartDate = dateFilter ? undefined : format(addDays(new Date(), -DEFAULT_LOOKBACK_DAYS), 'yyyy-MM-dd');
  const listEndDate = dateFilter ? undefined : format(addDays(new Date(), DEFAULT_LOOKAHEAD_DAYS), 'yyyy-MM-dd');

  const { data: pagedAppointments, isLoading: isPagedLoading, isFetching: isPagedFetching, isError: isPagedError, error: pagedError, refetch: refetchPagedAppointments } = useQuery<AppointmentPagedResponseDto>({
    queryKey: ['appointments-paged', activeSalon, currentPage, dateFilter, includeCancelled, professionalFilter, statusFilter, debouncedSearchFilter, listStartDate, listEndDate],
    queryFn: () =>
      appointmentsApi.bySalonPaged(
        activeSalon as number,
        currentPage,
        APPOINTMENTS_PAGE_SIZE,
        dateFilter || undefined,
        professionalFilter === 'all' ? undefined : professionalFilter,
        includeCancelled,
        listStartDate,
        listEndDate,
        statusFilter === 'all' ? undefined : String(statusFilter),
        debouncedSearchFilter,
        true,
      ),
    enabled: !!activeSalon && viewMode === 'list',
    placeholderData: (previousData) => previousData,
    retry: 0,
    // Atualizacao silenciosa: mantem dado antigo (placeholderData) enquanto busca novo.
    refetchOnWindowFocus: true,
    refetchInterval: APPOINTMENTS_SILENT_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  const { data: calendarAppointments, isLoading: isCalendarLoading, isFetching: isCalendarFetching, isError: isCalendarError, error: calendarError, refetch: refetchCalendarAppointments } = useQuery({
    queryKey: ['appointments-calendar', activeSalon, dateFilter, includeCancelled, professionalFilter, DEFAULT_LOOKBACK_DAYS, DEFAULT_LOOKAHEAD_DAYS],
    queryFn: () =>
      appointmentsApi.bySalon(
        activeSalon as number,
        dateFilter || undefined,
        professionalFilter === 'all' ? undefined : professionalFilter,
        includeCancelled,
        listStartDate,
        listEndDate,
        true,
      ),
    enabled: !!activeSalon && viewMode === 'calendar',
    placeholderData: (previousData) => previousData,
    retry: 0,
    refetchOnWindowFocus: true,
    refetchInterval: APPOINTMENTS_SILENT_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSalon, dateFilter, professionalFilter, statusFilter, includeCancelled, debouncedSearchFilter, viewMode]);

  // Refresh silencioso ao receber novas notificacoes (push de novo/alterado agendamento).
  // Quando o unreadCount sobe, invalida as queries de agendamentos sem mostrar spinner global.
  const { unreadCount } = useNotifications();
  const lastUnreadCountRef = useRef<number>(unreadCount);
  useEffect(() => {
    const previous = lastUnreadCountRef.current;
    if (unreadCount > previous) {
      qc.invalidateQueries({ queryKey: ['appointments-paged'] });
      qc.invalidateQueries({ queryKey: ['appointments-calendar'] });
      if (selectedApt?.id) {
        qc.invalidateQueries({ queryKey: ['appointment-details', selectedApt.id] });
      }
      setUpdateBannerVisible(true);
    }
    lastUnreadCountRef.current = unreadCount;
  }, [unreadCount, qc, selectedApt?.id]);

  // Detect silent data changes from background refresh and show update banner.
  useEffect(() => {
    const currentCount = pagedAppointments?.total ?? calendarAppointments?.length ?? 0;
    if (previousItemCountRef.current !== null && previousItemCountRef.current !== currentCount && currentCount > 0) {
      setUpdateBannerVisible(true);
    }
    previousItemCountRef.current = currentCount;
  }, [pagedAppointments?.total, calendarAppointments?.length]);

  const { data: selectedAptDetails } = useQuery({
    queryKey: ['appointment-details', selectedApt?.id],
    queryFn: () => appointmentsApi.getById(selectedApt!.id),
    enabled: !!selectedApt,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!selectedAptDetails) return;
    setSelectedApt((current) => {
      if (!current || current.id !== selectedAptDetails.id) return current;
      return selectedAptDetails;
    });
  }, [selectedAptDetails]);

  const { data: clientHistory, isLoading: clientHistoryLoading, isError: clientHistoryIsError, error: clientHistoryError, refetch: refetchClientHistory } = useQuery({
    queryKey: ['client-appointment-history', selectedApt?.id],
    queryFn: () => appointmentsApi.clientHistory(selectedApt!.id),
    enabled: clientHistoryOpen && !!selectedApt,
  });

  const { data: unitVehicles, isLoading: vehiclesLoading } = useQuery<Veiculo[]>({
    queryKey: ['unit-vehicles', activeSalon],
    queryFn: () => getVeiculosByUnidade(activeSalon as number),
    enabled: !!activeSalon && viewMode === 'vehicles',
  });

  const filteredVehicles = useMemo(() => {
    if (!unitVehicles) return [];
    if (!vehicleSearch.trim()) return unitVehicles;
    const s = vehicleSearch.trim().toLowerCase();
    return unitVehicles.filter(v =>
      v.placa.toLowerCase().includes(s) ||
      v.modelo.toLowerCase().includes(s) ||
      v.marca.toLowerCase().includes(s) ||
      (v.clientName || '').toLowerCase().includes(s)
    );
  }, [unitVehicles, vehicleSearch]);

  const { data: vehicleDetail } = useQuery({
    queryKey: ['vehicle-detail', vehicleDetailId],
    queryFn: () => getVeiculoAdmin(vehicleDetailId!),
    enabled: !!vehicleDetailId,
  });

  const { data: vehicleHistory, isLoading: vehicleHistoryLoading } = useQuery({
    queryKey: ['vehicle-history', vehicleDetailId, activeSalon],
    queryFn: () => getVeiculoAppointments(vehicleDetailId!, activeSalon as number),
    enabled: !!vehicleDetailId && !!activeSalon,
  });

  const { data: createAvailabilityCal, isFetching: isLoadingCreateCal } = useQuery({
    queryKey: ['admin-availability-cal', createProfessionalId, createServiceId],
    queryFn: () =>
      professionalsApi.timeOptions(),
    enabled: !!createProfessionalId && !!createServiceId && createModalOpen,
  });

  const { data: searchedClients = [], isFetching: isSearchingClients } = useQuery({
    queryKey: ['manual-appointment-clients', activeSalon, createClientSearch],
    queryFn: () => clientsApi.searchClients(createClientSearch.trim()),
    enabled: !!activeSalon && createModalOpen && createClientMode === 'existing' && createClientSearch.trim().length >= 2,
  });

  const filteredAppointments = useMemo(() => {
    if (viewMode === 'list') {
      return pagedAppointments?.items ?? [];
    }

    const list = calendarAppointments ?? [];
    return list.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (!searchFilter.trim()) return true;
      const s = searchFilter.trim().toLowerCase();
      return (
        apt.clientName.toLowerCase().includes(s)
        || (apt.servicoName || '').toLowerCase().includes(s)
        || (apt.funcionarioName || '').toLowerCase().includes(s)
      );
    });
  }, [calendarAppointments, pagedAppointments?.items, searchFilter, statusFilter, viewMode]);

  const isLoading = viewMode === 'list' ? isPagedLoading : isCalendarLoading;
  const isFetching = viewMode === 'list' ? isPagedFetching : isCalendarFetching;
  const isError = viewMode === 'list' ? isPagedError : isCalendarError;
  const error = viewMode === 'list' ? pagedError : calendarError;
  const refetch = viewMode === 'list' ? refetchPagedAppointments : refetchCalendarAppointments;
  const isRefreshingAppointments = isFetching && !isLoading;

  const { data: eligibleProfessionals = [], isFetching: isLoadingEligibleProfessionals, isError: isEligibleProfessionalsError, error: eligibleProfessionalsError, refetch: refetchEligibleProfessionals } = useQuery({
    queryKey: ['appointment-eligible-professionals', selectedApt?.id, detailInlineAction],
    queryFn: () => professionalsApi.bySalon(activeSalon as number),
    enabled: !!selectedApt && detailInlineAction === 'reassign',
  });

  const stats = useMemo(() => {
    const list = filteredAppointments;
    return {
      total: list.length,
      pending: list.filter((item) => item.status === 'Pending').length,
      confirmed: list.filter((item) => item.status === 'Confirmed').length,
      today: list.filter((item) => format(new Date(item.scheduledAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
    };
  }, [filteredAppointments]);

  const invalidateAppointmentsData = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['appointments-paged'] }),
      qc.invalidateQueries({ queryKey: ['appointments-calendar'] }),
      qc.invalidateQueries({ queryKey: ['appointment-details'] }),
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      qc.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };

  // Check for pending appointment to open from notification
  const checkAndOpenPendingAppointment = () => {
    if (typeof window === 'undefined') return;

    const pendingId = window.localStorage.getItem(PENDING_APPOINTMENT_DETAIL_KEY);
    console.log('[AdminAppointments] Checking pending appointment:', pendingId);
    if (!pendingId) return;

    const appointmentId = Number(pendingId);
    if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
      window.localStorage.removeItem(PENDING_APPOINTMENT_DETAIL_KEY);
      return;
    }

    console.log('[AdminAppointments] Opening pending appointment:', appointmentId);
    appointmentsApi.getById(appointmentId).then((appointment) => {
      console.log('[AdminAppointments] Got appointment:', appointment);
      const aptData = appointment?.data ?? appointment;
      console.log('[AdminAppointments] Setting selectedApt:', aptData);
      setSelectedApt(aptData);
    }).catch((err) => {
      console.error('[AdminAppointments] Error loading appointment:', err);
    }).finally(() => {
      window.localStorage.removeItem(PENDING_APPOINTMENT_DETAIL_KEY);
    });
  };

  useEffect(() => {
    checkAndOpenPendingAppointment();

    // Also check when the page becomes visible again or regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndOpenPendingAppointment();
      }
    };
    const handleFocus = () => checkAndOpenPendingAppointment();
    // Listen for clicks anywhere on the page (catches navigation from notification center)
    const handleClick = () => {
      setTimeout(checkAndOpenPendingAppointment, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleFocus);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleFocus);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Helper to apply optimistic status update to the cached list
  const applyOptimisticStatus = (id: number, newStatus: AppointmentDto['status']) => {
    qc.setQueriesData<AppointmentPagedResponseDto>(
      { queryKey: ['appointments-paged'], exact: false },
      (old) => old
        ? {
          ...old,
          items: old.items.map((apt) => apt.id === id ? { ...apt, status: newStatus } : apt),
        }
        : old,
    );

    qc.setQueriesData<AppointmentDto[]>(
      { queryKey: ['appointments-calendar'], exact: false },
      (old) => old ? old.map((apt) => apt.id === id ? { ...apt, status: newStatus } : apt) : old,
    );

    qc.setQueriesData<AppointmentDto>(
      { queryKey: ['appointment-details', id], exact: true },
      (old) => old ? { ...old, status: newStatus } : old,
    );

    setSelectedApt((old) => old && old.id === id ? { ...old, status: newStatus } : old);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, action }: { id: number; status: number; action: 'confirm' | 'complete' | 'noshow' }) => {
      setPendingAction({ id, action });
      return appointmentsApi.updateStatus(id, String(status));
    },
    onMutate: ({ id, status }) => {
      const statusMap: Record<number, AppointmentDto['status']> = { 2: 'Confirmed', 4: 'Completed', 5: 'NoShow' };
      const newStatus = statusMap[status];
      if (newStatus) applyOptimisticStatus(id, newStatus);
    },
    onSuccess: async (_data, variables) => {
      await invalidateAppointmentsData();
      const statusLabel: Record<string, string> = { confirm: 'confirmado', complete: 'concluído', noshow: 'marcado como não compareceu' };
      setActionNotice({ type: 'success', message: `Status do agendamento #${variables.id} atualizado para ${statusLabel[variables.action] ?? variables.action}. O cliente recebeu uma notificação push.` });
    },
    onError: async (error) => {
      await invalidateAppointmentsData();
      setActionNotice({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível atualizar o status do agendamento.') });
    },
    onSettled: () => setPendingAction(null),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => {
      setPendingAction({ id, action: 'cancel' });
      console.info('[AdminAppointments.cancelMutation] Iniciando cancelamento', { id, hasReason: !!reason });
      return appointmentsApi.cancel(id, reason);
    },
    onMutate: ({ id }) => {
      applyOptimisticStatus(id, 'Cancelled');
    },
    onSuccess: async (_data, variables) => {
      await invalidateAppointmentsData();
      setDetailInlineAction(null);
      setCancelReason('');
      setActionNotice({ type: 'success', message: `Agendamento #${variables.id} cancelado com sucesso. O cliente recebeu uma notificação push.` });
    },
    onError: async (error: any) => {
      console.error('[AdminAppointments.cancelMutation] Erro ao cancelar', error?.response?.status, error?.message);
      await invalidateAppointmentsData();
      const statusCode = error?.response?.status;
      let message = getApiErrorMessage(error, 'Não foi possível cancelar o agendamento.');
      if (statusCode === 401) {
        message = 'Sua sessão expirou. Por favor, faça login novamente.';
      } else if (statusCode === 403) {
        message = 'Você não tem permissão para cancelar este agendamento.';
      }
      setActionNotice({ type: 'error', message });
    },
    onSettled: () => setPendingAction(null),
  });

  const reassignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApt || !reassignProfessionalId) {
        throw new Error('Selecione o novo profissional para continuar.');
      }
      await appointmentsApi.changeProfessional(selectedApt.id, reassignProfessionalId);
    },
    onSuccess: async () => {
      await invalidateAppointmentsData();
      setDetailInlineAction(null);
      setReassignProfessionalId(null);
      setSelectedApt(null);
      setActionNotice({ type: 'success', message: 'Profissional alterado com sucesso.' });
    },
    onError: (error) => {
      setActionNotice({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível alterar o profissional do agendamento.') });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: () => {
      if (!activeSalon || !createProfessionalId || !createServiceId || !createScheduledAt) {
        throw new Error('Preencha profissional, serviço e data/hora.');
      }

      if (createClientMode === 'existing' && !createSelectedClientId) {
        throw new Error('Selecione um cliente existente para continuar.');
      }

      if (createClientMode === 'new' && !createClientName.trim()) {
        throw new Error('Informe ao menos o nome do novo cliente.');
      }

      return appointmentsApi.createManual({
        professionalId: createProfessionalId,
        serviceId: createServiceId,
        salonId: activeSalon,
        scheduledAt: createScheduledAt,
        notes: createNotes.trim() || undefined,
        clientId: createClientMode === 'existing' ? createSelectedClientId ?? undefined : undefined,
        client: createClientMode === 'new'
          ? {
            name: createClientName.trim(),
            phone: createClientPhone.trim() || undefined,
            email: createClientEmail.trim().toLowerCase() || undefined,
            doc: createClientDoc.trim() || undefined,
          }
          : undefined,
      });
    },
    onSuccess: () => {
      void invalidateAppointmentsData();
      setCreateMsg('Agendamento criado com sucesso!');
      setTimeout(() => {
        setCreateModalOpen(false);
        resetCreateForm();
      }, 1200);
    },
    onError: (error) => {
      setCreateMsg(getApiErrorMessage(error, 'Não foi possível criar o agendamento.'));
    },
  });

  const selectedClient = useMemo<AppointmentClientDto | null>(
    () => searchedClients.find((client) => client.id === createSelectedClientId) ?? null,
    [createSelectedClientId, searchedClients]
  );

  useEffect(() => {
    setCreatePickDate('');
    setCreateScheduledAt('');
  }, [createProfessionalId, createServiceId]);

  useEffect(() => {
    if (!createAvailabilityCal?.length || createPickDate) return;
    const first = createAvailabilityCal.find((d) => d.availableTimes.length > 0);
    if (first) setCreatePickDate(first.date);
  }, [createAvailabilityCal, createPickDate]);

  const resetCreateForm = () => {
    setCreateMsg('');
    setCreateProfessionalId(null);
    setCreateServiceId(null);
    setCreateScheduledAt('');
    setCreatePickDate('');
    setCreateNotes('');
    setCreateClientMode('existing');
    setCreateClientSearch('');
    setCreateSelectedClientId(null);
    setCreateClientName('');
    setCreateClientPhone('');
    setCreateClientEmail('');
    setCreateClientDoc('');
  };

  const renderClientOption = (client: AppointmentClientDto) => {
    return client.name;
  };

  const activeServices = useMemo(() => (services ?? []).filter((service) => service.active !== false), [services]);

  const selectedProfessional = useMemo(
    () => (professionals ?? []).find((professional) => professional.id === createProfessionalId),
    [createProfessionalId, professionals]
  );

  const servicesForSelectedProfessional = useMemo(() => {
    if (!selectedProfessional) return activeServices;

    const professionalServiceIds = new Set(
      (selectedProfessional.serviceIds ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    if (professionalServiceIds.size === 0) return [] as Servico[];
    return activeServices.filter((service) => professionalServiceIds.has(service.id));
  }, [activeServices, selectedProfessional]);

  const selectedService = useMemo<Servico | undefined>(
    () => servicesForSelectedProfessional.find((service) => service.id === createServiceId),
    [servicesForSelectedProfessional, createServiceId]
  );

  useEffect(() => {
    if (!createServiceId) return;
    const isStillValid = servicesForSelectedProfessional.some((service) => service.id === createServiceId);
    if (!isStillValid) {
      setCreateServiceId(null);
    }
  }, [createServiceId, servicesForSelectedProfessional]);

  const toInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  };

  const canCompleteAppointment = (apt: AppointmentDto) => {
    if (apt.status !== 'Confirmed') return false;
    const durationMinutes = apt.durationMinutes > 0 ? apt.durationMinutes : 30;
    const endAt = new Date(new Date(apt.scheduledAt).getTime() + (durationMinutes * 60 * 1000));
    return endAt <= new Date();
  };

  const buildWhatsAppLink = (phone?: string | null) => {
    const digits = (phone ?? '').replace(/\D/g, '');
    if (!digits) return null;

    const normalized = digits.startsWith('55')
      ? digits
      : digits.length === 10 || digits.length === 11
        ? `55${digits}`
        : digits;

    if (normalized.length < 12) return null;

    const text = encodeURIComponent('Olá! Estou entrando em contato sobre o seu agendamento na Hora da Beleza.');
    return `https://wa.me/${normalized}?text=${text}`;
  };

  const selectedAptWhatsAppLink = buildWhatsAppLink(selectedApt?.clientPhone);

  // Calendar helpers
  const weekStart = startOfWeek(calendarWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const aptsByDay = useMemo(() => {
    const map = new Map<string, AppointmentDto[]>();
    for (const apt of filteredAppointments) {
      const key = format(new Date(apt.scheduledAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    }
    return map;
  }, [filteredAppointments]);

  const statusColor: Record<string, string> = {
    Pending: 'bg-blue-500 text-white hover:bg-blue-600',
    Confirmed: 'bg-green-500 text-white hover:bg-green-600',
    Completed: 'bg-purple-500 text-white hover:bg-purple-600',
    Cancelled: 'bg-red-500 text-white hover:bg-red-600',
    NoShow: 'bg-gray-500 text-white hover:bg-gray-600',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
            <p className="text-slate-600 text-sm mt-1">Visualize e gerencie os agendamentos da unidade.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setCreateModalOpen(true);
                resetCreateForm();
              }}
              disabled={!activeSalon}
            >
              <Plus className="w-4 h-4" />
              Novo agendamento
            </Button>
            {salons && salons.length > 0 && (
              <select
                value={activeSalon ?? ''}
                onChange={(e) => onSalonChange(Number(e.target.value))}
                className="border border-indigo-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {/* View toggle */}
            <div className="flex rounded-lg border border-indigo-200 bg-white overflow-hidden">
              <button
                onClick={() => { setViewMode('list'); localStorage.setItem('appointments_view_mode', 'list'); }}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-50'}`}
              >
                <LayoutList className="w-4 h-4" />
                Lista
              </button>
              <button
                onClick={() => { setViewMode('calendar'); localStorage.setItem('appointments_view_mode', 'calendar'); }}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-50'}`}
              >
                <Calendar className="w-4 h-4" />
                Calendário
              </button>
              <button
                onClick={() => { setViewMode('vehicles'); localStorage.setItem('appointments_view_mode', 'vehicles'); }}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${viewMode === 'vehicles' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-50'}`}
              >
                <Car className="w-4 h-4" />
                Veículos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={<CalendarDays className="w-4 h-4" />} label="Total" value={stats.total} />
        <StatTile icon={<Clock3 className="w-4 h-4" />} label="Hoje" value={stats.today} />
        <StatTile icon={<UserRound className="w-4 h-4" />} label="Pendentes" value={stats.pending} />
        <StatTile icon={<Scissors className="w-4 h-4" />} label="Confirmados" value={stats.confirmed} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-indigo-700">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold">Filtros</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={pendingDateFilter}
            onChange={(e) => setPendingDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 ${pendingDateFilter === dateFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={pendingDateFilter === dateFilter}
            onClick={() => setDateFilter(pendingDateFilter)}
          >
            Aplicar
          </button>
        </div>
        <select
          value={professionalFilter}
          onChange={(e) => setProfessionalFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os profissionais</option>
          {professionals?.map((professional) => (
            <option key={professional.id} value={professional.userId}>{professional.userName}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppointmentDto['status'] | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os status</option>
          <option value="Pending">Pendentes</option>
          <option value="Confirmed">Confirmados</option>
          <option value="Completed">Concluídos</option>
          <option value="NoShow">Não compareceu</option>
          <option value="Cancelled">Cancelados</option>
        </select>
        <input
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Buscar cliente, serviço ou profissional"
          className="min-w-72 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} className="rounded" />
          Incluir cancelados
        </label>
        {(dateFilter || searchFilter || statusFilter !== 'all' || professionalFilter !== 'all') && (
          <button
            onClick={() => {
              setDateFilter('');
              setPendingDateFilter('');
              setSearchFilter('');
              setStatusFilter('all');
              setProfessionalFilter('all');
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Limpar filtros
          </button>
        )}
        {!dateFilter && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
            Sem data definida: exibindo ultimos {DEFAULT_LOOKBACK_DAYS} dias e proximos {DEFAULT_LOOKAHEAD_DAYS} dias para evitar timeout.
          </span>
        )}
      </div>

      {actionNotice && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${actionNotice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <div className="flex items-center justify-between gap-3">
            <span>{actionNotice.message}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs font-semibold underline underline-offset-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Update banner */}
      {updateBannerVisible && (
        <div className="bg-indigo-600 text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Ha atualizacoes na lista de agendamentos.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void invalidateAppointmentsData();
                setUpdateBannerVisible(false);
              }}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setUpdateBannerVisible(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {(isLoading || isRefreshingAppointments) && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-indigo-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isLoading ? 'Carregando agendamentos da unidade...' : 'Atualizando agendamentos...'}</span>
        </div>
      )}

      {isError && (
        <ApiErrorAlert
          message={getApiErrorMessage(error, 'Falha ao carregar agendamentos.')}
          onRetry={() => refetch()}
        />
      )}

      {!hasUnits && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          Você não possui nenhuma unidade cadastrada. Crie uma unidade para começar a gerenciar agendamentos.
        </div>
      )}

      {/* Initial loading state - full area spinner */}
      {hasUnits && isLoading && !pagedAppointments && !calendarAppointments && (
        <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <div className="text-center">
            <p className="text-slate-700 font-semibold">Carregando agendamentos...</p>
            <p className="text-slate-400 text-sm mt-1">Buscando os agendamentos da unidade selecionada.</p>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {hasUnits && viewMode === 'calendar' && !(!isLoading && !pagedAppointments && !calendarAppointments) && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legenda dos Status</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Finalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                <span className="text-sm text-gray-600">Não Compareceu</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-600" />
              Carregando calendário da unidade...
            </div>
          ) : (
            <>
              {/* Week navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-indigo-50">
                <button onClick={() => setCalendarWeek(w => subWeeks(w, 1))} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-slate-800">
                  {format(weekDays[0], "d 'de' MMM", { locale: ptBR })} – {format(weekDays[6], "d 'de' MMM yyyy", { locale: ptBR })}
                </span>
                <button onClick={() => setCalendarWeek(w => addWeeks(w, 1))} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-gray-100">
                <div className="py-2" />
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={`py-2 text-center text-xs font-semibold border-l border-gray-100 ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                    <p>{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className="text-base font-bold">{format(day, 'd')}</p>
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              <div className="overflow-y-auto max-h-[520px]">
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-gray-50 min-h-[64px]">
                    <div className="px-2 py-1 text-xs text-gray-400 text-right pt-1 select-none">{hour}:00</div>
                    {weekDays.map((day) => {
                      const key = format(day, 'yyyy-MM-dd');
                      const dayApts = aptsByDay.get(key)?.filter((a) => {
                        const h = new Date(a.scheduledAt).getHours();
                        return h === hour;
                      }) ?? [];
                      return (
                        <div key={day.toISOString()} className={`border-l border-gray-100 p-0.5 min-w-0 overflow-hidden ${isSameDay(day, new Date()) ? 'bg-indigo-50/40' : ''}`}>
                          {dayApts.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedApt(apt)}
                              className={`w-full min-w-0 max-w-full text-left rounded px-1.5 py-1 mb-0.5 text-xs overflow-hidden ${statusColor[apt.status] ?? 'bg-gray-100 text-gray-700'}`}
                            >
                              <p className="font-semibold truncate">{format(new Date(apt.scheduledAt), 'HH:mm')} {apt.clientName}</p>
                              <p className="truncate opacity-75">{apt.servicoName}</p>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      )}

      {/* List View */}
      {hasUnits && viewMode === 'list' && !(!isLoading && !pagedAppointments && !calendarAppointments) && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legenda dos Status</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Finalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                <span className="text-sm text-gray-600">Não Compareceu</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse border border-gray-100 rounded-lg p-3">
                  <div className="h-4 w-44 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-64 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                </div>
              ))}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando agendamentos...
              </div>
            </div>
          ) : !filteredAppointments.length ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhum agendamento encontrado.
            </div>
          ) : filteredAppointments.map((apt) => {
            const rowPending = pendingAction?.id === apt.id;
            const canComplete = canCompleteAppointment(apt);
            const statusBorderColor = apt.status === 'Pending' ? 'border-l-4 border-l-blue-500' :
                                     apt.status === 'Confirmed' ? 'border-l-4 border-l-green-500' :
                                     apt.status === 'Completed' ? 'border-l-4 border-l-purple-500' :
                                     apt.status === 'Cancelled' ? 'border-l-4 border-l-red-500' :
                                     'border-l-4 border-l-gray-500';
            const statusAvatarColor = apt.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                                     apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                     apt.status === 'Completed' ? 'bg-purple-100 text-purple-700' :
                                     apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                     'bg-gray-100 text-gray-700';
            return (
              <div key={apt.id} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${statusBorderColor}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center text-xs ${statusAvatarColor}`}>
                      {toInitials(apt.clientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{apt.clientName}</p>
                      <p className="text-sm text-slate-600 truncate">{apt.servicoName} • {apt.funcionarioName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(apt.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900 text-sm">
                      {apt.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <div className="mt-1">{(() => { const badge = StatusBadge(apt.status); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-100 text-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-800`}>{badge.label}</span>; })()}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => setSelectedApt(apt)} className="px-3 py-1.5 rounded-md text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    Detalhes
                  </button>
                  {apt.status === 'Pending' && (
                    <button
                      disabled={rowPending}
                      onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 2, action: 'confirm' })}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {rowPending && pendingAction?.action === 'confirm' ? 'Confirmando...' : 'Confirmar'}
                    </button>
                  )}
                  {apt.status === 'Confirmed' && (
                    <button
                      disabled={rowPending || !canComplete}
                      onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 4, action: 'complete' })}
                      title={canComplete ? 'Marcar como concluído' : 'Só é possível concluir após o horário do atendimento'}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rowPending && pendingAction?.action === 'complete'
                        ? 'Concluindo...'
                        : canComplete
                          ? 'Concluir'
                          : 'Aguardando horário'}
                    </button>
                  )}
                  {apt.status === 'Confirmed' && (
                    <button
                      disabled={rowPending || !canComplete}
                      onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 5, action: 'noshow' })}
                      title={canComplete ? 'Marcar cliente como não compareceu' : 'Só é possível marcar não compareceu após o horário do atendimento'}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rowPending && pendingAction?.action === 'noshow'
                        ? 'Marcando...'
                        : canComplete
                          ? 'Não compareceu'
                          : 'Aguardando horário'}
                    </button>
                  )}
                  {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                    <button
                      disabled={rowPending}
                      onClick={() => {
                        setSelectedApt(apt);
                        setDetailInlineAction('reassign');
                        setReassignProfessionalId(null);
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      Trocar profissional
                    </button>
                  )}
                  {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                    <button
                      disabled={rowPending}
                      onClick={() => {
                        setSelectedApt(apt);
                        setDetailInlineAction('cancel');
                        setCancelReason('');
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {rowPending && pendingAction?.action === 'cancel' ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {pagedAppointments && pagedAppointments.totalPages > 1 && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Total filtrado: <strong>{pagedAppointments.total}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isFetching}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-gray-600">
                  Pagina {pagedAppointments.page} de {pagedAppointments.totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pagedAppointments.totalPages || isFetching}
                  onClick={() => setCurrentPage((p) => Math.min(pagedAppointments.totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vehicles View */}
      {hasUnits && viewMode === 'vehicles' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Buscar por placa, modelo, marca ou proprietario"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {vehicleSearch && (
              <button onClick={() => setVehicleSearch('')} className="text-sm text-indigo-600 hover:underline">Limpar</button>
            )}
            <span className="text-xs text-gray-500">{filteredVehicles.length} veiculo(s)</span>
          </div>

          {vehiclesLoading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum veiculo encontrado nesta unidade.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredVehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleDetailId(v.id)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {v.fotoBase64 ? (
                        <img
                          src={v.fotoBase64.startsWith('data:') ? v.fotoBase64 : `data:image/jpeg;base64,${v.fotoBase64}`}
                          alt={v.modelo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Placa: <span className="font-mono font-semibold">{v.placa}</span></p>
                      <div className="flex gap-2 mt-1 text-xs text-slate-500">
                        {v.ano && <span>{v.ano}</span>}
                        {v.cor && <span>· {v.cor}</span>}
                        <span>· {v.tamanho}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={!!selectedApt} onClose={() => { setClientHistoryOpen(false); setDetailInlineAction(null); setSelectedApt(null); }} title={detailInlineAction === 'cancel' ? 'Cancelar Agendamento' : detailInlineAction === 'reassign' ? 'Trocar Profissional' : 'Detalhes do Agendamento'}>
        {selectedApt && (
          <div className="space-y-4 text-sm">
            {detailInlineAction === null && (
              <>
                {/* Seção do Cliente com Foto */}
                <div className="flex gap-4 items-start bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selectedApt.clientImage ? (
                      <img
                        src={selectedApt.clientImage.startsWith('data:') ? selectedApt.clientImage : `data:image/jpeg;base64,${selectedApt.clientImage}`}
                        alt={selectedApt.clientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="w-8 h-8 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-base">{selectedApt.clientName}</p>
                    {selectedApt.clientPhone && (
                      <p className="text-xs text-slate-600 mt-0.5">📞 {selectedApt.clientPhone}</p>
                    )}
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {selectedApt.clientCity || 'Localização não informada'}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total finalizados</p>
                        <p className="font-bold text-indigo-700 text-xl leading-tight">{selectedApt.clientTotalAppointments ?? 0}</p>
                      </div>
                      <div className="w-px bg-indigo-200" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Finalizados neste salão</p>
                        <p className="font-bold text-indigo-700 text-xl leading-tight">{selectedApt.clientSalonAppointments ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Não compareceu (total)</p>
                        <p className="font-bold text-slate-700 text-xl leading-tight">{selectedApt.clientNoShowTotalAppointments ?? 0}</p>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Não compareceu neste salão</p>
                        <p className="font-bold text-slate-700 text-xl leading-tight">{selectedApt.clientNoShowSalonAppointments ?? 0}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setClientHistoryOpen(true)}
                    >
                      <History className="w-4 h-4" />
                      Ver histórico detalhado
                    </Button>
                  </div>
                </div>

                {/* Veiculo */}
                {selectedApt.veiculoPlaca && (
                  <div className="flex gap-3 items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{selectedApt.veiculoModelo || 'Veiculo'}</p>
                      <p className="text-xs text-slate-600">Placa: {selectedApt.veiculoPlaca}</p>
                    </div>
                    {selectedApt.veiculoId && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setVehicleDetailId(selectedApt.veiculoId!)}
                      >
                        <Car className="w-3.5 h-3.5" />
                        Detalhes
                      </Button>
                    )}
                  </div>
                )}

                {/* Informações do Agendamento */}
                <Row label="Telefone" value={(
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{selectedApt.clientPhone || '—'}</span>
                    {selectedAptWhatsAppLink && (
                      <a
                        href={selectedAptWhatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )} />
                <Row label="Serviço" value={selectedApt.servicoName} />
                <Row label="Profissional" value={selectedApt.funcionarioName} />
                <Row label="Data/Hora" value={format(new Date(selectedApt.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
                <Row label="Duração" value={`${selectedApt.durationMinutes} min`} />
                <Row label="Valor" value={selectedApt.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Row label="Status" value={(() => { const badge = StatusBadge(String(selectedApt.status)); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-100 text-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-800`}>{badge.label}</span>; })()} />
                {selectedApt.notes && <Row label="Observações" value={selectedApt.notes} />}
                {selectedApt.cancellationReason && <Row label="Motivo do cancelamento" value={selectedApt.cancellationReason} />}
              </>
            )}

            {/* Ações - sempre visíveis quando não está em modo cancel/reassign */}
            {(() => {
              if (detailInlineAction !== null) return null;
              const st = String(selectedApt.status).toLowerCase();
              console.log('[AdminAppointments] Modal status:', selectedApt.status, 'normalized:', st);
              const isPending = st === 'pending' || st === '1' || st === 'pendente';
              const isConfirmed = st === 'confirmed' || st === '2' || st === 'confirmado';
              const isCompleted = st === 'completed' || st === '4' || st === 'finalizado';
              const isCancelled = st === 'cancelled' || st === '3' || st === 'cancelado';
              const isNoShow = st === 'noshow' || st === '5';
              const canAct = isPending || isConfirmed;
              // Se já foi concluído/cancelado/não compareceu, não mostrar ações
              if (isCompleted || isCancelled || isNoShow) {
                return <p className="text-xs text-gray-500 italic pt-2 border-t border-gray-100">Este agendamento já foi finalizado e não aceita mais alterações.</p>;
              }
              if (!canAct) return null;
              return (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailInlineAction('reassign');
                    setReassignProfessionalId(null);
                  }}
                >
                  Trocar profissional
                </Button>
                {isPending && (
                  <Button size="sm" onClick={() => { updateStatusMutation.mutate({ id: selectedApt.id, status: 2, action: 'confirm' }); setSelectedApt(null); }}>
                    Confirmar
                  </Button>
                )}
                {isConfirmed && (
                  <>
                    <Button
                      size="sm"
                      disabled={!canCompleteAppointment(selectedApt)}
                      title={canCompleteAppointment(selectedApt) ? 'Marcar como concluído' : 'Só é possível concluir após o horário do atendimento'}
                      onClick={() => { updateStatusMutation.mutate({ id: selectedApt.id, status: 4, action: 'complete' }); setSelectedApt(null); }}
                    >
                      {canCompleteAppointment(selectedApt) ? 'Concluir' : 'Aguardando horário'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canCompleteAppointment(selectedApt)}
                      title={canCompleteAppointment(selectedApt) ? 'Marcar cliente como não compareceu' : 'Só é possível marcar não compareceu após o horário do atendimento'}
                      onClick={() => { updateStatusMutation.mutate({ id: selectedApt.id, status: 5, action: 'noshow' }); setSelectedApt(null); }}
                    >
                      Não compareceu
                    </Button>
                  </>
                )}
                <Button size="sm" variant="danger" onClick={() => { setDetailInlineAction('cancel'); setCancelReason(''); }}>
                  Cancelar
                </Button>
              </div>
            );
            })()}
            {(() => {
              if (detailInlineAction !== null) return null;
              const st = String(selectedApt.status).toLowerCase();
              const isConfirmed = st === 'confirmed' || st === '2' || st === 'confirmado';
              if (!isConfirmed || canCompleteAppointment(selectedApt)) return null;
              return (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Este agendamento só pode ser concluído depois que o horário terminar.
              </p>
              );
            })()}

            {/* Inline Cancel Form */}
            {detailInlineAction === 'cancel' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setDetailInlineAction(null)}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  ← Voltar aos detalhes
                </button>
                <p className="text-gray-600">
                  Tem certeza que deseja cancelar o agendamento de <strong>{selectedApt.clientName}</strong> para <strong>{selectedApt.servicoName}</strong>?
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Motivo do cancelamento (opcional)</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    placeholder="Informe o motivo..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setDetailInlineAction(null); setCancelReason(''); }}>Voltar</Button>
                  <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate({ id: selectedApt.id, reason: cancelReason })}>
                    Confirmar Cancelamento
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Reassign Form */}
            {detailInlineAction === 'reassign' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setDetailInlineAction(null); setReassignProfessionalId(null); }}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  ← Voltar aos detalhes
                </button>
                <p className="text-slate-600">
                  Selecione um profissional que realiza o mesmo serviço e esteja disponível no horário deste agendamento.
                </p>
                {isEligibleProfessionalsError && (
                  <ApiErrorAlert
                    message={getApiErrorMessage(eligibleProfessionalsError, 'Não foi possível carregar profissionais disponíveis.')}
                    onRetry={() => refetchEligibleProfessionals()}
                  />
                )}
                {isLoadingEligibleProfessionals ? (
                  <p className="text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando profissionais disponíveis...</p>
                ) : eligibleProfessionals.length === 0 ? (
                  <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Nenhum profissional disponível para esse serviço no horário selecionado.
                  </p>
                ) : (
                  <select
                    value={reassignProfessionalId ?? ''}
                    onChange={(event) => setReassignProfessionalId(event.target.value ? Number(event.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione o novo profissional</option>
                    {eligibleProfessionals.map((option: AppointmentProfessionalOptionDto) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setDetailInlineAction(null); setReassignProfessionalId(null); }}>Cancelar</Button>
                  <Button
                    loading={reassignMutation.isPending}
                    disabled={!reassignProfessionalId}
                    onClick={() => reassignMutation.mutate()}
                  >
                    Confirmar alteração
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={clientHistoryOpen && !!selectedApt}
        onClose={() => setClientHistoryOpen(false)}
        title={selectedApt ? `Histórico — ${selectedApt.clientName}` : 'Histórico do cliente'}
        footer={(
          <Button variant="outline" onClick={() => setClientHistoryOpen(false)}>Fechar</Button>
        )}
      >
        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {clientHistoryLoading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando histórico…
            </div>
          )}
          {clientHistoryIsError && (
            <ApiErrorAlert
              message={getApiErrorMessage(clientHistoryError, 'Não foi possível carregar o histórico.')}
              onRetry={() => refetchClientHistory()}
            />
          )}
          {clientHistory && !clientHistoryLoading && (
            <>
              <ClientHistorySection
                title={`Nesta unidade (${selectedApt?.salonName ?? ''})`}
                items={clientHistory.atThisSalon}
                showSalon={false}
              />
              {/* <ClientHistorySection
                title="Outras unidades"
                items={clientHistory.otherSalons}
                showSalon
              /> */}
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetCreateForm();
        }}
        title="Novo Agendamento"
        footer={(
          <>
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); resetCreateForm(); }}>Cancelar</Button>
            <Button loading={createAppointmentMutation.isPending} onClick={() => createAppointmentMutation.mutate()}>
              Criar agendamento
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Selecione um cliente existente ou cadastre um novo cliente (CPF opcional). Se já houver usuário com o mesmo documento/e-mail, o sistema reutiliza o cadastro.
          </p>

          {createMsg && (
            <div className={`p-3 rounded-lg text-sm border ${createMsg.includes('sucesso') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {createMsg}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Profissional *</label>
            <select
              value={createProfessionalId ?? ''}
              onChange={(e) => setCreateProfessionalId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {professionals?.map((professional) => (
                <option key={professional.id} value={professional.id}>{professional.userName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Serviço *</label>
            <select
              value={createServiceId ?? ''}
              onChange={(e) => setCreateServiceId(e.target.value ? Number(e.target.value) : null)}
              disabled={!createProfessionalId || servicesForSelectedProfessional.length === 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">
                {!createProfessionalId
                  ? 'Selecione primeiro um profissional'
                  : servicesForSelectedProfessional.length === 0
                    ? 'Nenhum serviço vinculado a este profissional'
                    : 'Selecione...'}
              </option>
              {servicesForSelectedProfessional.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} • {service.durationMinutes} min • {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Data e hora *</label>
            {!createProfessionalId || !createServiceId ? (
              <p className="text-xs text-gray-500">Selecione profissional e serviço para ver os horários disponíveis.</p>
            ) : isLoadingCreateCal ? (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando disponibilidade…
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  Dias e horários conforme a agenda do profissional e duração do serviço. Toque no dia e depois no horário.
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {(createAvailabilityCal ?? []).map((day) => {
                    const hasSlots = day.availableTimes.length > 0;
                    const selected = day.date === createPickDate;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        disabled={!hasSlots}
                        onClick={() => {
                          setCreatePickDate(day.date);
                          setCreateScheduledAt('');
                        }}
                        className={`flex-shrink-0 min-w-[4.5rem] rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${!hasSlots
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : selected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                          }`}
                      >
                        <span className="block capitalize">{format(parse(day.date, 'yyyy-MM-dd', new Date()), 'EEE', { locale: ptBR })}</span>
                        <span className="block text-sm font-bold">{format(parse(day.date, 'yyyy-MM-dd', new Date()), 'd/M')}</span>
                        {hasSlots && (
                          <span className="block text-[10px] opacity-80">{day.availableTimes.length} hor.</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {createPickDate ? (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Horários livres neste dia</p>
                    {(() => {
                      const dayRow = createAvailabilityCal?.find((d) => d.date === createPickDate);
                      const slots = dayRow?.availableTimes ?? [];
                      if (!slots.length) {
                        return <p className="text-xs text-amber-700">Nenhum horário livre neste dia.</p>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((t) => {
                            const value = `${createPickDate}T${t}:00`;
                            const picked = createScheduledAt.startsWith(`${createPickDate}T${t}`);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setCreateScheduledAt(value)}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${picked
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-400'
                                  }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum dia com disponibilidade nos próximos dias.</p>
                )}
                {createScheduledAt && (
                  <p className="text-xs text-emerald-700 font-medium">
                    Selecionado:{' '}
                    {format(parse(createScheduledAt.slice(0, 10), 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", { locale: ptBR })}{' '}
                    às {createScheduledAt.match(/T(\d{2}:\d{2})/)?.[1] ?? '—'}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-700">Cliente do agendamento *</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCreateClientMode('existing'); setCreateSelectedClientId(null); setCreateMsg(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${createClientMode === 'existing' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
              >
                Cliente existente
              </button>
              <button
                type="button"
                onClick={() => { setCreateClientMode('new'); setCreateSelectedClientId(null); setCreateMsg(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${createClientMode === 'new' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
              >
                Cadastrar novo cliente
              </button>
            </div>

            {createClientMode === 'existing' ? (
              <div className="space-y-2">
                <input
                  value={createClientSearch}
                  onChange={(e) => {
                    setCreateClientSearch(e.target.value);
                    setCreateSelectedClientId(null);
                  }}
                  placeholder="Digite o nome do cliente"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {createClientSearch.trim().length < 2 ? (
                  <p className="text-xs text-gray-500">Digite ao menos 2 letras do nome para buscar.</p>
                ) : isSearchingClients ? (
                  <p className="text-xs text-gray-500">Buscando clientes...</p>
                ) : searchedClients.length === 0 ? (
                  <p className="text-xs text-gray-500">Nenhum cliente encontrado com esse nome.</p>
                ) : (
                  <select
                    value={createSelectedClientId ?? ''}
                    onChange={(e) => setCreateSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um cliente...</option>
                    {searchedClients.map((client) => (
                      <option key={client.id} value={client.id}>{renderClientOption(client)}</option>
                    ))}
                  </select>
                )}

                {selectedClient && (
                  <p className="text-xs text-emerald-700">
                    Cliente selecionado: {selectedClient.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">Nome *</label>
                  <input
                    value={createClientName}
                    onChange={(e) => setCreateClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Telefone</label>
                  <input
                    value={createClientPhone}
                    onChange={(e) => setCreateClientPhone(e.target.value)}
                    placeholder="(xx) xxxxx-xxxx"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">CPF (opcional)</label>
                  <input
                    value={createClientDoc}
                    onChange={(e) => setCreateClientDoc(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">E-mail (opcional)</label>
                  <input
                    value={createClientEmail}
                    onChange={(e) => setCreateClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Observações</label>
            <textarea
              rows={3}
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {selectedService && (
            <p className="text-xs text-slate-500">
              Duração estimada: {selectedService.durationMinutes} min.
            </p>
          )}
        </div>
      </Modal>

      {/* Vehicle Detail Modal */}
      <Modal
        open={!!vehicleDetailId}
        onClose={() => setVehicleDetailId(null)}
        title={vehicleDetail ? `Veiculo — ${vehicleDetail.placa}` : 'Detalhes do Veiculo'}
        footer={<Button variant="outline" onClick={() => setVehicleDetailId(null)}>Fechar</Button>}
      >
        {vehicleDetail && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            {/* Vehicle Photo */}
            {vehicleDetail.fotoBase64 ? (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={vehicleDetail.fotoBase64.startsWith('data:') ? vehicleDetail.fotoBase64 : `data:image/jpeg;base64,${vehicleDetail.fotoBase64}`}
                  alt={vehicleDetail.modelo}
                  className="w-full h-48 object-cover"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center">
                <Car className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">Sem foto</p>
              </div>
            )}

            {/* Vehicle Info */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Placa</p>
                  <p className="font-bold text-slate-900">{vehicleDetail.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Ano</p>
                  <p className="font-bold text-slate-900">{vehicleDetail.ano || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Marca</p>
                  <p className="font-semibold text-slate-900">{vehicleDetail.marca}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Modelo</p>
                  <p className="font-semibold text-slate-900">{vehicleDetail.modelo}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Cor</p>
                  <p className="font-semibold text-slate-900">{vehicleDetail.cor || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Tamanho</p>
                  <p className="font-semibold text-slate-900">{vehicleDetail.tamanho}</p>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-2">Proprietario</p>
              <p className="font-semibold text-slate-900">{vehicleDetail.clientName || '—'}</p>
              {vehicleDetail.clientPhone && (
                <p className="text-xs text-slate-600 mt-0.5">{vehicleDetail.clientPhone}</p>
              )}
            </div>

            {/* Vehicle History */}
            <div>
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
                Historico nesta unidade ({vehicleHistory?.length || 0} agendamentos)
              </p>
              {vehicleHistoryLoading ? (
                <div className="flex items-center gap-2 text-slate-500 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </div>
              ) : vehicleHistory && vehicleHistory.length > 0 ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {vehicleHistory.map((item: any) => (
                    <li key={item.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">
                          {item.scheduledAt ? format(new Date(item.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {item.totalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        {item.serviceName}{item.professionalName ? ` • ${item.professionalName}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 py-2">Nenhum agendamento encontrado.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-36 flex-shrink-0">{label}:</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ClientHistorySection({
  title,
  items,
  showSalon,
}: {
  title: string;
  items: ClientAppointmentHistoryItemDto[];
  showSalon: boolean;
}) {
  if (!items.length) {
    return (
      <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">{title}</p>
        <p className="text-xs text-slate-400">Nenhum registro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">{title}</p>
      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">
                {format(new Date(row.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              {(() => { const badge = StatusBadge(String(row.status)); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-100 text-${badge.variant === 'warning' ? 'yellow' : badge.variant === 'success' ? 'green' : 'gray'}-800`}>{badge.label}</span>; })()}
            </div>
            <p className="text-slate-600 mt-1">
              {row.serviceName}
              {' · '}
              {row.professionalName}
            </p>
            {showSalon && (
              <p className="text-slate-500 mt-0.5 font-medium">{row.serviceName || 'Serviço'}</p>
            )}
            <p className="text-slate-500 mt-0.5">
              30
              {' min · '}
              {row.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {row.cancellationReason && (
              <p className="text-rose-600 mt-1 text-[11px]">
                Cancelamento:
                {' '}
                {row.cancellationReason}
              </p>
            )}
            {row.notes && (
              <p className="text-slate-500 mt-1 text-[11px]">
                Obs.:
                {' '}
                {row.notes}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
