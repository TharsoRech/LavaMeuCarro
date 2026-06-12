import { jsx as _jsx } from "react/jsx-runtime";
const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    gray: 'bg-gray-100 text-gray-800',
};
export const Badge = ({ variant = 'default', children, className = '' }) => {
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`, children: children }));
};
export const getStatusBadge = (status) => {
    const statusMap = {
        Pendente: { variant: 'warning', label: 'Pendente' },
        Confirmado: { variant: 'info', label: 'Confirmado' },
        Cancelado: { variant: 'danger', label: 'Cancelado' },
        Finalizado: { variant: 'success', label: 'Finalizado' },
        NoShow: { variant: 'gray', label: 'No-Show' },
        ACaminho: { variant: 'info', label: 'A Caminho' },
        EmExecucao: { variant: 'info', label: 'Em Execução' },
        Pronto: { variant: 'success', label: 'Pronto' },
    };
    return statusMap[status] || { variant: 'gray', label: status };
};
