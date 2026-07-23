import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { APP_VERSION } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { ChangePasswordModal } from '../shared/change-password-modal';
import type { PerfilUsuario } from '@shared/types/entities.types';

interface MenuItem {
  to: string;
  label: string;
  icon: string;
  perfis?: PerfilUsuario[];
}

interface MenuSeparator {
  type: 'separator';
}

interface MenuGroup {
  type: 'group';
  label: string;
  icon: string;
  perfis?: PerfilUsuario[];
  children: (MenuItem | MenuSeparator)[];
}

type MenuEntry = MenuItem | MenuGroup;

const menuItems: MenuEntry[] = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/os', label: 'Ordens de Serviço', icon: '📋' },
  { to: '/email-inbox', label: 'Chamados', icon: '💬', perfis: ['PROPRIETARIO', 'GESTOR', 'RECEPCIONISTA'] },
  {
    type: 'group',
    label: 'Cadastro',
    icon: '📁',
    perfis: ['PROPRIETARIO', 'GESTOR', 'RECEPCIONISTA'],
    children: [
      { to: '/equipes', label: 'Equipes', icon: '🏢', perfis: ['PROPRIETARIO', 'GESTOR'] },
      { to: '/users', label: 'Usuários', icon: '🔐', perfis: ['PROPRIETARIO', 'GESTOR'] },
      { type: 'separator' },
      { to: '/clients', label: 'Clientes e Contatos', icon: '👥', perfis: ['PROPRIETARIO', 'GESTOR', 'RECEPCIONISTA'] },
      { to: '/equipment', label: 'Equipamentos', icon: '🖥️', perfis: ['PROPRIETARIO', 'GESTOR', 'RECEPCIONISTA'] },
      { type: 'separator' },
      { to: '/catalog', label: 'Catálogo', icon: '📦', perfis: ['PROPRIETARIO', 'GESTOR', 'RECEPCIONISTA'] },
    ],
  },
  { to: '/reports', label: 'Relatórios', icon: '📈', perfis: ['PROPRIETARIO', 'GESTOR'] },
  { to: '/logs', label: 'Auditoria', icon: '📝', perfis: ['PROPRIETARIO', 'GESTOR'] },
  { to: '/backup', label: 'Backup', icon: '💾', perfis: ['PROPRIETARIO'] },
];

function isGroup(entry: MenuEntry): entry is MenuGroup {
  return 'type' in entry && entry.type === 'group';
}

function isSeparator(entry: MenuItem | MenuSeparator): entry is MenuSeparator {
  return 'type' in entry && entry.type === 'separator';
}

function isMenuItem(entry: MenuItem | MenuSeparator): entry is MenuItem {
  return 'to' in entry;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [passwordModal, setPasswordModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({Cadastro: true});
  const [pulseEmail, setPulseEmail] = useState(false);

  const { data: emailPendingCount } = useQuery({
    queryKey: ['email-pending-sidebar'],
    queryFn: () => window.osTech.email.countPending() as Promise<number>,
    refetchInterval: 60000,
  });

  const handleNewEmails = useCallback((count: unknown) => {
    queryClient.invalidateQueries({ queryKey: ['email-pending-sidebar'] });
    queryClient.invalidateQueries({ queryKey: ['email-pending'] });
    queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
    setPulseEmail(true);
    setTimeout(() => setPulseEmail(false), 5000);
  }, [queryClient]);

  useEffect(() => {
    window.osTech.events.on('email:new-found', handleNewEmails);
    return () => {
      window.osTech.events.off('email:new-found', handleNewEmails);
    };
  }, [handleNewEmails]);

  const isItemVisible = (item: MenuItem) => {
    if (!item.perfis || !user) return true;
    return item.perfis.includes(user.perfil);
  };

  const isGroupVisible = (group: MenuGroup) => {
    if (!group.perfis || !user) return true;
    return group.perfis.includes(user.perfil);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const visibleItems = menuItems.filter((entry) => {
    if (isGroup(entry)) return isGroupVisible(entry);
    return isItemVisible(entry);
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-2xl">🔧</span>
        <h1 className="text-lg font-bold">OS.Tech</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {visibleItems.map((entry) => {
          if (isGroup(entry)) {
            const visibleChildren = entry.children.filter(
              (child) => isSeparator(child) || isItemVisible(child)
            );
            if (visibleChildren.length === 0) return null;
            const isExpanded = expandedGroups[entry.label] ?? false;
            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span>{entry.icon}</span>
                  <span className="flex-1 text-left">{entry.label}</span>
                  <svg
                    className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {visibleChildren.map((child, idx) => {
                      if (isSeparator(child)) {
                        return <hr key={`sep-${idx}`} className="my-1 border-border" />;
                      }
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                          }
                        >
                          <span>{child.icon}</span>
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <span>{entry.icon}</span>
              <span>{entry.label}</span>
              {entry.to === '/email-inbox' && emailPendingCount && emailPendingCount > 0 && (
                <span className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-destructive-foreground",
                  pulseEmail ? "bg-yellow-500 animate-pulse" : "bg-destructive"
                )}>
                  {emailPendingCount > 99 ? '99+' : emailPendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
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
