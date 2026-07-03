import { SearchInput } from '../shared/search-input';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <SearchInput placeholder="Buscar..." className="w-80" />
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 hover:bg-accent" aria-label="Notificações">
          🔔
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="text-sm font-medium">{user?.nome ?? 'Usuário'}</span>
        </div>
      </div>
    </header>
  );
}
