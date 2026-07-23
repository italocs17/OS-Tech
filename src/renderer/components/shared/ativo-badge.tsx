/**
 * OS.Tech - Badge de Status Ativo/Inativo
 * Componente reutilizavel para indicar status de ativo/inativo.
 */

interface AtivoBadgeProps {
  ativo: boolean;
  className?: string;
}

export function AtivoBadge({ ativo, className = '' }: AtivoBadgeProps) {
  if (ativo) return null;

  return (
    <span className={`ml-1 inline-block text-xs text-muted-foreground italic ${className}`}>
      (inativo)
    </span>
  );
}

/**
 * Retorna classes CSS para ser aplicada em rows/itens inativos.
 * Uso: <tr className={ativoRowClass(item.ativo)}>
 */
export function ativoRowClass(ativo: boolean): string {
  return ativo ? '' : 'opacity-50';
}
