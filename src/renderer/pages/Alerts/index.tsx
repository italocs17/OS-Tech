import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { ToggleSwitch } from '../../components/shared/toggle-switch';
import { cn } from '../../lib/utils';

interface AlertaConfig {
  contratoVencendoDias: number;
  contratoVencendoAtivo: boolean;
  contratoVencidoAtivo: boolean;
}

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  dataRef: Date;
  clienteNome: string;
}

export function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['alerta-config'],
    queryFn: () => window.osTech.alerta.configGet() as Promise<AlertaConfig>,
  });

  const { data: alertas, isLoading: alertasLoading } = useQuery({
    queryKey: ['alertas-list'],
    queryFn: () => window.osTech.alerta.list() as Promise<Alerta[]>,
  });

  const [form, setForm] = useState<AlertaConfig>({
    contratoVencendoDias: 30,
    contratoVencendoAtivo: true,
    contratoVencidoAtivo: true,
  });

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: AlertaConfig) => window.osTech.alerta.configSave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerta-config'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-dashboard'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (configLoading || alertasLoading) return <LoadingSpinner />;

  const alertasList = Array.isArray(alertas) ? alertas : [];
  const vencidos = alertasList.filter((a) => a.tipo === 'CONTRATO_VENCIDO');
  const vencendo = alertasList.filter((a) => a.tipo === 'CONTRATO_VENCENDO');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração de Alertas"
        description="Configure alertas do sistema"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contratos</h2>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Contrato vencendo</p>
                <p className="text-sm text-muted-foreground">Avisa quando o contrato está próximo do vencimento</p>
              </div>
              <ToggleSwitch
                checked={form.contratoVencendoAtivo}
                onChange={(checked) => setForm({ ...form, contratoVencendoAtivo: checked })}
                label="Contrato vencendo ativo"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Dias antes do vencimento:</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.contratoVencendoDias}
                onChange={(e) => setForm({ ...form, contratoVencendoDias: parseInt(e.target.value) || 30 })}
                className="w-20 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Contrato vencido</p>
                <p className="text-sm text-muted-foreground">Alerta quando o contrato já passou da data de término</p>
              </div>
              <ToggleSwitch
                checked={form.contratoVencidoAtivo}
                onChange={(checked) => setForm({ ...form, contratoVencidoAtivo: checked })}
                label="Contrato vencido ativo"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Alertas Ativos ({alertasList.length})</h2>

          {alertasList.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              Nenhum alerta ativo
            </div>
          ) : (
            <div className="space-y-3">
              {vencidos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-600 mb-2">🔴 Vencidos ({vencidos.length})</h3>
                  <div className="space-y-2">
                    {vencidos.map((a) => (
                      <div key={a.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="font-medium text-sm text-red-800">{a.titulo}</p>
                        <p className="text-xs text-red-600">{a.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vencendo.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-amber-600 mb-2">🟡 Vencendo ({vencendo.length})</h3>
                  <div className="space-y-2">
                    {vencendo.map((a) => (
                      <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="font-medium text-sm text-amber-800">{a.titulo}</p>
                        <p className="text-xs text-amber-600">{a.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
