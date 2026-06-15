import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { marketingApi } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { logAction } from '../../utils/telemetry';
export function AdminMarketing() {
    const { unidades } = useUnitSelection();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [targetUnitId, setTargetUnitId] = useState();
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setError('Preencha o título e a mensagem.');
            return;
        }
        setSending(true);
        setError('');
        setSuccess(false);
        try {
            await marketingApi.broadcast({
                title,
                message,
                targetAudience,
                targetUnitId: targetAudience === 'unit' ? targetUnitId : undefined,
            });
            logAction('marketing_broadcast', { targetAudience });
            setSuccess(true);
            setTitle('');
            setMessage('');
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Erro ao enviar notificação.');
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("div", { className: "max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Marketing" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Envie notifica\u00E7\u00F5es em massa para seus clientes." }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Nova Campanha" }), _jsx(CardDescription, { children: "Compose e envie uma notifica\u00E7\u00E3o push para seus clientes." })] }), _jsxs(CardContent, { children: [success && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm text-green-700", children: "Notifica\u00E7\u00E3o enviada com sucesso!" }) })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })), _jsxs("div", { className: "space-y-4", children: [_jsx(Select, { label: "P\u00FAblico-alvo", value: targetAudience, onChange: (e) => setTargetAudience(e.target.value), options: [
                                            { value: 'all', label: 'Todos os clientes' },
                                            { value: 'active', label: 'Clientes ativos' },
                                            { value: 'inactive', label: 'Clientes inativos' },
                                            { value: 'unit', label: 'Clientes de uma unidade' },
                                        ] }), targetAudience === 'unit' && (_jsx(Select, { label: "Unidade", value: targetUnitId?.toString() || '', onChange: (e) => setTargetUnitId(Number(e.target.value)), options: unidades.map((u) => ({ value: u.id.toString(), label: u.name })) })), _jsx(Input, { label: "T\u00EDtulo", placeholder: "Ex: Promo\u00E7\u00E3o de Natal!", value: title, onChange: (e) => setTitle(e.target.value) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Mensagem" }), _jsx("textarea", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", rows: 4, placeholder: "Escreva a mensagem da notifica\u00E7\u00E3o...", value: message, onChange: (e) => setMessage(e.target.value) })] }), _jsx(Button, { onClick: handleSend, loading: sending, disabled: !title.trim() || !message.trim(), children: "Enviar Notifica\u00E7\u00E3o" })] })] })] })] }));
}
