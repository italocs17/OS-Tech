/**
 * OS.Tech - Página Dashboard
 * Visão geral com cards de indicadores e lista de OS recentes.
 */

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { StatusBadge } from '../../components/shared/status-badge';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { formatDate } from '../../lib/utils';

export function DashboardPage() {
  const { data: osRecentes, isLoading: loadingOS } = useQuery({
    queryKey: ['os-recentes'],
    queryFn: () => window.osTech.os.list(),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const clientes = await window.osTech.client.list();
      const equipamentos = await window.osTech.equipment.list();
      const os = await window.osTech.os.list();
      return {
        clientes: Array.isArray(clientes) ? clientes.length : 0,
        equipamentos: Array.isArray(equipamentos) ? equipamentos.length : 0,
        osAbertas: Array.isArray(os)
          ? os.filter(
              (o: { status: string }) =>
                !['ENTREGUE', 'CANCELADA'].includes(o.status)
            ).length
          : 0,
        osTotal: Array.isArray(os) ? os.length : 0,
      };
    },
  });

  if (loadingOS || loadingStats) {
    return <LoadingSpinner />;
  }

  const osList = Array.isArray(osRecentes) ? osRecentes : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral do sistema" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clientes" value={stats?.clientes ?? 0} icon="👥" />
        <StatCard
          title="Equipamentos"
          value={stats?.equipamentos ?? 0}
          icon="🖥️"
        />
        <StatCard title="OS Abertas" value={stats?.osAbertas ?? 0} icon="📋" />
        <StatCard title="Total de OS" value={stats?.osTotal ?? 0} icon="📊" />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Ordens de Serviço Recentes</h2>
        </div>
        <div className="divide-y">
          {osList.slice(0, 5).map(
            (os: {
              id: number;
              numeroOS: string;
              status: string;
              dataEntrada: string | Date;
              cliente?: { nome: string };
            }) => (
              <div
                key={os.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium">OS {os.numeroOS}</p>
                  <p className="text-sm text-muted-foreground">
                    {os.cliente?.nome ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={os.status} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(os.dataEntrada)}
                  </p>
                </div>
              </div>
            )
          )}
          {osList.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma OS cadastrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
