import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { Modal } from '../../components/shared/modal';
import { FormField } from '../../components/shared/form-field';

const OS_STATUS = [
  'AGUARDANDO_ATENDIMENTO',
  'EM_ATENDIMENTO',
  'PAUSADO',
  'CONCLUIDA',
  'CANCELADA',
];

type Modo = 'simplificado' | 'analitico';

function ModoToggle({ value, onChange }: { value: Modo; onChange: (v: Modo) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('simplificado')}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          value === 'simplificado'
            ? 'bg-primary text-primary-foreground'
            : 'border hover:bg-accent'
        }`}
      >
        Simplificado
      </button>
      <button
        type="button"
        onClick={() => onChange('analitico')}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          value === 'analitico'
            ? 'bg-primary text-primary-foreground'
            : 'border hover:bg-accent'
        }`}
      >
        Analítico
      </button>
    </div>
  );
}

export function ReportsPage() {
  const [osModal, setOsModal] = useState(false);
  const [selectedOsId, setSelectedOsId] = useState(0);
  const [financialModal, setFinancialModal] = useState(false);
  const [finForm, setFinForm] = useState({ dataInicio: '', dataFim: '' });
  const [finModo, setFinModo] = useState<Modo>('analitico');
  const [periodModal, setPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState({ dataInicio: '', dataFim: '' });
  const [periodModo, setPeriodModo] = useState<Modo>('analitico');
  const [clientModal, setClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(0);
  const [clientForm, setClientForm] = useState({ dataInicio: '', dataFim: '' });
  const [clientModo, setClientModo] = useState<Modo>('analitico');
  const [equipmentModal, setEquipmentModal] = useState(false);
  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [equipmentData, setEquipmentData] = useState<any>(null);
  const [equipForm, setEquipForm] = useState({ dataInicio: '', dataFim: '' });
  const [equipModo, setEquipModo] = useState<Modo>('analitico');
  const [equipError, setEquipError] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'CONCLUIDA', dataInicio: '', dataFim: '' });
  const [statusModo, setStatusModo] = useState<Modo>('analitico');
  const [servicosModal, setServicosModal] = useState(false);
  const [servicosForm, setServicosForm] = useState({ dataInicio: '', dataFim: '' });
  const [servicosModo, setServicosModo] = useState<Modo>('analitico');
  const [pecasModal, setPecasModal] = useState(false);
  const [pecasForm, setPecasForm] = useState({ dataInicio: '', dataFim: '' });
  const [pecasModo, setPecasModo] = useState<Modo>('analitico');
  const [clientesRecModal, setClientesRecModal] = useState(false);
  const [clientesRecForm, setClientesRecForm] = useState({ dataInicio: '', dataFim: '' });
  const [clientesRecModo, setClientesRecModo] = useState<Modo>('analitico');
  const [reportError, setReportError] = useState('');

  const { data: osList } = useQuery({
    queryKey: ['os-list'],
    queryFn: () => window.osTech.os.list(),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => window.osTech.client.list(),
  });

  const osData = Array.isArray(osList) ? osList : [];
  const clientData = Array.isArray(clients) ? clients : [];

  const handleOsPdf = async (type: string) => {
    try {
      if (selectedOsId > 0) {
        await window.osTech.report.generate(type, selectedOsId);
        setOsModal(false);
        setSelectedOsId(0);
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar PDF');
    }
  };

  const handleFinancialReport = async () => {
    try {
      if (finForm.dataInicio && finForm.dataFim) {
        await window.osTech.report.financial(finForm.dataInicio, finForm.dataFim, finModo);
        setFinancialModal(false);
        setFinForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio financeiro');
    }
  };

  const handlePeriodReport = async () => {
    try {
      if (periodForm.dataInicio && periodForm.dataFim) {
        await window.osTech.report.osByPeriod(periodForm.dataInicio, periodForm.dataFim, periodModo);
        setPeriodModal(false);
        setPeriodForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio por periodo');
    }
  };

  const handleClientReport = async () => {
    try {
      if (selectedClientId > 0) {
        await window.osTech.report.byClient(
          selectedClientId,
          clientForm.dataInicio || undefined,
          clientForm.dataFim || undefined,
          clientModo
        );
        setClientModal(false);
        setSelectedClientId(0);
        setClientForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio por cliente');
    }
  };

  const handleSearchEquipment = async () => {
    try {
      setEquipError('');
      const result = await window.osTech.equipment.getByTag(etiquetaInput.trim().toUpperCase());
      setEquipmentData(result);
    } catch (err: any) {
      setEquipError(err?.message || 'Equipamento nao encontrado');
      setEquipmentData(null);
    }
  };

  const handleEquipmentReport = async () => {
    try {
      if (equipmentData) {
        await window.osTech.report.byEquipment(
          equipmentData.id,
          equipForm.dataInicio || undefined,
          equipForm.dataFim || undefined,
          equipModo
        );
        setEquipmentModal(false);
        setEtiquetaInput('');
        setEquipmentData(null);
        setEquipForm({ dataInicio: '', dataFim: '' });
        setEquipError('');
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar historico do equipamento');
    }
  };

  const handleStatusReport = async () => {
    try {
      if (statusForm.dataInicio && statusForm.dataFim && statusForm.status) {
        await window.osTech.report.osByStatus(
          statusForm.status,
          statusForm.dataInicio,
          statusForm.dataFim,
          statusModo
        );
        setStatusModal(false);
        setStatusForm({ status: 'CONCLUIDA', dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio por status');
    }
  };

  const handleServicosReport = async () => {
    try {
      if (servicosForm.dataInicio && servicosForm.dataFim) {
        await window.osTech.report.servicosRealizados(
          servicosForm.dataInicio,
          servicosForm.dataFim,
          servicosModo
        );
        setServicosModal(false);
        setServicosForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio de servicos');
    }
  };

  const handlePecasReport = async () => {
    try {
      if (pecasForm.dataInicio && pecasForm.dataFim) {
        await window.osTech.report.pecasUtilizadas(
          pecasForm.dataInicio,
          pecasForm.dataFim,
          pecasModo
        );
        setPecasModal(false);
        setPecasForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio de pecas');
    }
  };

  const handleClientesRecReport = async () => {
    try {
      if (clientesRecForm.dataInicio && clientesRecForm.dataFim) {
        await window.osTech.report.clientesRecorrentes(
          clientesRecForm.dataInicio,
          clientesRecForm.dataFim,
          clientesRecModo
        );
        setClientesRecModal(false);
        setClientesRecForm({ dataInicio: '', dataFim: '' });
        setReportError('');
      }
    } catch (err: any) {
      setReportError(err?.message || 'Erro ao gerar relatorio de clientes recorrentes');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatorios"
        description="Gere relatorios operacionais e financeiros"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          icon="📄"
          title="PDF da OS"
          description="Selecione uma OS para gerar PDF (completo, laudo, inventario, recibo)"
          onClick={() => { setSelectedOsId(0); setOsModal(true); }}
        />
        <ReportCard
          icon="📅"
          title="OS por Periodo"
          description="Lista de ordens de servico em um intervalo de datas"
          onClick={() => { setPeriodForm({ dataInicio: '', dataFim: '' }); setPeriodModal(true); }}
        />
        <ReportCard
          icon="👤"
          title="OS por Cliente"
          description="Ordens de servico de um cliente especifico"
          onClick={() => { setSelectedClientId(0); setClientForm({ dataInicio: '', dataFim: '' }); setClientModal(true); }}
        />
        <ReportCard
          icon="🔧"
          title="Historico do Equipamento"
          description="Todas as intervencoes de um equipamento pela etiqueta"
          onClick={() => { setEtiquetaInput(''); setEquipmentData(null); setEquipError(''); setEquipmentModal(true); }}
        />
        <ReportCard
          icon="💰"
          title="Faturamento"
          description="Faturamento por periodo"
          onClick={() => { setFinForm({ dataInicio: '', dataFim: '' }); setFinancialModal(true); }}
        />
        <ReportCard
          icon="🏷️"
          title="OS por Status"
          description="Distribuicao de OS por status"
          onClick={() => { setStatusForm({ status: 'CONCLUIDA', dataInicio: '', dataFim: '' }); setStatusModal(true); }}
        />
        <ReportCard
          icon="🛠️"
          title="Servicos Realizados"
          description="Servicos mais executados"
          onClick={() => { setServicosForm({ dataInicio: '', dataFim: '' }); setServicosModal(true); }}
        />
        <ReportCard
          icon="⚙️"
          title="Pecas Utilizadas"
          description="Pecas mais utilizadas"
          onClick={() => { setPecasForm({ dataInicio: '', dataFim: '' }); setPecasModal(true); }}
        />
        <ReportCard
          icon="🔄"
          title="Clientes Recorrentes"
          description="Clientes com mais OS"
          onClick={() => { setClientesRecForm({ dataInicio: '', dataFim: '' }); setClientesRecModal(true); }}
        />
      </div>

      <Modal open={osModal} title="Gerar PDF da OS" onClose={() => setOsModal(false)} size="lg">
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <FormField label="Selecione a OS">
            <select
              value={selectedOsId}
              onChange={(e) => setSelectedOsId(Number(e.target.value))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={0}>Selecione...</option>
              {(osData as any[]).map((os: any) => (
                <option key={os.id} value={os.id}>
                  OS {os.numeroOS} - {os.cliente?.nome ?? '-'} ({os.status})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOsPdf('os')}
              disabled={!selectedOsId}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              OS Completa
            </button>
            <button
              onClick={() => handleOsPdf('laudo')}
              disabled={!selectedOsId}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Laudo Tecnico
            </button>
            <button
              onClick={() => handleOsPdf('inventario')}
              disabled={!selectedOsId}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Inventario
            </button>
            <button
              onClick={() => handleOsPdf('recibo')}
              disabled={!selectedOsId}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Recibo
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={periodModal} title="OS por Periodo" onClose={() => setPeriodModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={periodForm.dataInicio}
                onChange={(e) => setPeriodForm({ ...periodForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={periodForm.dataFim}
                onChange={(e) => setPeriodForm({ ...periodForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={periodModo} onChange={setPeriodModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setPeriodModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handlePeriodReport}
              disabled={!periodForm.dataInicio || !periodForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={clientModal} title="OS por Cliente" onClose={() => setClientModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <FormField label="Selecione o Cliente">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(Number(e.target.value))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={0}>Selecione...</option>
              {(clientData as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nome} - {c.cpfCnpj}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio (opcional)">
              <input
                type="date"
                value={clientForm.dataInicio}
                onChange={(e) => setClientForm({ ...clientForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim (opcional)">
              <input
                type="date"
                value={clientForm.dataFim}
                onChange={(e) => setClientForm({ ...clientForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={clientModo} onChange={setClientModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setClientModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleClientReport}
              disabled={!selectedClientId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={equipmentModal} title="Historico do Equipamento" onClose={() => setEquipmentModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FormField label="Etiqueta do Equipamento">
                <input
                  type="text"
                  value={etiquetaInput}
                  onChange={(e) => setEtiquetaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchEquipment(); }}
                  placeholder="Ex: ABC12"
                  maxLength={5}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </FormField>
            </div>
            <button
              onClick={handleSearchEquipment}
              disabled={!etiquetaInput.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Buscar
            </button>
          </div>

          {equipError && (
            <p className="text-sm text-destructive">{equipError}</p>
          )}

          {equipmentData && (
            <>
              <div className="rounded-lg border bg-muted p-3 text-sm space-y-1">
                <p><strong>Etiqueta:</strong> {equipmentData.etiqueta}</p>
                <p><strong>Tipo:</strong> {equipmentData.tipo}</p>
                <p><strong>Marca:</strong> {equipmentData.marca}</p>
                <p><strong>Modelo:</strong> {equipmentData.modelo}</p>
                <p><strong>N Serie:</strong> {equipmentData.numeroSerie || '-'}</p>
                <p><strong>Cliente:</strong> {equipmentData.cliente?.nome || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Data Inicio (opcional)">
                  <input
                    type="date"
                    value={equipForm.dataInicio}
                    onChange={(e) => setEquipForm({ ...equipForm, dataInicio: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </FormField>
                <FormField label="Data Fim (opcional)">
                  <input
                    type="date"
                    value={equipForm.dataFim}
                    onChange={(e) => setEquipForm({ ...equipForm, dataFim: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </FormField>
              </div>

              <FormField label="Modo">
                <ModoToggle value={equipModo} onChange={setEquipModo} />
              </FormField>

              <div className="flex justify-end gap-2">
                <button onClick={() => setEquipmentModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
                  Cancelar
                </button>
                <button
                  onClick={handleEquipmentReport}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Gerar Relatorio
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal open={statusModal} title="OS por Status" onClose={() => setStatusModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <FormField label="Status">
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {OS_STATUS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={statusForm.dataInicio}
                onChange={(e) => setStatusForm({ ...statusForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={statusForm.dataFim}
                onChange={(e) => setStatusForm({ ...statusForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={statusModo} onChange={setStatusModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleStatusReport}
              disabled={!statusForm.dataInicio || !statusForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={servicosModal} title="Servicos Realizados" onClose={() => setServicosModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={servicosForm.dataInicio}
                onChange={(e) => setServicosForm({ ...servicosForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={servicosForm.dataFim}
                onChange={(e) => setServicosForm({ ...servicosForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={servicosModo} onChange={setServicosModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setServicosModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleServicosReport}
              disabled={!servicosForm.dataInicio || !servicosForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={pecasModal} title="Pecas Utilizadas" onClose={() => setPecasModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={pecasForm.dataInicio}
                onChange={(e) => setPecasForm({ ...pecasForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={pecasForm.dataFim}
                onChange={(e) => setPecasForm({ ...pecasForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={pecasModo} onChange={setPecasModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setPecasModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handlePecasReport}
              disabled={!pecasForm.dataInicio || !pecasForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={clientesRecModal} title="Clientes Recorrentes" onClose={() => setClientesRecModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={clientesRecForm.dataInicio}
                onChange={(e) => setClientesRecForm({ ...clientesRecForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={clientesRecForm.dataFim}
                onChange={(e) => setClientesRecForm({ ...clientesRecForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={clientesRecModo} onChange={setClientesRecModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setClientesRecModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleClientesRecReport}
              disabled={!clientesRecForm.dataInicio || !clientesRecForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar Relatorio
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={financialModal} title="Relatorio Financeiro" onClose={() => setFinancialModal(false)}>
        <div className="space-y-4">
          {reportError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Inicio">
              <input
                type="date"
                value={finForm.dataInicio}
                onChange={(e) => setFinForm({ ...finForm, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Data Fim">
              <input
                type="date"
                value={finForm.dataFim}
                onChange={(e) => setFinForm({ ...finForm, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
          </div>

          <FormField label="Modo">
            <ModoToggle value={finModo} onChange={setFinModo} />
          </FormField>

          <div className="flex justify-end gap-2">
            <button onClick={() => setFinancialModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleFinancialReport}
              disabled={!finForm.dataInicio || !finForm.dataFim}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Gerar PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
