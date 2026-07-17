import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '../../../components/layout/page-header';
import { StatusBadge } from '../../../components/shared/status-badge';
import { LoadingSpinner } from '../../../components/shared/loading-spinner';
import { Modal } from '../../../components/shared/modal';
import { FormField } from '../../../components/shared/form-field';
import { CurrencyInput } from '../../../components/shared/currency-input';
import { formatDate, formatDateTime, formatCurrency, formatCPF_CNPJ, formatPhone } from '../../../lib/utils';
import { STATUS_OS } from '../../../lib/constants';
import { EquipmentForm } from '../../../components/forms/equipment-form';
import type {
  OrdemServico, EventoOS, ItemOS, TipoItem,
  TipoDesconto, FormaPagamento, TipoAtendimento, InventarioHardware,
} from '@shared/types/entities.types';

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'PIX', label: 'Pix' },
  { value: 'ESPECIE', label: 'Espécie' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO_A_VISTA', label: 'Crédito à vista' },
  { value: 'CREDITO_PARCELADO', label: 'Crédito Parcelado' },
];

const VISIBLE_EVENTS_COUNT = 3;

export function OSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isProprietario, isGestor } = useAuth();
  const osId = Number(id);
  const isRestricted = !isProprietario && !isGestor;

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [eventModal, setEventModal] = useState(false);
  const [eventDesc, setEventDesc] = useState('');
  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    tipoItem: 'SERVICO' as TipoItem,
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
  });

  const [discountModal, setDiscountModal] = useState(false);
  const [discountTipo, setDiscountTipo] = useState<TipoDesconto>('ABSOLUTO');
  const [discountValor, setDiscountValor] = useState(0);
  const [discountError, setDiscountError] = useState('');

  const [paymentModal, setPaymentModal] = useState(false);

  const [hardwareCollapsed, setHardwareCollapsed] = useState(true);
  const [hardwareModal, setHardwareModal] = useState(false);
  const [hardwareText, setHardwareText] = useState('');
  const [hardwareError, setHardwareError] = useState('');

  const [showAllEvents, setShowAllEvents] = useState(false);

  const [equipmentSelectModal, setEquipmentSelectModal] = useState(false);
  const [showNewEquipmentForm, setShowNewEquipmentForm] = useState(false);

  const [actionError, setActionError] = useState('');

  const { data: os, isLoading } = useQuery({
    queryKey: ['os', osId],
    queryFn: () => window.osTech.os.get(osId),
    enabled: !!osId,
  });

  const { data: eventos } = useQuery({
    queryKey: ['os-eventos', osId],
    queryFn: () => window.osTech.os.getEventos(osId),
    enabled: !!osId,
  });

  const { data: itens } = useQuery({
    queryKey: ['os-itens', osId],
    queryFn: () => window.osTech.os.getItens(osId),
    enabled: !!osId,
  });

  const { data: total } = useQuery({
    queryKey: ['os-total', osId],
    queryFn: () => window.osTech.os.calcularTotal(osId),
    enabled: !!osId,
  });

  const { data: inventario } = useQuery({
    queryKey: ['os-inventario', osId],
    queryFn: () => window.osTech.inventory.get(osId),
    enabled: !!osId,
  });

  const osData = os as OrdemServico | undefined;
  const eventosList = Array.isArray(eventos) ? (eventos as EventoOS[]) : [];
  const itensList = Array.isArray(itens) ? (itens as ItemOS[]) : [];

  const { data: hardwareListRaw = [] } = useQuery({
    queryKey: ['os-hardware', osId],
    queryFn: () => window.osTech.inventory.listByOs(osId),
    enabled: !!osId,
  });
  const hardwareList = hardwareListRaw as any[];

  const clienteId = (osData as any)?.clienteId ?? 0;
  const { data: clientEquipments = [] } = useQuery({
    queryKey: ['equipment-by-client', clienteId],
    queryFn: () => window.osTech.equipment.listByClient(clienteId),
    enabled: clienteId > 0 && equipmentSelectModal,
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      window.osTech.os.changeStatus(osId, selectedStatus, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', osId] });
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
      setStatusModal(false);
      setActionError('');
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const eventMutation = useMutation({
    mutationFn: () =>
      window.osTech.os.addEvent({ osId, usuarioId: user!.id, descricao: eventDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-eventos', osId] });
      setEventModal(false);
      setEventDesc('');
      setActionError('');
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => window.osTech.os.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-itens', osId] });
      queryClient.invalidateQueries({ queryKey: ['os-total', osId] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      window.osTech.os.addItem({
        osId,
        tipoItem: itemForm.tipoItem,
        descricao: itemForm.descricao,
        quantidade: itemForm.quantidade,
        valorUnitario: itemForm.valorUnitario,
        valorTotal: itemForm.quantidade * itemForm.valorUnitario,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-itens', osId] });
      queryClient.invalidateQueries({ queryKey: ['os-total', osId] });
      setItemModal(false);
      setItemForm({ tipoItem: 'SERVICO', descricao: '', quantidade: 1, valorUnitario: 0 });
      setActionError('');
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const discountMutation = useMutation({
    mutationFn: (data: { desconto?: number | null; descontoTipo?: string }) =>
      window.osTech.os.update(osId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', osId] });
      queryClient.invalidateQueries({ queryKey: ['os-total', osId] });
      setDiscountModal(false);
      setDiscountError('');
    },
    onError: (err: Error) => setDiscountError(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: (formaPagamento: FormaPagamento | null) =>
      window.osTech.os.update(osId, { formaPagamento }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', osId] });
      setPaymentModal(false);
    },
  });

  const equipmentMutation = useMutation({
    mutationFn: (equipamentoId: number) =>
      window.osTech.os.update(osId, { equipamentoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', osId] });
      setEquipmentSelectModal(false);
      setShowNewEquipmentForm(false);
    },
  });

  const hardwareMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      window.osTech.inventory.saveManual(osId, data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-inventario', osId] });
      queryClient.invalidateQueries({ queryKey: ['os-hardware', osId] });
      setHardwareModal(false);
      setHardwareError('');
    },
    onError: (err: Error) => setHardwareError(err.message),
  });

  const handleOpenDiscount = () => {
    setDiscountTipo(osData?.descontoTipo || 'ABSOLUTO');
    setDiscountValor(osData?.desconto ?? 0);
    setDiscountError('');
    setDiscountModal(true);
  };

  const handleRemoveDiscount = () => {
    discountMutation.mutate({ desconto: 0, descontoTipo: undefined });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!osData) return <p className="p-6 text-muted-foreground">OS não encontrada</p>;

  const isTerminal = ['ENTREGUE', 'CANCELADA'].includes(osData.status);
  const isItemBlocked = ['CONCLUIDA', 'ENTREGUE', 'CANCELADA'].includes(osData.status);
  const isDiscountBlocked = ['ENTREGUE', 'CANCELADA'].includes(osData.status);
  const canConcluir = selectedStatus !== 'CONCLUIDA' || itensList.length > 0;
  const hasDesconto = osData.desconto != null && osData.desconto > 0;

  const sortedEventos = [...eventosList].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  );
  const visibleEventos = showAllEvents ? sortedEventos : sortedEventos.slice(0, VISIBLE_EVENTS_COUNT);

  const pagamentoLabel = FORMAS_PAGAMENTO.find((f) => f.value === osData.formaPagamento)?.label ?? '-';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`OS ${osData.numeroOS}`}
        description={
          <div className="flex items-center gap-2">
            <StatusBadge status={osData.status} />
            <span className="text-muted-foreground">
              Aberta em {formatDate(osData.dataEntrada)}
            </span>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/os')}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Voltar
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          <InfoCard title="Informações da OS">
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="ml-1 font-medium">{(osData as any).cliente?.nome ?? '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF/CNPJ:</span>
                  <span className="ml-1 font-medium">{(osData as any).cliente?.cpfCnpj ? formatCPF_CNPJ((osData as any).cliente.cpfCnpj) : '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fone:</span>
                  <span className="ml-1 font-medium">{(osData as any).cliente?.telefone ? formatPhone((osData as any).cliente.telefone) : '-'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Endereço:</span>
                <span className="ml-1 font-medium">{(osData as any).cliente?.endereco ?? '-'}</span>
              </div>
              {(osData as any).contato && (
                <div className="rounded-lg border bg-muted/50 p-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <span className="text-muted-foreground">Contato:</span>
                      <span className="ml-1 font-medium">{(osData as any).contato.nome}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <span className="ml-1 font-medium">{(osData as any).contato.email}</span>
                    </div>
                    {(osData as any).contato.telefone && (
                      <div>
                        <span className="text-muted-foreground">Fone:</span>
                        <span className="ml-1 font-medium">{(osData as any).contato.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!((osData as any).contato) && (osData as any).emailSolicitacao?.[0]?.contato && (
                <div className="rounded-lg border bg-muted/50 p-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <span className="text-muted-foreground">Contato:</span>
                      <span className="ml-1 font-medium">{(osData as any).emailSolicitacao[0].contato.nome}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <span className="ml-1 font-medium">{(osData as any).emailSolicitacao[0].contato.email}</span>
                    </div>
                    {(osData as any).emailSolicitacao[0].contato.telefone && (
                      <div>
                        <span className="text-muted-foreground">Fone:</span>
                        <span className="ml-1 font-medium">{(osData as any).emailSolicitacao[0].contato.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Atendimento:</span>
                  <span className="ml-1 font-medium">
                    {osData.tipoAtendimento === 'INTERNO' ? 'Interno (Bancada / Remoto)' : 'Externo (Visita Técnica)'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Equipamento:</span>
                  <span className="ml-1 font-medium">
                    {(osData as any).equipamento
                      ? `${(osData as any).equipamento?.marca ?? ''} ${(osData as any).equipamento?.modelo ?? ''}`
                      : 'ND - Não vinculado'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Etiqueta:</span>
                  <span className="ml-1 font-medium">{(osData as any).equipamento?.etiqueta ?? 'ND'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Previsão:</span>
                  <span className="ml-1 font-medium">{osData.dataPrevisao ? formatDate(osData.dataPrevisao) : '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conclusão:</span>
                  <span className="ml-1 font-medium">{osData.dataConclusao ? formatDate(osData.dataConclusao) : '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pagamento:</span>
                  <span className="ml-1 font-medium">{pagamentoLabel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="ml-1 font-medium">
                    {hasDesconto ? (
                      osData.descontoTipo === 'PERCENTUAL'
                        ? `${osData.desconto}%`
                        : formatCurrency(osData.desconto ?? 0)
                    ) : '-'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Observações:</span>
                <p className="mt-0.5 font-medium whitespace-pre-wrap">{osData.observacoes ?? '-'}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Hardware">
            <div className="space-y-3">
              <button
                onClick={() => setHardwareCollapsed(!hardwareCollapsed)}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
              >
                {hardwareCollapsed ? '▶' : '▼'} {hardwareList.length} registro(s) de hardware
                {hardwareList.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({formatDate(hardwareList[hardwareList.length - 1].dataCaptura)})
                  </span>
                )}
              </button>

              {!hardwareCollapsed && (
                <div className="space-y-3">
                  {hardwareList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum hardware registrado</p>
                  ) : (
                    <div className="space-y-3">
                      {[...hardwareList].reverse().map((h: any) => {
                        const hwData = h.jsonCompleto as InventarioHardware;
                        return (
                          <div key={h.id} className="border-l-2 border-primary pl-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={`rounded px-1 py-0.5 font-medium ${h.tipo === 'CAPTURA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {h.tipo === 'CAPTURA' ? 'Captura' : 'Manual'}
                              </span>
                              <span>{formatDateTime(h.dataCaptura)}</span>
                            </div>
                            {hwData?.descricao_livre && (
                              <p className="mt-1 text-sm whitespace-pre-wrap">{hwData.descricao_livre}</p>
                            )}
                            {hwData && !hwData.descricao_livre && (
                              <pre className="mt-1 text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                                {JSON.stringify(hwData, null, 2)}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Histórico de Eventos">
            {eventosList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
            ) : (
              <div className="space-y-3">
                {visibleEventos.map((evento) => (
                  <div key={evento.id} className="border-l-2 border-primary pl-3">
                    <p className="break-words text-sm">{evento.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(evento.dataHora)} - {(evento as any).usuario?.nome ?? 'Usuário'}
                    </p>
                  </div>
                ))}
                {sortedEventos.length > VISIBLE_EVENTS_COUNT && !showAllEvents && (
                  <button
                    onClick={() => setShowAllEvents(true)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver mais ({sortedEventos.length - VISIBLE_EVENTS_COUNT} eventos anteriores)
                  </button>
                )}
                {showAllEvents && sortedEventos.length > VISIBLE_EVENTS_COUNT && (
                  <button
                    onClick={() => setShowAllEvents(false)}
                    className="text-sm font-medium text-muted-foreground hover:underline"
                  >
                    Mostrar menos
                  </button>
                )}
              </div>
            )}
          </InfoCard>

          <InfoCard title="Peças e Serviços">
            {itensList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Descrição</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Qtd</th>
                    <th className="pb-2 font-medium">Valor Unit.</th>
                    <th className="pb-2 font-medium">Total</th>
                    {!isItemBlocked && <th className="pb-2 font-medium" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itensList.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">{item.descricao}</td>
                      <td className="py-2">{item.tipoItem === 'SERVICO' ? 'Serviço' : 'Peça'}</td>
                      <td className="py-2">{item.quantidade}</td>
                      <td className="py-2">{formatCurrency(item.valorUnitario)}</td>
                      <td className="py-2 font-medium">{formatCurrency(item.valorTotal)}</td>
                      {!isItemBlocked && (
                        <td className="py-2">
                          <button
                            onClick={() => removeItemMutation.mutate(item.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Remover
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={4} className="pt-2 text-right">Subtotal:</td>
                    <td className="pt-2">
                      {formatCurrency(itensList.reduce((s, i) => s + i.valorTotal, 0))}
                    </td>
                    <td />
                  </tr>
                  {hasDesconto && (
                    <tr className="text-destructive">
                      <td colSpan={4} className="pt-1 text-right text-xs">Desconto:</td>
                      <td className="pt-1 text-xs">
                        {osData.descontoTipo === 'PERCENTUAL'
                          ? `-${osData.desconto}%`
                          : `-${formatCurrency(osData.desconto ?? 0)}`}
                      </td>
                      <td />
                    </tr>
                  )}
                  <tr className="font-bold">
                    <td colSpan={4} className="pt-2 text-right">Total:</td>
                    <td className="pt-2">{formatCurrency(Number(total ?? 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </InfoCard>
        </div>

        <div className="space-y-4">
          <InfoCard title="Ações">
            {actionError && (
              <p className="mb-2 text-xs text-destructive">{actionError}</p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedStatus('');
                  setActionError('');
                  setStatusModal(true);
                }}
                disabled={isTerminal}
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Alterar Status
              </button>

              <button
                onClick={() => {
                  setEventDesc('');
                  setActionError('');
                  setEventModal(true);
                }}
                disabled={isTerminal}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Novo Andamento
              </button>

              <button
                onClick={() => {
                  setItemForm({ tipoItem: 'SERVICO', descricao: '', quantidade: 1, valorUnitario: 0 });
                  setActionError('');
                  setItemModal(true);
                }}
                disabled={isItemBlocked}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Adicionar Peças/Serviços
              </button>

              <button
                onClick={() => {
                  setShowNewEquipmentForm(false);
                  setEquipmentSelectModal(true);
                }}
                disabled={isTerminal}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Selecionar Equipamento
              </button>

              <button
                onClick={() => {
                  setHardwareText('');
                  setHardwareError('');
                  setHardwareModal(true);
                }}
                disabled={isTerminal}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Registrar Hardware
              </button>

              <button
                onClick={() => setPaymentModal(true)}
                disabled={isTerminal}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Pagamento
              </button>

              <button
                onClick={handleOpenDiscount}
                disabled={isDiscountBlocked || isRestricted}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {hasDesconto ? 'Editar Desconto' : 'Desconto'}
              </button>
              {hasDesconto && !isDiscountBlocked && !isRestricted && (
                <button
                  onClick={handleRemoveDiscount}
                  className="w-full rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  Remover Desconto
                </button>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Documentos">
            <div className="space-y-2">
              <PdfButton onClick={async () => { try { await window.osTech.report.generate('os', osId); } catch (e: any) { setActionError(e?.message || 'Erro ao gerar PDF'); } }} label="OS PDF" />
              <PdfButton onClick={async () => { try { await window.osTech.report.generate('laudo', osId); } catch (e: any) { setActionError(e?.message || 'Erro ao gerar PDF'); } }} label="Laudo Técnico" />
              <PdfButton onClick={async () => { try { await window.osTech.report.generate('inventario', osId); } catch (e: any) { setActionError(e?.message || 'Erro ao gerar PDF'); } }} label="Inventário" />
              <PdfButton onClick={async () => { try { await window.osTech.report.generate('recibo', osId); } catch (e: any) { setActionError(e?.message || 'Erro ao gerar PDF'); } }} label="Recibo" />
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Status Modal */}
      <Modal open={statusModal} title="Alterar Status" onClose={() => setStatusModal(false)}>
        <div className="space-y-4">
          <FormField label="Novo Status">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione...</option>
              {STATUS_OS.map((s) => (
                <option key={s.value} value={s.value} disabled={s.value === osData.status}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>
          {selectedStatus === 'CONCLUIDA' && itensList.length === 0 && (
            <p className="text-sm text-destructive">Adicione ao menos uma Peça ou Serviço antes de concluir a OS.</p>
          )}
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => statusMutation.mutate()}
              disabled={!selectedStatus || !canConcluir || statusMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {statusMutation.isPending ? 'Alterando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal open={itemModal} title="Adicionar Peça/Serviço" onClose={() => setItemModal(false)} size="sm">
        <div className="space-y-4">
          <FormField label="Tipo">
            <select
              value={itemForm.tipoItem}
              onChange={(e) => setItemForm({ ...itemForm, tipoItem: e.target.value as TipoItem })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="SERVICO">Serviço</option>
              <option value="PECA">Peça</option>
            </select>
          </FormField>

          <FormField label="Descrição">
            <input
              type="text"
              value={itemForm.descricao}
              onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantidade">
              <input
                type="number"
                min={1}
                value={itemForm.quantidade}
                onChange={(e) => setItemForm({ ...itemForm, quantidade: Number(e.target.value) || 1 })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>

            <FormField label="Valor Unitário (R$)">
              <CurrencyInput
                value={itemForm.valorUnitario}
                onChange={(val) => setItemForm({ ...itemForm, valorUnitario: val })}
              />
            </FormField>
          </div>

          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(itemForm.quantidade * itemForm.valorUnitario)}
          </p>

          {actionError && <p className="text-sm text-destructive">{actionError}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={() => setItemModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => addItemMutation.mutate()}
              disabled={!itemForm.descricao.trim() || addItemMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {addItemMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Discount Modal */}
      <Modal open={discountModal} title="Desconto" onClose={() => setDiscountModal(false)} size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setDiscountTipo('ABSOLUTO'); setDiscountValor(0); }}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                discountTipo === 'ABSOLUTO'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              }`}
            >
              R$
            </button>
            <button
              type="button"
              onClick={() => { setDiscountTipo('PERCENTUAL'); setDiscountValor(0); }}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                discountTipo === 'PERCENTUAL'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              }`}
            >
              %
            </button>
          </div>

          <FormField label={discountTipo === 'ABSOLUTO' ? 'Valor (R$)' : 'Percentual (%)'}>
            {discountTipo === 'ABSOLUTO' ? (
              <CurrencyInput
                value={discountValor}
                onChange={(val) => setDiscountValor(val)}
              />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={discountValor || ''}
                  onChange={(e) => setDiscountValor(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border bg-background px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            )}
          </FormField>

          {discountValor > 0 && (
            <p className="text-sm text-muted-foreground">
              Subtotal: {formatCurrency(itensList.reduce((s, i) => s + i.valorTotal, 0))}
              {' → '}
              <span className="font-semibold text-destructive">
                Total: {formatCurrency(
                  discountTipo === 'PERCENTUAL'
                    ? itensList.reduce((s, i) => s + i.valorTotal, 0) * (1 - discountValor / 100)
                    : itensList.reduce((s, i) => s + i.valorTotal, 0) - discountValor
                )}
              </span>
            </p>
          )}

          {discountError && <p className="text-sm text-destructive">{discountError}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={() => setDiscountModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => discountMutation.mutate({
                desconto: discountValor || 0,
                descontoTipo: discountValor > 0 ? discountTipo : undefined,
              })}
              disabled={discountMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {discountMutation.isPending ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Event Modal */}
      <Modal open={eventModal} title="Novo Andamento" onClose={() => setEventModal(false)}>
        <div className="space-y-4">
          <FormField label="Descrição do Andamento">
            <textarea
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder="Descreva o andamento..."
            />
          </FormField>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEventModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => eventMutation.mutate()}
              disabled={!eventDesc.trim() || eventMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {eventMutation.isPending ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Hardware Modal */}
      <Modal open={hardwareModal} title="Registrar Hardware" onClose={() => setHardwareModal(false)} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Descreva livremente as configurações de hardware do equipamento:
          </p>
          <textarea
            value={hardwareText}
            onChange={(e) => setHardwareText(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={14}
            placeholder={"Processador: Intel Core i5-10400\nMemória: 16 GB DDR4\nSSD: 480 GB Kingston\nPlaca de Vídeo: GTX 1660\n..."}
          />

          {hardwareError && <p className="text-sm text-destructive">{hardwareError}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={() => setHardwareModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => {
                hardwareMutation.mutate({
                  descricao_livre: hardwareText,
                  data_captura: new Date().toISOString(),
                });
              }}
              disabled={hardwareMutation.isPending || !hardwareText.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {hardwareMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={paymentModal} title="Forma de Pagamento" onClose={() => setPaymentModal(false)} size="sm">
        <div className="space-y-3">
          {FORMAS_PAGAMENTO.map((fp) => (
            <button
              key={fp.value}
              onClick={() => paymentMutation.mutate(fp.value)}
              disabled={isTerminal || isRestricted || paymentMutation.isPending}
              className={`w-full rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${
                osData.formaPagamento === fp.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:bg-accent'
              } disabled:opacity-50`}
            >
              {fp.label}
            </button>
          ))}
          {osData.formaPagamento && !isTerminal && !isRestricted && (
            <button
              onClick={() => paymentMutation.mutate(null)}
              disabled={paymentMutation.isPending}
              className="w-full rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Remover Pagamento
            </button>
          )}
        </div>
      </Modal>

      {/* Equipment Selection Modal */}
      <Modal
        open={equipmentSelectModal}
        title="Selecionar Equipamento"
        onClose={() => { setEquipmentSelectModal(false); setShowNewEquipmentForm(false); }}
        size="lg"
      >
        <div className="space-y-4">
          {!showNewEquipmentForm ? (
            <>
              {(clientEquipments as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {(clientEquipments as any[]).map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => equipmentMutation.mutate(eq.id)}
                      disabled={equipmentMutation.isPending}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                        (osData as any).equipamentoId === eq.id
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-accent'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{eq.marca} {eq.modelo}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({eq.tipo})</span>
                        </div>
                        <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded">
                          {eq.etiqueta}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowNewEquipmentForm(true)}
                className="w-full rounded-lg border border-dashed px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                + Cadastrar Equipamento
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <EquipmentForm
                clientId={clienteId}
                onClose={() => setShowNewEquipmentForm(false)}
                onSuccess={(newEq: any) => {
                  equipmentMutation.mutate(newEq.id);
                  queryClient.invalidateQueries({ queryKey: ['equipment-by-client', clienteId] });
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function PdfButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
    >
      {label}
    </button>
  );
}
