import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
  gray: 'bg-gray-100 text-gray-800',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const getStatusBadge = (status: string): { variant: BadgeVariant; label: string } => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    Pending: { variant: 'warning', label: 'Pendente' },
    Confirmed: { variant: 'info', label: 'Confirmado' },
    Cancelled: { variant: 'danger', label: 'Cancelado' },
    Completed: { variant: 'success', label: 'Finalizado' },
    NoShow: { variant: 'gray', label: 'No-Show' },
    ACaminho: { variant: 'info', label: 'A Caminho' },
    InProgress: { variant: 'info', label: 'Em Execução' },
    Ready: { variant: 'success', label: 'Pronto' },
  };
  return statusMap[status] || { variant: 'gray', label: status };
};
