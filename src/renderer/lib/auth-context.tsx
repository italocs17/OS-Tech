import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Usuario, PerfilUsuario, Equipe } from '@shared/types/entities.types';

interface AuthState {
  user: Usuario | null;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPerfil: (...perfis: PerfilUsuario[]) => boolean;
  hasAccessToCategoria: (categoriaId: number) => boolean;
  getCategoriasIds: () => number[];
  isProprietario: boolean;
  isGestor: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const stored = sessionStorage.getItem('osTech_user');
    return stored ? JSON.parse(stored) : null;
  });

  const { data: equipesRaw } = useQuery({
    queryKey: ['equipes-by-usuario', user?.id],
    queryFn: () => window.osTech.equipe.getByUsuario(user!.id),
    enabled: !!user && !['PROPRIETARIO', 'GESTOR'].includes(user.perfil),
  });

  const equipeCategorias = useMemo(() => {
    if (!equipesRaw || !Array.isArray(equipesRaw)) return [];
    const catIds = new Set<number>();
    (equipesRaw as any[]).forEach((eu: any) => {
      eu.equipe?.categorias?.forEach((ec: any) => {
        if (ec.categoriaId) catIds.add(ec.categoriaId);
      });
    });
    return Array.from(catIds);
  }, [equipesRaw]);

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

  const isProprietario = user?.perfil === 'PROPRIETARIO';
  const isGestor = user?.perfil === 'GESTOR';
  const isRestricted = !!user && !isProprietario && !isGestor;

  const hasAccessToCategoria = useCallback(
    (categoriaId: number) => {
      if (!user) return false;
      if (isProprietario || isGestor) return true;
      return equipeCategorias.includes(categoriaId);
    },
    [user, isProprietario, isGestor, equipeCategorias]
  );

  const getCategoriasIds = useCallback(() => {
    if (!user) return [];
    if (isProprietario || isGestor) return [];
    return equipeCategorias;
  }, [user, isProprietario, isGestor, equipeCategorias]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPerfil,
        hasAccessToCategoria,
        getCategoriasIds,
        isProprietario,
        isGestor,
      }}
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
