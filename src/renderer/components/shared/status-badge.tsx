/**
 * OS.Tech - Badge de Status
 * Exibe o status da OS com cor correspondente.
 */

import { cn } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_ATENDIMENTO: 'bg-blue-100 text-blue-800',
  EM_ATENDIMENTO: 'bg-yellow-100 text-yellow-800',
  PAUSADO: 'bg-orange-100 text-orange-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  PENDENTE: 'bg-gray-100 text-gray-800',
  RECEBIDO: 'bg-blue-100 text-blue-800',
  ENTREGUE: 'bg-green-100 text-green-800',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        color,
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
