import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminAuth } from '../../stores/authStore';
import { api } from '../../api/client';
import { Car, Eye, EyeOff, MessageCircle } from 'lucide-react';
const loginSchema = z.object({
    email: z.string().email('Email obrigatório'),
    senha: z.string().min(6, 'Mínimo 6 caracteres'),
});
export default function AdminLoginPage() {
    const navigate = useNavigate();
    const { setAuth } = useAdminAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });
    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { ...data, tipo: 'Admin' });
            setAuth(res.data.token, res.data.refreshToken, res.data.user);
            navigate('/admin/dashboard');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Erro ao fazer login');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl w-full max-w-md p-8", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [_jsx("div", { className: "bg-blue-600 p-3 rounded-xl mb-4", children: _jsx(Car, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Lava Meu Carro" }), _jsx("p", { className: "text-gray-500 mt-1", children: "Painel do Estabelecimento" })] }), error && (_jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { ...register('email'), type: "email", className: "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition", placeholder: "seu@email.com" }), errors.email && _jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx("input", { ...register('senha'), type: showPassword ? 'text' : 'password', className: "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), errors.senha && _jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.senha.message })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50", children: loading ? 'Entrando...' : 'Entrar' })] }), _jsxs("div", { className: "mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-blue-800", children: "Precisa de ajuda para entrar?" }), _jsx("p", { className: "mt-1 text-xs text-blue-700", children: "Fale com o suporte por WhatsApp." }), _jsxs("a", { href: "https://wa.me/5554999374583?text=Oi!%20Preciso%20de%20ajuda%20para%20entrar%20no%20painel%20do%20Lava%20Meu%20Carro", target: "_blank", rel: "noopener noreferrer", className: "mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), " Abrir WhatsApp"] })] }), _jsx("p", { className: "text-center text-xs text-gray-400 mt-6", children: "Use as mesmas credenciais do aplicativo m\u00F3vel." })] }) }));
}
