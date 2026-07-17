import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { EmailCard } from './components/email-card';
import { EmailDetail } from './components/email-detail';
import { LinkClientModal } from './components/link-client-modal';
import { ConvertModal } from './components/convert-modal';
import { ConfigModal } from './components/config-modal';
import { ConciliarModal } from './components/conciliar-modal';

type TabType = 'aguardando' | 'nao-cadastrados' | 'convertidos' | 'rejeitados';

interface EmailSolicitacaoItem {
  id: number;
  emailRemetente: string;
  assunto: string;
  corpoTexto: string;
  dataRecebimento: string | Date;
  mensagemId: string;
  status: string;
  clienteId: number | null;
  contatoId: number | null;
  osId: number | null;
  usuarioAprovadorId: number | null;
  dataProcessamento: string | Date | null;
  observacoes: string | null;
  cliente?: { id: number; nome: string } | null;
  contato?: { id: number; nome: string; email: string } | null;
  os?: { id: number; numeroOS: string } | null;
}

export function EmailInboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('aguardando');
  const [selectedItem, setSelectedItem] = useState<EmailSolicitacaoItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertingAssunto, setConvertingAssunto] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [conciliarModalOpen, setConciliarModalOpen] = useState(false);
  const [conciliaringId, setConciliaringId] = useState<number | null>(null);

  const { data: pendingCount } = useQuery({
    queryKey: ['email-pending'],
    queryFn: () => window.osTech.email.countPending() as Promise<number>,
    refetchInterval: 30000,
  });

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ['email-solicitacoes'],
    queryFn: () => window.osTech.email.list() as Promise<EmailSolicitacaoItem[]>,
  });

  const checkMailMutation = useMutation({
    mutationFn: () => window.osTech.email.checkMail(user?.id || 0),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['email-pending'] });
      const msg = `Verificacao concluida: ${result.received} nao lidos, ${result.novas} novos cadastrados`;
      setCheckResult(msg);
      if (result.erros?.length > 0) {
        setCheckResult(msg + `. ${result.erros.length} erro(s)`);
      }
      setTimeout(() => setCheckResult(null), 5000);
    },
    onError: (err: any) => {
      setCheckResult(`Erro: ${err.message}`);
      setTimeout(() => setCheckResult(null), 8000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      window.osTech.email.reject(id, user?.id || 0, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['email-pending'] });
    },
  });

  const items = Array.isArray(solicitacoes) ? solicitacoes : [];

  const filteredItems = useMemo(() => {
    const statusMap: Record<TabType, string> = {
      aguardando: 'AGUARDANDO_ATENDIMENTO',
      'nao-cadastrados': 'NAO_CADASTRADO',
      convertidos: 'CONVERTIDO',
      rejeitados: 'REJEITADO',
    };
    return items.filter((item) => item.status === statusMap[activeTab]);
  }, [items, activeTab]);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'aguardando', label: 'Aguardando', count: items.filter((i) => i.status === 'AGUARDANDO_ATENDIMENTO').length },
    { key: 'nao-cadastrados', label: 'Não cadastrados', count: items.filter((i) => i.status === 'NAO_CADASTRADO').length },
    { key: 'convertidos', label: 'Convertidos', count: items.filter((i) => i.status === 'CONVERTIDO').length },
    { key: 'rejeitados', label: 'Rejeitados', count: items.filter((i) => i.status === 'REJEITADO').length },
  ];

  const handleView = (id: number) => {
    const item = items.find((i) => i.id === id) || null;
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleLinkClient = (id: number) => {
    setLinkingId(id);
    setLinkModalOpen(true);
  };

  const handleConvert = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setConvertingId(id);
      setConvertingAssunto(item.assunto);
      setConvertModalOpen(true);
    }
  };

  const handleReject = (id: number) => {
    if (window.confirm('Rejeitar esta solicitacao?')) {
      rejectMutation.mutate({ id });
    }
  };

  const handleConciliar = (id: number) => {
    setConciliaringId(id);
    setConciliarModalOpen(true);
  };

  const handleConvertSuccess = (osId: number) => {
    navigate(`/os/${osId}`);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chamados por E-mail"
        description={`${pendingCount ?? 0} pendentes`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setConfigModalOpen(true)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Configurar
            </button>
            <button
              onClick={() => checkMailMutation.mutate()}
              disabled={checkMailMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {checkMailMutation.isPending ? 'Verificando...' : 'Verificar E-mails'}
            </button>
          </div>
        }
      />

      {checkResult && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {checkResult}
        </div>
      )}

      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Nenhuma solicitacao encontrada nesta categoria
          </p>
        ) : (
          filteredItems.map((item) => (
            <EmailCard
              key={item.id}
              item={item}
              onView={handleView}
              onLinkClient={handleLinkClient}
              onConvert={handleConvert}
              onReject={handleReject}
              onConciliar={handleConciliar}
            />
          ))
        )}
      </div>

      <EmailDetail
        item={selectedItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {linkingId && (
        <LinkClientModal
          solicitacaoId={linkingId}
          open={linkModalOpen}
          onClose={() => { setLinkModalOpen(false); setLinkingId(null); }}
        />
      )}

      {convertingId && (
        <ConvertModal
          solicitacaoId={convertingId}
          solicitacaoAssunto={convertingAssunto}
          open={convertModalOpen}
          onClose={() => { setConvertModalOpen(false); setConvertingId(null); }}
          onSuccess={handleConvertSuccess}
        />
      )}

      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />

      {conciliaringId && (
        <ConciliarModal
          solicitacaoId={conciliaringId}
          open={conciliarModalOpen}
          onClose={() => { setConciliarModalOpen(false); setConciliaringId(null); }}
        />
      )}
    </div>
  );
}
