/**
 * OS.Tech - Input de Busca Reutilizável
 * Campo de pesquisa com ícone de lupa.
 */

import { cn } from '../../lib/utils';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({
  placeholder = 'Buscar...',
  className,
  value,
  onChange,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        🔍
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
