import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAdminAuth } from '../../stores/authStore';
import { updateProfile, changePassword } from '../../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Phone, Lock, Save, HelpCircle } from 'lucide-react';
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
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateProfile(profileForm);
            if (token && refreshToken) {
                setAuth(token, refreshToken, { ...user, ...updated });
            }
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        }
        catch { /* ignore */ }
        finally {
            setSaving(false);
        }
    };
    const handlePasswordSubmit = async (e) => {
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
        }
        catch (err) {
            setPasswordError(err?.response?.data?.message || 'Erro ao alterar senha.');
        }
    };
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Meu Perfil" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4", children: _jsx("span", { className: "text-blue-600 font-bold text-2xl", children: user?.nome?.charAt(0) || 'U' }) }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: user?.nome || 'Usuário' }), _jsx("p", { className: "text-sm text-gray-500", children: user?.email }), _jsx("span", { className: "mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium", children: user?.tipo === 2 ? 'Proprietário' : user?.tipo === 3 ? 'Admin' : 'Usuário' }), _jsxs("p", { className: "text-xs text-gray-400 mt-2", children: ["Conta criada em ", user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'] })] }) }) }), _jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Editar Informa\u00E7\u00F5es" }), _jsx(CardDescription, { children: "Atualize seus dados pessoais." })] }), _jsxs(CardContent, { children: [profileSuccess && (_jsx("div", { className: "bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm", children: "Perfil atualizado com sucesso!" })), _jsxs("form", { onSubmit: handleProfileSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { name: "nome", value: profileForm.nome, onChange: (e) => setProfileForm(f => ({ ...f, nome: e.target.value })), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { value: user?.email || '', disabled: true, className: "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" })] }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Email n\u00E3o pode ser alterado." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Telefone" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { name: "telefone", value: profileForm.telefone, onChange: (e) => setProfileForm(f => ({ ...f, telefone: e.target.value })), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "(00) 00000-0000" })] })] }), _jsxs(Button, { type: "submit", loading: saving, children: [_jsx(Save, { className: "w-4 h-4 mr-1" }), " Salvar"] })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Alterar Senha" }), _jsx(CardDescription, { children: "Atualize sua senha de acesso." })] }), _jsxs(CardContent, { children: [passwordSuccess && (_jsx("div", { className: "bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm", children: "Senha alterada com sucesso!" })), passwordError && (_jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm", children: passwordError })), _jsxs("form", { onSubmit: handlePasswordSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Senha Atual", type: "password", value: passwordForm.currentPassword, onChange: (e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value })), required: true }), _jsx(Input, { label: "Nova Senha", type: "password", value: passwordForm.newPassword, onChange: (e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value })), required: true }), _jsx(Input, { label: "Confirmar Nova Senha", type: "password", value: passwordForm.confirmPassword, onChange: (e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value })), required: true }), _jsxs(Button, { type: "submit", children: [_jsx(Lock, { className: "w-4 h-4 mr-1" }), " Alterar Senha"] })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(HelpCircle, { className: "w-5 h-5 text-blue-600" }), "Suporte"] }), _jsx(CardDescription, { children: "Precisa de ajuda? Entre em contato conosco." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "text-gray-600", children: ["Email: ", _jsx("a", { href: "mailto:suporte@lavameucarro.com", className: "text-blue-600 hover:text-blue-700", children: "suporte@lavameucarro.com" })] }), _jsxs("p", { className: "text-gray-600", children: ["WhatsApp: ", _jsx("a", { href: "https://wa.me/5500000000000", target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-700", children: "(00) 00000-0000" })] })] }) })] })] })] })] }));
}
