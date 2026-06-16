import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, Star, TrendingUp, Clock } from 'lucide-react';
import { salonsApi, appointmentsApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { getStatusBadge as StatusBadge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAdminSalonSelection } from '../../utils/adminSalonSelection';

export function AdminDashboard() {
  const { user } = useAdminAuth();

  const { data: salons, isLoading: isSalonsLoading, isError: isSalonsError, error: salonsError, refetch: refetchSalons } = useQuery({
    queryKey: ['my-units'],
    queryFn: () => salonsApi.myUnits(),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60_000,
  });

  const { activeSalonId, hasUnits, handleSalonChange } = useAdminSalonSelection(salons, user?.id);
  const resolvedSalonId = activeSalonId ?? salons?.[0]?.id ?? null;
  const primarySalon = salons?.find((salon) => salon.id === resolvedSalonId) ?? salons?.[0];

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: dashboardSummary, isLoading: isAppointmentsLoading, isFetching: isAppointmentsFetching, isError: isAppointmentsError, error: appointmentsError, refetch: refetchAppointments } = useQuery({
    queryKey: ['dashboard-summary', resolvedSalonId, todayStr],
    queryFn: () => appointmentsApi.dashboardSummary(resolvedSalonId!),
    enabled: hasUnits && !!resolvedSalonId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const todayAppointmentsCount = dashboardSummary?.totalToday ?? 0;
  const pendingCount = dashboardSummary?.pendentes ?? 0;
  const confirmedCount = dashboardSummary?.confirmados ?? 0;
  const upcoming = dashboardSummary?.upcomingAppointments ?? [];

  // Only show loading if we're actually loading and haven't received a response yet
  // If we got an error (401), don't show loading - show error instead
  const isDashboardLoading = isSalonsLoading && !isSalonsError;
  const isSummaryLoading = hasUnits && !!resolvedSalonId && isAppointmentsLoading && !dashboardSummary;

  // Safety net: if the loading banner shows for more than 20 seconds, force an
  // error state so the user is never stuck with a permanent spinner.
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!isDashboardLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), 20_000);
    return () => clearTimeout(timer);
  }, [isDashboardLoading]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Global loading indicator */}
      {isDashboardLoading && !loadingTimedOut && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <svg className="animate-spin h-4 w-4 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Carregando informações do painel...</span>
        </div>
      )}

      {isDashboardLoading && loadingTimedOut && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <span>O painel está demorando para carregar. Verifique sua conexão ou tente novamente.</span>
          <button
            type="button"
            onClick={() => { setLoadingTimedOut(false); void refetchSalons(); }}
            className="text-xs font-semibold underline underline-offset-2 flex-shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isDashboardLoading && isAppointmentsFetching && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-700">
          <svg className="animate-spin h-3.5 w-3.5 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Atualizando dados do painel...</span>
        </div>
      )}

      {/* Stats skeleton */}
      {isDashboardLoading && !loadingTimedOut && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isSalonsError && (
        <ApiErrorAlert
          message={getApiErrorMessage(salonsError, 'Falha ao carregar suas unidades.')}
          onRetry={() => refetchSalons()}
        />
      )}

      {isAppointmentsError && (
        <ApiErrorAlert
          message={getApiErrorMessage(appointmentsError, 'Falha ao carregar agendamentos.')}
          onRetry={() => refetchAppointments()}
        />
      )}

      {!isSalonsLoading && !hasUnits && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Você não possui nenhuma unidade cadastrada. Cadastre uma unidade para visualizar os dados do painel.
        </div>
      )}

      {/* Salon selector */}
      {salons && salons.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-blue-700">
              {salons.length > 1
                ? <>Você tem <strong>{salons.length}</strong> unidades cadastradas. Exibindo dados de: <strong>{primarySalon?.name}</strong></>
                : <>Exibindo dados da unidade: <strong>{primarySalon?.name}</strong></>}
            </p>
          </div>
          {salons.length > 1 && (
            <select
              value={resolvedSalonId ?? ''}
              onChange={(e) => handleSalonChange(Number(e.target.value))}
              className="border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {salons.map((salon) => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Stats */}
      {!isDashboardLoading && hasUnits && !isSummaryLoading && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agendamentos hoje</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointmentsCount}</p>
            </div>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{confirmedCount}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliação média</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{primarySalon?.averageRating ? `${primarySalon.averageRating.toFixed(1)}★` : '—'}</p>
            </div>
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
      )}

      {/* Upcoming appointments */}
      {hasUnits && ((isDashboardLoading && !loadingTimedOut) || isSummaryLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-5 bg-gray-100 rounded w-48" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-gray-100 rounded w-12 ml-auto" />
                  <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Próximos Agendamentos</h3>
          <a href="/admin/agendamentos" className="text-sm text-brand-600 hover:underline">
            Ver todos
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Nenhum agendamento pendente
            </div>
          ) : (
            upcoming.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{apt.clientName}</p>
                  <p className="text-sm text-gray-500">
                    {apt.serviceName} · {apt.professionalName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(apt.scheduledAt), 'HH:mm')}
                  </p>
                  {(() => {
                    const badge = StatusBadge(String(apt.status));
                    const colorMap: Record<string, { bg: string; text: string }> = {
                      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
                      success: { bg: 'bg-green-100', text: 'text-green-800' },
                    };
                    const colors = colorMap[badge.variant] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      ))}

      {/* Salon info */}
      {!isDashboardLoading && primarySalon && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Informações da Unidade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nome</p>
              <p className="font-medium text-gray-900">{primarySalon.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Cidade</p>
              <p className="font-medium text-gray-900">{primarySalon.city}, {primarySalon.state}</p>
            </div>
            <div>
              <p className="text-gray-500">Telefone</p>
              <p className="font-medium text-gray-900">{primarySalon.phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                primarySalon.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {primarySalon.published ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

