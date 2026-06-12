import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Input = React.forwardRef(({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsx("input", { ref: ref, id: inputId, className: `w-full px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`, ...props }), error && _jsx("p", { className: "mt-1 text-sm text-red-600", children: error })] }));
});
Input.displayName = 'Input';
export const Textarea = React.forwardRef(({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsx("textarea", { ref: ref, id: inputId, className: `w-full px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`, rows: 3, ...props }), error && _jsx("p", { className: "mt-1 text-sm text-red-600", children: error })] }));
});
Textarea.displayName = 'Textarea';
export const Select = React.forwardRef(({ label, error, options, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsx("select", { ref: ref, id: inputId, className: `w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`, ...props, children: options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }), error && _jsx("p", { className: "mt-1 text-sm text-red-600", children: error })] }));
});
Select.displayName = 'Select';
