import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Usuario, PerfilUsuario } from '@shared/types/entities.types';

interface AuthState {
  user: Usuario | null;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPerfil: (...perfis: PerfilUsuario[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const stored = sessionStorage.getItem('osTech_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (login: string, senha: string) => {
    const result = await window.osTech.user.login(login, senha);
    const usuario = result as Usuario;
    setUser(usuario);
    sessionStorage.setItem('osTech_user', JSON.stringify(usuario));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('osTech_user');
  }, []);

  const hasPerfil = useCallback(
    (...perfis: PerfilUsuario[]) => {
      if (!user) return false;
      return perfis.includes(user.perfil);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, hasPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
