import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Componente para conformidade com a LGPD (Brasil).
 * Garante que o usuário aceite explicitamente os termos e políticas.
 */
export const LegalConsent = ({ register, name, documentVersion, error }) => {
    return (_jsxs("div", { className: "flex flex-col gap-2 my-4", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("input", { type: "checkbox", id: name, ...register(name, { required: 'Você deve aceitar os termos para prosseguir' }), className: "mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" }), _jsxs("label", { htmlFor: name, className: "text-sm text-gray-600", children: ["Li e concordo com os", ' ', _jsx("a", { href: "/termos", target: "_blank", className: "text-blue-600 underline", children: "Termos de Uso" }), " e a", ' ', _jsx("a", { href: "/privacidade", target: "_blank", className: "text-blue-600 underline", children: "Pol\u00EDtica de Privacidade" }), ".", _jsxs("span", { className: "block text-[10px] text-gray-400 mt-1", children: ["Vers\u00E3o do documento: ", documentVersion] })] })] }), error && _jsx("p", { className: "text-red-500 text-xs", children: error }), _jsx("input", { type: "hidden", ...register(`${name}_version`), value: documentVersion })] }));
};
