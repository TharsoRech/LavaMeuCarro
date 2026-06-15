import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { privacyApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { logAction } from '../../utils/telemetry';
export function AdminPrivacy() {
    const { user } = useAdminAuth();
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);
    const [error, setError] = useState('');
    const handleExport = async () => {
        setExporting(true);
        setError('');
        try {
            const data = await privacyApi.exportData();
            logAction('privacy_export');
            // Download as JSON
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meus-dados-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setExportDone(true);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Erro ao exportar dados.');
        }
        finally {
            setExporting(false);
        }
    };
    return (_jsxs("div", { className: "max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Privacidade" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Gerencie seus dados pessoais conforme a LGPD." }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Seus Dados" }), _jsx(CardDescription, { children: "Informa\u00E7\u00F5es associadas \u00E0 sua conta." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Nome" }), _jsx("span", { className: "font-medium text-gray-900", children: user?.nome })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Email" }), _jsx("span", { className: "font-medium text-gray-900", children: user?.email })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Telefone" }), _jsx("span", { className: "font-medium text-gray-900", children: user?.telefone || '-' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Conta criada em" }), _jsx("span", { className: "font-medium text-gray-900", children: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-' })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Exportar Dados" }), _jsx(CardDescription, { children: "Baixe uma c\u00F3pia de todos os dados associados \u00E0 sua conta em formato JSON." })] }), _jsxs(CardContent, { children: [exportDone && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm text-green-700", children: "Dados exportados com sucesso!" }) })), _jsx(Button, { onClick: handleExport, loading: exporting, variant: "outline", children: "Exportar meus dados" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-red-600", children: "Excluir Conta" }), _jsx(CardDescription, { children: "Esta a\u00E7\u00E3o \u00E9 irrevers\u00EDvel. Todos os seus dados ser\u00E3o removidos permanentemente." })] }), _jsx(CardContent, { children: _jsx("a", { href: "/delete-account", target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "danger", children: "Ir para exclus\u00E3o de conta" }) }) })] })] })] }));
}
