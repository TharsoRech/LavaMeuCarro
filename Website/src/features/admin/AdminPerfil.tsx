import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAdminAuth } from '../../stores/authStore';
import { updateProfile, changePassword, getSupportContact } from '../../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Phone, Lock, Save, CreditCard, HelpCircle } from 'lucide-react';

export default function AdminPerfil() {
  const { user, setAuth, token, refreshToken } = useAdminAuth();
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
  });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(profileForm);
      if (token && refreshToken) {
        setAuth(token, refreshToken, { ...user!, ...updated });
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Erro ao alterar senha.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-2xl">{user?.nome?.charAt(0) || 'U'}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.nome || 'Usuário'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                {user?.tipo === 2 ? 'Proprietário' : user?.tipo === 3 ? 'Admin' : 'Usuário'}
              </span>
              <p className="text-xs text-gray-400 mt-2">
                Conta criada em {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar Informações</CardTitle>
              <CardDescription>Atualize seus dados pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
              {profileSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">Perfil atualizado com sucesso!</div>
              )}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="nome"
                      value={profileForm.nome}
                      onChange={(e) => setProfileForm(f => ({ ...f, nome: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="telefone"
                      value={profileForm.telefone}
                      onChange={(e) => setProfileForm(f => ({ ...f, telefone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <Button type="submit" loading={saving}>
                  <Save className="w-4 h-4 mr-1" /> Salvar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">Senha alterada com sucesso!</div>
              )}
              {passwordError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{passwordError}</div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Senha Atual"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                />
                <Input
                  label="Nova Senha"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  required
                />
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                />
                <Button type="submit">
                  <Lock className="w-4 h-4 mr-1" /> Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Suporte
              </CardTitle>
              <CardDescription>Precisa de ajuda? Entre em contato conosco.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Email: <a href="mailto:suporte@lavameucarro.com" className="text-blue-600 hover:text-blue-700">suporte@lavameucarro.com</a></p>
                <p className="text-gray-600">WhatsApp: <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">(00) 00000-0000</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
