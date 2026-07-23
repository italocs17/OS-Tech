import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '../shared/search-input';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  dataRef: Date;
  clienteNome: string;
}

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: alertas } = useQuery({
    queryKey: ['alertas-count'],
    queryFn: () => window.osTech.alerta.list() as Promise<Alerta[]>,
    refetchInterval: 60000,
  });

  const count = Array.isArray(alertas) ? alertas.length : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <SearchInput placeholder="Buscar..." className="w-80" />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative rounded-full p-2 hover:bg-accent"
            aria-label="Notificações"
          >
            🔔
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">🔔 Alertas ({count})</span>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/alerts'); }}
                  className="text-xs text-primary hover:underline"
                >
                  Configurar
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {count === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum alerta ativo</p>
                ) : (
                  (alertas as Alerta[]).map((a) => (
                    <div key={a.id} className="border-b px-4 py-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'h-2 w-2 rounded-full',
                          a.tipo === 'CONTRATO_VENCIDO' ? 'bg-red-500' : 'bg-amber-500'
                        )} />
                        <span className="text-sm font-medium">{a.titulo}</span>
                      </div>
                      <p className="ml-4 text-xs text-muted-foreground">{a.descricao}</p>
                    </div>
                  ))
                )}
              </div>
              {count > 0 && (
                <div className="border-t px-4 py-2">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/alerts'); }}
                    className="w-full text-center text-xs text-primary hover:underline"
                  >
                    Ver todos os alertas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="text-sm font-medium">{user?.nome ?? 'Usuário'}</span>
        </div>
      </div>
    </header>
  );
}
