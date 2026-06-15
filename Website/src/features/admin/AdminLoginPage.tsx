import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, AlertTriangle, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { authApi, supportApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { logTelemetry } from '../../utils/telemetry';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(4, 'Senha obrigatória'),
});

type FormData = z.infer<typeof schema>;

type HelpChannel = 'whatsapp' | 'email';

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpChannel, setHelpChannel] = useState<HelpChannel>('whatsapp');
  const [helpDestination, setHelpDestination] = useState('');
  const [helpMessage, setHelpMessage] = useState('Oi! Preciso de ajuda para entrar no painel web do Lava Meu Carro.');
  const { setAuth } = useAdminAuth();
  const navigate = useNavigate();

  const {
    data: supportContact,
    isError: hasSupportError,
  } = useQuery({
    queryKey: ['support-contact-login-help'],
    queryFn: () => supportApi.getContact().then((res) => res.data),
    staleTime: 1000 * 60 * 10,
  });

  const defaultWhatsApp = useMemo(() => {
    const fallbackPhone = supportContact?.whatsApp || supportContact?.phone || '';
    return normalizeWhatsAppNumber(fallbackPhone);
  }, [supportContact?.phone, supportContact?.whatsApp]);

  const defaultEmail = supportContact?.email?.trim() || 'suporte@lavameucarro.com';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setIsMaintenance(false);
    try {
      const res = await authApi.login({ Email: data.email, Password: data.password });
      const { token, refreshToken, user } = res;
      const type = user?.type;

      if (type !== 'Owner' && type !== 'Professional' && type !== 'Admin' && type !== 3 && type !== 2 && type !== 1) {
        setServerError('Acesso negado. Somente proprietários e profissionais administradores podem acessar este painel.');
        return;
      }

      // Fetch full profile
      const profileRes = await authApi.me();
      setAuth(token, refreshToken, profileRes.data || profileRes);
      logTelemetry('Admin login succeeded.', {
        level: 'Information',
        context: { userType: type, userId: (profileRes.data || profileRes)?.id },
      });
      navigate('/admin');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string, error?: string } } };
      // O backend usa 'error' no corpo da resposta do middleware de exceção
      const message = e.response?.data?.error || e.response?.data?.message || '';
      
      if (message.includes('MAINTENANCE_MODE')) {
        setIsMaintenance(true);
        setServerError(message.replace('MAINTENANCE_MODE: ', ''));
      } else {
        setServerError(message || 'E-mail ou senha inválidos. Tente novamente.');
      }

      logTelemetry('Admin login failed.', {
        level: 'Warning',
        context: {
          status: (err as { response?: { status?: number } })?.response?.status,
          message,
          isMaintenance: message.includes('MAINTENANCE_MODE'),
        },
      });
    }
  };

  const openHelpChannel = () => {
    const message = encodeURIComponent(helpMessage.trim() || 'Preciso de ajuda para acessar o painel.');

    if (helpChannel === 'whatsapp') {
      const phone = normalizeWhatsAppNumber(helpDestination);
      if (!phone) return;
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
      return;
    }

    const email = helpDestination.trim();
    if (!email) return;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent('Ajuda com login no painel')}&body=${message}`;
  };

  const isHelpActionDisabled =
    helpChannel === 'whatsapp'
      ? !normalizeWhatsAppNumber(helpDestination)
      : !helpDestination.trim();

  const openHelpModal = () => {
    const destination = helpChannel === 'whatsapp' ? defaultWhatsApp : defaultEmail;
    setHelpDestination(destination);
    setIsHelpModalOpen(true);
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema em Manutenção</h1>
          <p className="text-gray-600 mb-8">
            {serverError || 'O sistema está temporariamente indisponível para melhorias. Por favor, tente novamente em alguns instantes.'}
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-500 text-sm mt-1">Lava Meu Carro</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10 ${
                    errors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Entrar
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-800">Precisa de ajuda para entrar?</p>
            <p className="mt-1 text-xs text-brand-700">
              Fale com o suporte por WhatsApp ou e-mail. Voce pode ajustar o contato antes de enviar.
            </p>
            <button
              type="button"
              onClick={openHelpModal}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Abrir canais de ajuda
              <ExternalLink className="w-4 h-4" />
            </button>
            {hasSupportError && (
              <p className="mt-2 text-xs text-amber-700">
                Nao conseguimos carregar o contato oficial agora, mas voce pode preencher manualmente.
              </p>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Use as mesmas credenciais do aplicativo móvel.
          </p>
        </div>
      </div>

      <Modal
        open={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Central de ajuda"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setIsHelpModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={openHelpChannel} disabled={isHelpActionDisabled}>
              Abrir {helpChannel === 'whatsapp' ? 'WhatsApp' : 'e-mail'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Escolha o canal e personalize a mensagem. O link sera aberto no seu dispositivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setHelpChannel('whatsapp');
                setHelpDestination(defaultWhatsApp);
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${helpChannel === 'whatsapp' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
              </span>
              <p className="mt-1 text-xs text-gray-600">Resposta rapida para duvidas de acesso.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setHelpChannel('email');
                setHelpDestination(defaultEmail);
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${helpChannel === 'email' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Mail className="w-4 h-4 text-brand-600" /> E-mail
              </span>
              <p className="mt-1 text-xs text-gray-600">Ideal para enviar detalhes e print do erro.</p>
            </button>
          </div>

          <Input
            label={helpChannel === 'whatsapp' ? 'Numero do WhatsApp' : 'E-mail de suporte'}
            value={helpDestination}
            onChange={(event) => setHelpDestination(event.target.value)}
            placeholder={helpChannel === 'whatsapp' ? '54999999999' : 'suporte@lavameucarro.com'}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Mensagem</label>
            <textarea
              value={helpMessage}
              onChange={(event) => setHelpMessage(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

