import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { legalApi } from '../../api';
export function PrivacyPolicyPage() {
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
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-pulse text-gray-400", children: "Carregando..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("p", { className: "text-red-500", children: error }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-3xl mx-auto px-4 py-12", children: [_jsx("a", { href: "/", className: "text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block", children: "\u2190 Voltar ao in\u00EDcio" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: doc?.title || 'Política de Privacidade' }), doc?.updatedAt && (_jsxs("p", { className: "text-sm text-gray-500 mb-8", children: ["\u00DAltima atualiza\u00E7\u00E3o: ", new Date(doc.updatedAt).toLocaleDateString('pt-BR')] })), _jsx("div", { className: "prose prose-gray max-w-none", dangerouslySetInnerHTML: { __html: doc?.content || '' } })] }) }));
}
export function TermsOfUsePage() {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        legalApi
            .getTermsOfUse()
            .then(setDoc)
            .catch(() => setError('Não foi possível carregar os termos de uso.'))
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-pulse text-gray-400", children: "Carregando..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("p", { className: "text-red-500", children: error }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-3xl mx-auto px-4 py-12", children: [_jsx("a", { href: "/", className: "text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block", children: "\u2190 Voltar ao in\u00EDcio" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: doc?.title || 'Termos de Uso' }), doc?.updatedAt && (_jsxs("p", { className: "text-sm text-gray-500 mb-8", children: ["\u00DAltima atualiza\u00E7\u00E3o: ", new Date(doc.updatedAt).toLocaleDateString('pt-BR')] })), _jsx("div", { className: "prose prose-gray max-w-none", dangerouslySetInnerHTML: { __html: doc?.content || '' } })] }) }));
}
