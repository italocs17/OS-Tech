/**
 * OS.Tech - Pagina Dashboard
 * Visao geral com cards de indicadores e lista de OS recentes.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/page-header';
import { StatusBadge } from '../../components/shared/status-badge';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { formatDate } from '../../lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
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

  const { data: emailPending } = useQuery({
    queryKey: ['email-pending-dashboard'],
    queryFn: () => window.osTech.email.countPending() as Promise<number>,
  });

  const { data: emailSolicitacoes } = useQuery({
    queryKey: ['email-solicitacoes-dashboard'],
    queryFn: () => window.osTech.email.listByStatus('AGUARDANDO_ATENDIMENTO') as Promise<any[]>,
  });

  if (loadingOS || loadingStats) {
    return <LoadingSpinner />;
  }

  const osList = Array.isArray(osRecentes) ? osRecentes : [];
  const emailList = Array.isArray(emailSolicitacoes) ? emailSolicitacoes : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visao geral do sistema" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Clientes" value={stats?.clientes ?? 0} icon="👥" to="/clients" onClick={() => navigate('/clients')} />
        <StatCard
          title="Equipamentos"
          value={stats?.equipamentos ?? 0}
          icon="🖥️"
          to="/equipment"
          onClick={() => navigate('/equipment')}
        />
        <StatCard title="OS Abertas" value={stats?.osAbertas ?? 0} icon="📋" to="/os" onClick={() => navigate('/os')} />
        <StatCard
          title="Chamados Pendentes"
          value={emailPending ?? 0}
          icon="💬"
          to="/email-inbox"
          onClick={() => navigate('/email-inbox')}
        />
        <StatCard title="Total de OS" value={stats?.osTotal ?? 0} icon="📊" to="/os" onClick={() => navigate('/os')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Ordens de Servico Recentes</h2>
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
                <button
                  key={os.id}
                  onClick={() => navigate(`/os/${os.id}`)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent"
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
                </button>
              )
            )}
            {osList.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma OS cadastrada
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Chamados por E-mail</h2>
          </div>
          <div className="divide-y">
            {emailList.slice(0, 5).map(
              (email: {
                id: number;
                emailRemetente: string;
                assunto: string;
                dataRecebimento: string | Date;
                cliente?: { nome: string };
              }) => (
                <button
                  key={email.id}
                  onClick={() => navigate('/email-inbox')}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{email.assunto}</p>
                    <p className="text-sm text-muted-foreground">
                      {email.emailRemetente}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Aguardando
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(email.dataRecebimento)}
                    </p>
                  </div>
                </button>
              )
            )}
            {emailList.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum chamado pendente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  to,
  onClick,
}: {
  title: string;
  value: number;
  icon: string;
  to?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </button>
  );
}
