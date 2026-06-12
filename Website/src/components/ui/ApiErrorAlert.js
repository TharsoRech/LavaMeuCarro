import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ApiErrorAlert({ message, onRetry, dark = false }) {
    if (dark) {
        return (_jsxs("div", { className: "rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200 flex items-center justify-between gap-3", children: [_jsx("span", { children: message }), onRetry && (_jsx("button", { onClick: onRetry, className: "px-2.5 py-1 text-xs rounded border border-red-700 hover:bg-red-900/40 transition-colors", children: "Tentar novamente" }))] }));
    }
    return (_jsxs("div", { className: "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3", children: [_jsx("span", { children: message }), onRetry && (_jsx("button", { onClick: onRetry, className: "px-2.5 py-1 text-xs rounded border border-red-300 hover:bg-red-100 transition-colors", children: "Tentar novamente" }))] }));
}
