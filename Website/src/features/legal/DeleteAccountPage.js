import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { privacyApi } from '../../api';
import { Button } from '../../components/ui/Button';
export default function DeleteAccountPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('confirm');
    const [errorMsg, setErrorMsg] = useState('');
    const handleDelete = async () => {
        setStep('processing');
        try {
            await privacyApi.deleteAccount();
            localStorage.clear();
            setStep('done');
        }
        catch (err) {
            setErrorMsg(err?.response?.data?.message || 'Erro ao excluir conta. Tente novamente.');
            setStep('error');
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Excluir Conta" }), step === 'confirm' && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-sm text-gray-600 mb-6", children: ["Tem certeza que deseja excluir sua conta? Esta a\u00E7\u00E3o \u00E9 ", _jsx("strong", { children: "irrevers\u00EDvel" }), " e todos os seus dados ser\u00E3o removidos permanentemente."] }), _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-sm text-red-700", children: "Seus agendamentos, hist\u00F3rico e todas as informa\u00E7\u00F5es associadas \u00E0 sua conta ser\u00E3o exclu\u00EDdos." }) }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => navigate('/'), children: "Cancelar" }), _jsx(Button, { variant: "danger", onClick: handleDelete, children: "Excluir minha conta" })] })] })), step === 'processing' && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Processando exclus\u00E3o..." })] })), step === 'done' && (_jsxs("div", { className: "text-center py-4", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("p", { className: "text-gray-900 font-medium mb-2", children: "Conta exclu\u00EDda com sucesso" }), _jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Sua conta e todos os dados associados foram removidos permanentemente." }), _jsx(Button, { onClick: () => navigate('/'), children: "Voltar ao in\u00EDcio" })] })), step === 'error' && (_jsxs("div", { className: "text-center py-4", children: [_jsx("p", { className: "text-red-600 mb-4", children: errorMsg }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx(Button, { variant: "outline", onClick: () => navigate('/'), children: "Voltar" }), _jsx(Button, { variant: "danger", onClick: handleDelete, children: "Tentar novamente" })] })] }))] }) }));
}
