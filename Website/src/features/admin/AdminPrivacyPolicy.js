import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { legalApi } from '../../api';
export default function AdminPrivacyPolicy() {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        legalApi
            .getPrivacyPolicy()
            .then(setDoc)
            .catch(() => setError('Não foi possível carregar a política de privacidade.'))
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "animate-pulse text-gray-400", children: "Carregando..." }) }));
    }
    return (_jsxs("div", { className: "max-w-3xl", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Pol\u00EDtica de Privacidade" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Visualize a pol\u00EDtica de privacidade da plataforma." }), error ? (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })) : (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-8", children: [doc?.updatedAt && (_jsxs("p", { className: "text-sm text-gray-500 mb-4", children: ["\u00DAltima atualiza\u00E7\u00E3o: ", new Date(doc.updatedAt).toLocaleDateString('pt-BR')] })), _jsx("div", { className: "prose prose-gray max-w-none", dangerouslySetInnerHTML: { __html: doc?.content || 'Nenhum conteúdo disponível.' } })] }))] }));
}
