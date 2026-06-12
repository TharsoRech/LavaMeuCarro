import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { masterSupportApi, masterPasswordApi } from '../../api';
import { Button } from '../../components/ui/Button';
import type { SupportSetting } from '../../types';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

const sensitiveKeys = [
  'jwt.key',
  'asaas.api_token',
  'asaas.webhook_token',
  'payments.asaas.apitoken',
  'payments.asaas.webhooktoken',
  'payments.asaas.prod.apitoken',
  'payments.asaas.dev.apitoken',
  'payments.asaas.prod.webhooktoken',
  'payments.asaas.dev.webhooktoken',
  'smtp.password',
  'smtp.password.encrypted',
  'smtp.password.hash',
];

const asaasBaseCodes = {
  enabled: 'payments.asaas.enabled',
  environment: 'payments.asaas.environment',
};

const asaasEnvFields = [
  { suffix: 'apiToken', label: 'API Token', sensitive: true },
  { suffix: 'webhookToken', label: 'Webhook Token', sensitive: true },
  { suffix: 'apiBaseUrl', label: 'API Base URL', sensitive: false },
  { suffix: 'backUrl', label: 'Back URL', sensitive: false },
  { suffix: 'walletId', label: 'Wallet ID', sensitive: false },
] as const;

const EMAIL_FOOTER_ICON_CODE = 'email.footer.icon.base64';

export function MasterSettings() {
  const qc = useQueryClient();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [newSettingCode, setNewSettingCode] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');
  const [createError, setCreateError] = useState('');
  const [emailIconValue, setEmailIconValue] = useState<string | null>(null);
  const [emailIconError, setEmailIconError] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  // SMTP password change
  const [newSmtpPassword, setNewSmtpPassword] = useState('');
  const [confirmSmtpPassword, setConfirmSmtpPassword] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpPassSuccess, setSmtpPassSuccess] = useState(false);
  const [smtpPassError, setSmtpPassError] = useState('');

  const { data: settings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master-settings'],
    queryFn: () => masterSupportApi.getSettings().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, value }: { code: string; value: string }) =>
      masterSupportApi.updateSetting(code, value),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['master-settings'] });
      setEditingCode(null);
      setSavedCode(vars.code);
      setTimeout(() => setSavedCode(null), 2000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (pwd: string) => masterPasswordApi.set(pwd),
    onSuccess: () => {
      setPassSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setPassError('');
      setTimeout(() => setPassSuccess(false), 3000);
    },
    onError: () => setPassError('Erro ao alterar a senha. Verifique e tente novamente.'),
  });

  const smtpPasswordMutation = useMutation({
    mutationFn: (pwd: string) => masterSupportApi.setSmtpPassword(pwd),
    onSuccess: () => {
      setSmtpPassSuccess(true);
      setNewSmtpPassword('');
      setConfirmSmtpPassword('');
      setSmtpPassError('');
      qc.invalidateQueries({ queryKey: ['master-settings'] });
      setTimeout(() => setSmtpPassSuccess(false), 3000);
    },
    onError: (err) => setSmtpPassError(getApiErrorMessage(err, 'Erro ao alterar a senha SMTP. Verifique e tente novamente.')),
  });

  const createSettingMutation = useMutation({
    mutationFn: ({ code, value }: { code: string; value: string }) =>
      masterSupportApi.createSetting(code, value),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['master-settings'] });
      setSavedCode(vars.code);
      setNewSettingCode('');
      setNewSettingValue('');
      setCreateError('');
      setTimeout(() => setSavedCode(null), 2000);
    },
    onError: () => setCreateError('Erro ao criar configuração. Verifique os dados e tente novamente.'),
  });

  const handlePasswordSubmit = () => {
    setPassError('');
    if (newPassword.length < 8) { setPassError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPassError('As senhas não coincidem.'); return; }
    passwordMutation.mutate(newPassword);
  };

  const handleSmtpPasswordSubmit = () => {
    setSmtpPassError('');
    if (newSmtpPassword.trim().length < 8) { setSmtpPassError('A senha SMTP deve ter no mínimo 8 caracteres.'); return; }
    if (newSmtpPassword !== confirmSmtpPassword) { setSmtpPassError('As senhas SMTP não coincidem.'); return; }
    smtpPasswordMutation.mutate(newSmtpPassword);
  };

  const handleCreateSetting = () => {
    setCreateError('');
    const code = newSettingCode.trim().toLowerCase();
    if (!code) {
      setCreateError('Informe o código da configuração.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(code)) {
      setCreateError('Use apenas letras minúsculas, números, ponto, hífen ou underline no código.');
      return;
    }
    const exists = (settings ?? []).some((item) => item.code.toLowerCase() === code);
    if (exists) {
      setCreateError('Esse código já existe. Edite a configuração existente.');
      return;
    }
    createSettingMutation.mutate({ code, value: newSettingValue });
  };

  const isSensitive = (code: string) => sensitiveKeys.some(k => code.toLowerCase().includes(k));

  const getSettingValue = (code: string) =>
    (settings ?? []).find(s => s.code.toLowerCase() === code.toLowerCase())?.value ?? '';

  const upsertSetting = (code: string, value: string) => updateMutation.mutate({ code, value });

  const asaasEnabledValue = (getSettingValue(asaasBaseCodes.enabled) || 'true').trim().toLowerCase();
  const asaasEnabled = asaasEnabledValue === 'true' || asaasEnabledValue === '1';
  const asaasEnvironmentRaw = (getSettingValue(asaasBaseCodes.environment) || 'production').trim().toLowerCase();
  const asaasEnvironment = asaasEnvironmentRaw === 'development' || asaasEnvironmentRaw === 'dev' ? 'development' : 'production';

  const groupedSettings = settings?.reduce<Record<string, SupportSetting[]>>((acc, s) => {
    const group = s.code.split('.')[0] ?? 'geral';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  const currentEmailIconValue = getSettingValue(EMAIL_FOOTER_ICON_CODE);
  const emailIconEditorValue = emailIconValue ?? currentEmailIconValue;

  const handleEmailIconUpload = (file?: File | null) => {
    if (!file) return;

    const maxSizeBytes = 512 * 1024;
    if (file.size > maxSizeBytes) {
      setEmailIconError('Imagem muito grande. Limite de 512 KB.');
      return;
    }

    setEmailIconError('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      setEmailIconValue(base64.trim());
    };
    reader.onerror = () => setEmailIconError('Falha ao ler o arquivo de imagem.');
    reader.readAsDataURL(file);
  };

  const handleSaveEmailIcon = () => {
    setEmailIconError('');
    const normalized = emailIconEditorValue.trim();
    if (normalized) {
      try {
        const binary = atob(normalized);
        if (binary.length > 512 * 1024) {
          setEmailIconError('Imagem muito grande. Limite de 512 KB.');
          return;
        }
      } catch {
        setEmailIconError('Base64 inválido. Use uma imagem em Base64 válida.');
        return;
      }
    }

    upsertSetting(EMAIL_FOOTER_ICON_CODE, normalized);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
        <p className="text-slate-400 text-sm">Gerencie as configurações de suporte e operação da plataforma.</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Nova configuração</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Código *</label>
              <input
                value={newSettingCode}
                onChange={(e) => setNewSettingCode(e.target.value)}
                placeholder="ex: smtp.host"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor</label>
              <input
                type={isSensitive(newSettingCode) ? 'password' : 'text'}
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
                placeholder="valor da configuração"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <Button loading={createSettingMutation.isPending} className="bg-red-600 hover:bg-red-700" onClick={handleCreateSetting}>
            <Save className="w-4 h-4" />
            Adicionar configuração
          </Button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-cyan-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Asaas (Prod e Developer)</h3>
          <p className="text-xs text-slate-400 mt-1">Ligue/desligue o gateway e mantenha credenciais separadas para cada ambiente.</p>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Gateway Asaas habilitado</label>
              <select
                value={asaasEnabled ? 'true' : 'false'}
                onChange={(e) => upsertSetting(asaasBaseCodes.enabled, e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="true">Ligado</option>
                <option value="false">Desligado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ambiente ativo</label>
              <select
                value={asaasEnvironment}
                onChange={(e) => upsertSetting(asaasBaseCodes.environment, e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="production">Produção</option>
                <option value="development">Developer / Sandbox</option>
              </select>
            </div>
          </div>

          {(['prod', 'dev'] as const).map((env) => (
            <div key={env} className="rounded-lg border border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">
                  {env === 'prod' ? 'Credenciais Produção' : 'Credenciais Developer/Sandbox'}
                </h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  (env === 'prod' && asaasEnvironment === 'production') || (env === 'dev' && asaasEnvironment === 'development')
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  {(env === 'prod' && asaasEnvironment === 'production') || (env === 'dev' && asaasEnvironment === 'development')
                    ? 'Ativo agora'
                    : 'Standby'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {asaasEnvFields.map((field) => {
                  const code = `payments.asaas.${env}.${field.suffix}`;
                  return (
                    <div key={code}>
                      <label className="text-xs text-slate-400 block mb-1">{field.label}</label>
                      <div className="flex gap-2">
                        <input
                          type={field.sensitive ? 'password' : 'text'}
                          defaultValue={getSettingValue(code)}
                          placeholder={code}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                          onBlur={(e) => {
                            const next = e.target.value ?? '';
                            if (next !== getSettingValue(code)) upsertSetting(code, next);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400">
            Dica: os códigos antigos `payments.asaas.apiToken` e similares continuam como fallback, mas o recomendado agora é usar os campos separados por ambiente.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-indigo-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Branding de e-mail (ícone do rodapé)</h3>
          <p className="text-xs text-slate-400 mt-1">Edite o Base64 da imagem usada nos e-mails transacionais.</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-slate-400">Upload da imagem</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleEmailIconUpload(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-300"
            />
            <span className="text-xs text-slate-500">(máx. 512 KB)</span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-mono">{EMAIL_FOOTER_ICON_CODE}</label>
            <textarea
              value={emailIconEditorValue}
              onChange={(e) => setEmailIconValue(e.target.value)}
              rows={6}
              placeholder="Cole aqui o Base64 puro da imagem"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Tamanho atual: {emailIconEditorValue.trim().length.toLocaleString('pt-BR')} caracteres</p>
          </div>

          {emailIconError && <p className="text-sm text-red-400">{emailIconError}</p>}

          <div className="flex gap-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              loading={updateMutation.isPending && editingCode === null}
              onClick={handleSaveEmailIcon}
            >
              <Save className="w-4 h-4" />
              Salvar ícone
            </Button>
            <Button
              variant="ghost"
              className="text-slate-300 border border-slate-600"
              onClick={() => {
                setEmailIconError('');
                setEmailIconValue('');
                upsertSetting(EMAIL_FOOTER_ICON_CODE, '');
              }}
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Change Master Password */}
      <div className="bg-slate-800 rounded-xl border border-red-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-white">Alterar Senha Master</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            A senha será hasheada com BCrypt e salva no banco. Mínimo 8 caracteres.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Confirmar nova senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          {passError && <p className="text-sm text-red-400">{passError}</p>}
          {passSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Senha master alterada com sucesso!
            </div>
          )}
          <Button loading={passwordMutation.isPending} className="bg-red-600 hover:bg-red-700" onClick={handlePasswordSubmit}>
            <Save className="w-4 h-4" />
            Alterar Senha
          </Button>
        </div>
      </div>

      {/* Change SMTP Password */}
      <div className="bg-slate-800 rounded-xl border border-amber-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-white">Alterar Senha SMTP</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            Atualiza a credencial SMTP usada para envio de e-mails do sistema.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nova senha SMTP</label>
              <div className="relative">
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  value={newSmtpPassword}
                  onChange={e => setNewSmtpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                />
                <button type="button" onClick={() => setShowSmtpPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Confirmar nova senha SMTP</label>
              <input
                type={showSmtpPass ? 'text' : 'password'}
                value={confirmSmtpPassword}
                onChange={e => setConfirmSmtpPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          {smtpPassError && <p className="text-sm text-red-400">{smtpPassError}</p>}
          {smtpPassSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Senha SMTP alterada com sucesso!
            </div>
          )}
          <Button loading={smtpPasswordMutation.isPending} className="bg-amber-600 hover:bg-amber-700" onClick={handleSmtpPasswordSubmit}>
            <Save className="w-4 h-4" />
            Alterar Senha SMTP
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-slate-400 text-sm">Carregando...</div>}

      {isError && (
        <ApiErrorAlert
          dark
          message={getApiErrorMessage(error, 'Falha ao carregar configurações do sistema.')}
          onRetry={() => refetch()}
        />
      )}

      {groupedSettings && Object.entries(groupedSettings).map(([group, items]) => (
        <div key={group} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white capitalize">{group}</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {items.map(setting => {
              const isEdit = editingCode === setting.code;
              const isSens = isSensitive(setting.code);
              const isRevealed = revealedKeys.has(setting.code);

              const displayValue = isSens && !isRevealed && setting.value
                ? '••••••••••••'
                : setting.value || '(vazio)';

              return (
                <div key={setting.code} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {setting.code}
                        </code>
                        {savedCode === setting.code && (
                          <span className="text-xs text-green-400">✓ Salvo</span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-slate-500 mb-2">{setting.description}</p>
                      )}
                      {isEdit ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type={isSens ? 'password' : 'text'}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            loading={updateMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => updateMutation.mutate({ code: setting.code, value: editValue })}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setEditingCode(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 font-mono break-all">{displayValue}</p>
                      )}
                    </div>
                    {!isEdit && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSens && setting.value && (
                          <button
                            onClick={() => {
                              const next = new Set(revealedKeys);
                              if (isRevealed) next.delete(setting.code); else next.add(setting.code);
                              setRevealedKeys(next);
                            }}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingCode(setting.code); setEditValue(setting.value || ''); }}
                          className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 px-3 py-1 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

