import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { APP_VERSION } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { ChangePasswordModal } from '../shared/change-password-modal';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/clients', label: 'Clientes', icon: '👥' },
  { to: '/equipment', label: 'Equipamentos', icon: '🖥️' },
  { to: '/os', label: 'Ordens de Serviço', icon: '📋' },
  { to: '/catalog', label: 'Catálogo', icon: '📦' },
  { to: '/users', label: 'Usuários', icon: '🔐' },
  { to: '/reports', label: 'Relatórios', icon: '📈' },
  { to: '/backup', label: 'Backup', icon: '💾' },
  { to: '/email-inbox', label: 'Chamados', icon: '💬' },
  { to: '/logs', label: 'Auditoria', icon: '📝' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [passwordModal, setPasswordModal] = useState(false);

  const { data: emailPendingCount } = useQuery({
    queryKey: ['email-pending-sidebar'],
    queryFn: () => window.osTech.email.countPending() as Promise<number>,
    refetchInterval: 60000,
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-2xl">🔧</span>
        <h1 className="text-lg font-bold">OS.Tech</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/email-inbox' && emailPendingCount && emailPendingCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                {emailPendingCount > 99 ? '99+' : emailPendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          {user?.nome} ({user?.perfil})
        </p>
        <button
          onClick={() => setPasswordModal(true)}
          className="w-full rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Alterar Senha
        </button>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          Sair
        </button>
        <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
      </div>
      {user && (
        <ChangePasswordModal
          userId={user.id}
          open={passwordModal}
          onClose={() => setPasswordModal(false)}
        />
      )}
    </aside>
  );
}
