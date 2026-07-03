/**
 * OS.Tech - Layout Principal
 * Estrutura base com sidebar, header e área de conteúdo.
 */

import { Sidebar } from './sidebar';
import { Header } from './header';
import { AppRoutes } from '../../routes';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}
