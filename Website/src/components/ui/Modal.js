import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
export const Modal = ({ open, onClose, title, description, children, footer, size = 'md', }) => {
    const overlayRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handleEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { ref: overlayRef, className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", onClick: (e) => {
            if (e.target === overlayRef.current)
                onClose();
        }, children: _jsxs("div", { className: `w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col`, children: [(title || description) && (_jsxs("div", { className: "px-6 py-4 border-b border-gray-100 flex items-start justify-between", children: [_jsxs("div", { children: [title && _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: title }), description && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: description })] }), _jsx("button", { onClick: onClose, className: "p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] })), _jsx("div", { className: "px-6 py-4 overflow-y-auto flex-1", children: children }), footer && _jsx("div", { className: "px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl", children: footer })] }) }));
};
