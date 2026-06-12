import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, Eye, EyeOff, Camera, CreditCard, RefreshCw, AlertCircle, CheckCircle, Clock, ExternalLink, FileText, MessageCircle } from 'lucide-react';
import { authApi, subscriptionsApi, plansApi, legalDocumentsApi, supportApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';
import type { LegalConsentRequest, LegalDocumentDto, PlanDto, SupportContactDto } from '../../types';
import { logTelemetry } from '../../utils/telemetry';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  username: string;
  doc: string;
  dob: string;
  country: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function getPlanVisual(planName?: string, price?: number): { icon: React.ReactNode; color: string; bgColor: string } {
  const name = (planName || '').toLowerCase();
  if (price === 0 || name.includes('starter') || name.includes('trial') || name.includes('free')) {
    return { icon: <Clock className="w-6 h-6" />, color: '#4CAF50', bgColor: '#4CAF5020' };
  }
  if (name.includes('business') || name.includes('premium')) {
    return { icon: <CheckCircle className="w-6 h-6" />, color: '#FFD700', bgColor: '#FFD70020' };
  }
  return { icon: <CreditCard className="w-6 h-6" />, color: '#3F51B5', bgColor: '#3F51B520' };
}

export function AdminProfile() {
  const { user, setAuth, token, refreshToken } = useAdminAuth();
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [licenseModal, setLicenseModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [licenseMsg, setLicenseMsg] = useState('');
  const [acceptedDocCodes, setAcceptedDocCodes] = useState<string[]>([]);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocumentDto | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<{ planId: number; planName: string; startedAt: number; checkoutUrl?: string; pendingExpiresAt?: string } | null>(null);
  const [isSyncingCheckout, setIsSyncingCheckout] = useState(false);
  const [apiError, setApiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register: rProfile, handleSubmit: hProfile, reset: resetProfile, setValue } = useForm<ProfileForm>();
  const { register: rPassword, handleSubmit: hPassword, reset: resetPassword } = useForm<PasswordForm>();

  const { data: currentSubscription, refetch: refetchSub, isError: isSubscriptionError, error: subscriptionError } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => subscriptionsApi.current().then((r) => r.data),
  });

  const { data: plans, isError: isPlansError, error: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then((r: any) => r.data),
    enabled: licenseModal,
  });

  const { data: legalDocs = [], isError: isLegalDocsError, error: legalDocsError } = useQuery({
    queryKey: ['legal-documents', 'subscription'],
    queryFn: () => legalDocumentsApi.listActive().then((r) => r.data),
    enabled: licenseModal,
  });

  const { data: supportContact } = useQuery({
    queryKey: ['support-contact', 'license-modal'],
    queryFn: () => supportApi.getContact().then((r) => r.data),
    enabled: licenseModal,
  });

  const requiredLegalDocs = useMemo(
    () => legalDocs.filter((doc) => doc.isRequired),
    [legalDocs]
  );

  const normalizedCurrentPlanName = (currentSubscription?.planName || '').toLowerCase();
  const isFreeLikeCurrentPlan =
    normalizedCurrentPlanName.includes('starter') ||
    normalizedCurrentPlanName.includes('free') ||
    normalizedCurrentPlanName.includes('trial');
  const canCancelSubscription = Boolean(currentSubscription?.isActive)
    && (currentSubscription?.canCancel ?? true)
    && !isFreeLikeCurrentPlan;

  const buildAcceptedConsents = useCallback((): LegalConsentRequest[] => (
    legalDocs
      .filter((doc) => acceptedDocCodes.includes(doc.code))
      .map((doc: any) => ({ code: doc.code, version: doc.version }))
  ), [acceptedDocCodes, legalDocs]);

  const resetLicenseSelection = useCallback(() => {
    setSelectedPlanId(null);
    setAcceptedDocCodes([]);
    setSelectedLegalDoc(null);
    setLicenseMsg('');
  }, []);

  const closeLicenseModal = useCallback(() => {
    setLicenseModal(false);
    resetLicenseSelection();
  }, [resetLicenseSelection]);

  const openCheckoutWindow = useCallback((checkoutUrl: string): boolean => {
    if (typeof window === 'undefined') return false;
    const popup = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    return !!popup;
  }, []);

  const openSupportWhatsApp = useCallback((contact?: SupportContactDto | null) => {
    const rawPhone = contact?.whatsapp?.trim();
    if (!rawPhone || typeof window === 'undefined') {
      setLicenseMsg('Suporte via WhatsApp ainda nao configurado.');
      return;
    }

    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      setLicenseMsg('Numero de WhatsApp do suporte invalido.');
      return;
    }

    const text = encodeURIComponent('Oi! Ja conclui um pagamento no Asaas, mas minha licenca ainda nao atualizou. Podem me ajudar?');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  }, []);

  const syncPendingCheckoutStatus = useCallback(async (showPendingMessage = false) => {
    if (!pendingCheckout || isSyncingCheckout) return;

    setIsSyncingCheckout(true);
    try {
      const updatedSub = await subscriptionsApi.current().then((r) => r.data);
      if (updatedSub.isActive && updatedSub.planId === pendingCheckout.planId) {
        logTelemetry('Admin checkout confirmed by polling.', {
          level: 'Information',
          context: { planId: pendingCheckout.planId },
        });
        await refetchSub();
        setPendingCheckout(null);
        setLicenseMsg(`Pagamento confirmado! O plano ${pendingCheckout.planName} foi ativado com sucesso.`);
        setTimeout(() => {
          closeLicenseModal();
        }, 1800);
        return;
      }

      if (showPendingMessage) {
        setLicenseMsg('O checkout foi iniciado, mas o Asaas ainda não confirmou o pagamento. Tente verificar novamente em instantes.');
      }
    } catch (error) {
      logTelemetry('Admin checkout status polling failed.', {
        level: 'Warning',
        stack: (error as { stack?: string })?.stack,
        context: { pendingPlanId: pendingCheckout?.planId },
      });
      if (showPendingMessage) {
        setLicenseMsg(getApiErrorMessage(error, 'Não foi possível verificar o status do checkout agora.'));
      }
    } finally {
      setIsSyncingCheckout(false);
    }
  }, [closeLicenseModal, isSyncingCheckout, pendingCheckout, refetchSub]);

  // Filter plans based on subscription status
  const filteredPlans = plans?.filter((plan) => {
    if (currentSubscription?.isActive) {
      // If already has subscription, show only paid plans that are different from current
      const isSamePlan = currentSubscription.planName?.toLowerCase() === plan.name.toLowerCase();
      return plan.price !== 0 && !isSamePlan;
    }
    // If no subscription, show all plans
    return true;
  }) ?? [];

  const selectedPlan = useMemo(
    () => filteredPlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [filteredPlans, selectedPlanId]
  );

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        username: user.username || '',
        doc: user.doc || '',
        dob: user.dob ? user.dob.slice(0, 10) : '',
        country: user.country || '',
      });
      if (user.base64Image) {
        setPhotoPreview(`data:image/jpeg;base64,${user.base64Image}`);
      }
    }
  }, [user, resetProfile]);

  useEffect(() => {
    if (!pendingCheckout || typeof window === 'undefined') return;

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - pendingCheckout.startedAt;
      if (elapsedMs > 3 * 60 * 1000) return;
      void syncPendingCheckoutStatus(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [pendingCheckout, syncPendingCheckoutStatus]);

  useEffect(() => {
    if (!licenseModal) return;

    let isCancelled = false;
    void subscriptionsApi.pendingCheckout()
      .then((r) => {
        if (isCancelled || !r.data.hasPendingCheckout || !r.data.planId) return;

        setPendingCheckout({
          planId: r.data.planId,
          planName: `Plano #${r.data.planId}`,
          startedAt: Date.now(),
          checkoutUrl: r.data.checkoutUrl,
          pendingExpiresAt: r.data.pendingExpiresAt,
        });
        setLicenseMsg('Ja existe um checkout em andamento. Aguarde a confirmacao do Asaas antes de tentar novamente.');
      })
      .catch((error) => {
        logTelemetry('Admin pending checkout status load failed.', {
          level: 'Warning',
          stack: (error as { stack?: string })?.stack,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [licenseModal]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
      reader.readAsDataURL(file);
    });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      authApi.updateProfile({ ...data, base64Image: photoBase64 }),
    onSuccess: async () => {
      setApiError('');
      const res = await authApi.me();
      if (token && refreshToken) setAuth(token, refreshToken, res.data);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Falha ao atualizar perfil.')),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      authApi.changePassword({ currentPassword: current, newPassword: next } as any),
    onSuccess: () => {
      resetPassword();
      setPasswordError('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    },
    onError: (error) => setPasswordError(getApiErrorMessage(error, 'Senha atual incorreta. Tente novamente.')),
  });

  const licenseMutation = useMutation({
    mutationFn: async (plan: PlanDto) => {
      const consents = buildAcceptedConsents();

      if (plan.price === 0) {
        const subscription = await subscriptionsApi.activateTrial().then((r) => r.data);
        return { mode: 'trial' as const, plan, subscription };
      }

      const backUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/perfil` : undefined;
      const checkout = currentSubscription?.isActive
        ? await subscriptionsApi.upgrade({ planId: plan.id, consents, backUrl } as any).then((r) => r.data)
        : await subscriptionsApi.startPaidCheckout(plan.id).then((r) => r.data);

      return { mode: 'checkout' as const, plan, checkout };
    },
    onSuccess: async (result) => {
      if (result.mode === 'trial') {
        await refetchSub();
        setPendingCheckout(null);
        setLicenseMsg('Licença ativada com sucesso!');
        setTimeout(() => {
          closeLicenseModal();
        }, 1500);
        return;
      }

      logTelemetry('Admin checkout started.', {
        level: 'Information',
        context: { planId: result.plan.id, mode: result.mode },
      });
      setLicenseMsg(`Checkout do Asaas iniciado para o plano ${result.plan.name}. Finalize o pagamento na nova aba e depois clique em Verificar status.`);
      const checkoutUrl = result.checkout.checkoutUrl;
      const opened = openCheckoutWindow(checkoutUrl);
      if (!opened) {
        logTelemetry('Admin checkout popup blocked.', {
          level: 'Warning',
          context: { planId: result.plan.id },
        });
        setLicenseMsg('Nao foi possivel abrir a nova aba do checkout. Habilite pop-ups para este site e clique em Fazer Upgrade novamente.');
      }
      setPendingCheckout({
        planId: result.plan.id,
        planName: result.plan.name,
        startedAt: Date.now(),
        checkoutUrl,
        pendingExpiresAt: result.checkout.pendingExpiresAt,
      });
      resetLicenseSelection();
    },
    onError: (error) => {
      logTelemetry('Admin license operation failed.', {
        level: 'Error',
        stack: (error as { stack?: string })?.stack,
        context: {
          selectedPlanId,
          hasActiveSubscription: currentSubscription?.isActive,
        },
      });
      setLicenseMsg(getApiErrorMessage(error, 'Erro ao atualizar licença. Tente novamente.'));
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel().then((r) => r.data),
    onSuccess: async () => {
      await refetchSub();
      setPendingCheckout(null);
      setLicenseMsg('Assinatura cancelada com sucesso. Cobrancas futuras foram interrompidas.');
      setTimeout(() => {
        closeLicenseModal();
      }, 1600);
    },
    onError: (error) => {
      setLicenseMsg(getApiErrorMessage(error, 'Nao foi possivel cancelar a assinatura agora.'));
    },
  });

  const handleCancelCurrentSubscription = () => {
    if (!canCancelSubscription) {
      setLicenseMsg('Plano atual nao permite cancelamento por este fluxo.');
      return;
    }

    if (pendingCheckout) {
      setLicenseMsg('Existe um checkout em andamento. Aguarde a confirmacao antes de cancelar.');
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Deseja realmente cancelar sua assinatura? Cobrancas futuras serao interrompidas.');
      if (!confirmed) return;
    }

    cancelSubscriptionMutation.mutate();
  };

  const handleLicenseConfirm = () => {
    if (pendingCheckout) {
      setLicenseMsg('Voce ja tem um checkout em andamento. Aguarde a confirmacao do Asaas ou contate o suporte.');
      return;
    }

    if (!selectedPlan) return;

    const hasAllRequiredConsents = requiredLegalDocs.every((doc) => acceptedDocCodes.includes(doc.code));
    if (!hasAllRequiredConsents) {
      setLicenseMsg('Você precisa aceitar os termos obrigatórios da assinatura antes de continuar.');
      return;
    }

    licenseMutation.mutate(selectedPlan);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('As novas senhas não coincidem.');
      return;
    }
    setPasswordError('');
    passwordMutation.mutate({ current: data.currentPassword, next: data.newPassword });
  };

  const currentPhotoSrc = photoPreview || (user?.base64Image ? `data:image/jpeg;base64,${user.base64Image}` : null);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 text-sm">Atualize suas informações pessoais e senha.</p>
      </div>

      {apiError && <ApiErrorAlert message={apiError} />}

      {isSubscriptionError && (
        <ApiErrorAlert message={getApiErrorMessage(subscriptionError, 'Falha ao carregar dados da assinatura.')} />
      )}

      {licenseModal && isPlansError && (
        <ApiErrorAlert message={getApiErrorMessage(plansError, 'Falha ao carregar planos disponíveis.')} />
      )}

      {licenseModal && isLegalDocsError && (
        <ApiErrorAlert message={getApiErrorMessage(legalDocsError, 'Falha ao carregar termos da assinatura.')} />
      )}

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="relative">
          {currentPhotoSrc ? (
            <img src={currentPhotoSrc} alt="foto" className="w-16 h-16 rounded-full object-cover border-2 border-brand-100" />
          ) : (
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-bold text-2xl">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-brand-600 text-white rounded-full p-1.5 shadow hover:bg-brand-700 transition"
            title="Alterar foto"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const b64 = await fileToBase64(file);
              setPhotoBase64(b64);
              setPhotoPreview(URL.createObjectURL(file));
            }}
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
            {user?.type === 'Owner' ? 'Proprietário' : user?.type === 'Professional' ? 'Profissional' : 'Admin'}
          </span>
          {photoBase64 && <p className="text-xs text-brand-600 mt-1">Nova foto selecionada — salve para aplicar</p>}
        </div>
      </div>

      {/* Profile form */}
      <Card title="Dados Pessoais">
        {profileSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Perfil atualizado com sucesso!
          </div>
        )}
        <form onSubmit={hProfile(d => profileMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome completo" {...rProfile('name')} />
            <Input label="E-mail" type="email" {...rProfile('email')} />
            <Input label="Telefone" placeholder="(11) 99999-9999" {...rProfile('phone')} />
            <Input label="Nome de usuário" {...rProfile('username')} />
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              {...rProfile('doc')}
              onChange={(e) => {
                setValue('doc', formatCPF(e.target.value));
              }}
            />
            <Input label="Data de Nascimento" type="date" {...rProfile('dob')} />
            <Input label="País" placeholder="Brasil" {...rProfile('country')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profileMutation.isPending}>
              <Save className="w-4 h-4" />
              Salvar Perfil
            </Button>
          </div>
        </form>
      </Card>

      {/* License Card */}
      <Card title="Sua Licença" action={
        <button onClick={() => setLicenseModal(true)} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
          <RefreshCw className="w-3.5 h-3.5" />
          {currentSubscription?.isActive ? 'Alterar plano' : 'Ativar plano'}
        </button>
      }>
        {currentSubscription?.isActive ? (
          <>
            {/* Active subscription display */}
            <div className="flex items-start gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: getPlanVisual(currentSubscription.planName, currentSubscription.status === 'Active' ? 1 : 0).bgColor }}
              >
                <div style={{ color: getPlanVisual(currentSubscription.planName, currentSubscription.status === 'Active' ? 1 : 0).color }}>
                  {getPlanVisual(currentSubscription.planName, currentSubscription.status === 'Active' ? 1 : 0).icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900">{currentSubscription.planName || `Plano #${currentSubscription.planId}`}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    currentSubscription.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : currentSubscription.status === 'Trial'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {currentSubscription.status === 'Active' ? '✓ Ativo' : currentSubscription.status === 'Trial' ? '⏱ Trial' : 'Processando'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Início</p>
                    <p className="font-medium text-gray-900">{new Date(currentSubscription.startDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vencimento</p>
                    <p className="font-medium text-gray-900">{new Date(currentSubscription.endDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {currentSubscription.nextBillingDate && (
                    <div>
                      <p className="text-gray-500">Próximo ciclo</p>
                      <p className="font-medium text-gray-900">{new Date(currentSubscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Trial info if applicable */}
            {currentSubscription.trialEndDate && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2 mb-4">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Período de teste ativo</p>
                  <p>Expira em {new Date(currentSubscription.trialEndDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Nenhuma licença ativa no momento.</p>
            <Button size="sm" onClick={() => setLicenseModal(true)}>
              <CreditCard className="w-4 h-4" />
              Ativar plano agora
            </Button>
          </div>
        )}
      </Card>

      {/* License Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${licenseModal ? '' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={closeLicenseModal} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {currentSubscription?.isActive ? 'Alterar Plano' : 'Escolha seu Plano'}
            </h2>
            <button 
              onClick={closeLicenseModal}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">

          {currentSubscription?.isActive && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Plano atual: <strong>{currentSubscription.planName || `Plano #${currentSubscription.planId}`}</strong> — {currentSubscription.status}
            </div>
          )}

          {currentSubscription?.isActive && canCancelSubscription && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg flex items-center justify-between gap-3">
              <div className="text-sm text-red-700">
                <p className="font-semibold">Cancelar assinatura atual</p>
                <p>Interrompe cobrancas futuras no Asaas e desativa o plano.</p>
              </div>
              <Button
                variant="danger"
                onClick={handleCancelCurrentSubscription}
                loading={cancelSubscriptionMutation.isPending}
                disabled={!!pendingCheckout}
              >
                Cancelar plano
              </Button>
            </div>
          )}

          {licenseMsg && (
            <div className={`p-3 rounded-lg text-sm border flex items-start gap-2 ${licenseMsg.includes('sucesso') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {licenseMsg.includes('sucesso') ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{licenseMsg}</span>
            </div>
          )}

          {pendingCheckout && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-3">
              <div>
                <p className="font-semibold">Checkout em andamento: {pendingCheckout.planName}</p>
                <p>Assim que o Asaas confirmar o pagamento, seu plano será atualizado automaticamente.</p>
              </div>
              {pendingCheckout.pendingExpiresAt && (
                <p className="text-xs text-blue-700">
                  Bloqueio ativo ate {new Date(pendingCheckout.pendingExpiresAt).toLocaleString('pt-BR')}.
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => void syncPendingCheckoutStatus(true)} loading={isSyncingCheckout}>
                  <RefreshCw className="w-4 h-4" />
                  Verificar status
                </Button>
                {pendingCheckout.checkoutUrl && (
                  <Button variant="outline" onClick={() => openCheckoutWindow(pendingCheckout.checkoutUrl!)}>
                    <ExternalLink className="w-4 h-4" />
                    Reabrir checkout
                  </Button>
                )}
                <Button variant="outline" onClick={() => openSupportWhatsApp(supportContact)}>
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Selecione um plano:</p>
            {!plans ? (
              <p className="text-sm text-gray-400 py-4 text-center">Carregando planos...</p>
            ) : filteredPlans.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                {currentSubscription?.isActive
                  ? 'Nenhum plano de upgrade disponível no momento.'
                  : 'Nenhum plano disponível agora. Tente novamente em instantes.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPlans.map(plan => {
                  const visual = getPlanVisual(plan.name, plan.price);
                  return (
                    <label 
                      key={plan.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPlanId === plan.id 
                          ? 'border-brand-500 bg-brand-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="text-brand-600"
                      />
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: visual.bgColor }}
                      >
                        <div style={{ color: visual.color }}>
                          {visual.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                        {plan.description && <p className="text-xs text-gray-500 truncate">{plan.description}</p>}
                      </div>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0 whitespace-nowrap">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlan && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {selectedPlan.price > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    O pagamento sera finalizado no checkout seguro do Asaas em uma nova aba, com cartao de credito.
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => openSupportWhatsApp(supportContact)}>
                  <MessageCircle className="w-4 h-4" />
                  Duvidas? Falar no WhatsApp
                </Button>
              </div>

              {legalDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Termos da assinatura</p>
                  {legalDocs.map((doc: any) => {
                    const accepted = acceptedDocCodes.includes(doc.code);
                    return (
                      <label key={doc.code} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          checked={accepted}
                          onChange={() => setAcceptedDocCodes((prev) => (
                            prev.includes(doc.code)
                              ? prev.filter((item) => item !== doc.code)
                              : [...prev, doc.code]
                          ))}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">
                            Li e aceito {doc.title}
                            {doc.isRequired && <span className="text-red-600"> *</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedLegalDoc(doc)}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ler documento (v{doc.version})
                          </button>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-white">
            <Button variant="outline" onClick={closeLicenseModal}>
              Cancelar
            </Button>
            <Button
              loading={licenseMutation.isPending}
              disabled={!selectedPlanId || !!pendingCheckout || cancelSubscriptionMutation.isPending}
              onClick={handleLicenseConfirm}
            >
              <CreditCard className="w-4 h-4" />
              {currentSubscription?.isActive ? 'Fazer Upgrade' : 'Ativar Plano'}
            </Button>
          </div>
        </div>
      </div>

      {selectedLegalDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLegalDoc(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedLegalDoc.title}</h3>
                <p className="text-sm text-gray-500">Versão {selectedLegalDoc.version}</p>
              </div>
              <button type="button" onClick={() => setSelectedLegalDoc(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] whitespace-pre-wrap text-sm text-gray-700 leading-6">
              {selectedLegalDoc.content}
            </div>
          </div>
        </div>
      )}

      {/* Password form */}
      <Card title="Alterar Senha">
        {passwordSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Senha alterada com sucesso!
          </div>
        )}
        <form onSubmit={hPassword(onPasswordSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Senha atual"
              type={showCurrent ? 'text' : 'password'}
              {...rPassword('currentPassword', { required: true })}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Nova senha"
              type={showNew ? 'text' : 'password'}
              {...rPassword('newPassword', { required: true, minLength: 6 })}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            label="Confirmar nova senha"
            type="password"
            {...rPassword('confirmPassword', { required: true })}
          />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={passwordMutation.isPending}>
              Alterar Senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

