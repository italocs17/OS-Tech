import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';
import { formatDateTime } from '@/lib/utils';

interface AnexoEmail {
  id: number;
  nomeArquivo: string;
  tamanho: number;
  mimeType: string | null;
}

interface EmailSolicitacaoDetail {
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

interface EmailDetailProps {
  item: EmailSolicitacaoDetail | null;
  open: boolean;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EmailDetail({ item, open, onClose }: EmailDetailProps) {
  const { data: anexos = [] } = useQuery({
    queryKey: ['email-attachments', item?.id],
    queryFn: () => window.osTech.email.listAttachments(item!.id) as Promise<AnexoEmail[]>,
    enabled: open && !!item?.id,
  });

  if (!item) return null;

  return (
    <Modal open={open} title="Detalhes da Solicitação" onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Remetente</label>
            <p className="text-sm">{item.emailRemetente}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Recebido em</label>
            <p className="text-sm">{formatDateTime(item.dataRecebimento)}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Assunto</label>
            <p className="text-sm font-medium">{item.assunto}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <p className="text-sm">{item.status}</p>
          </div>
          {item.cliente && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <p className="text-sm">{item.cliente.nome}</p>
            </div>
          )}
          {item.contato && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contato</label>
              <p className="text-sm">{item.contato.nome} ({item.contato.email})</p>
            </div>
          )}
          {item.os && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">OS Gerada</label>
              <p className="text-sm font-medium">#{item.os.numeroOS}</p>
            </div>
          )}
          {item.dataProcessamento && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Processado em</label>
              <p className="text-sm">{formatDateTime(item.dataProcessamento)}</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Corpo do E-mail</label>
          <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            <pre className="whitespace-pre-wrap text-sm">{item.corpoTexto}</pre>
          </div>
        </div>

        {anexos.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Anexos ({anexos.length})</label>
            <div className="mt-1 space-y-1">
              {anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="text-sm">📎</span>
                  <span className="text-sm font-medium">{anexo.nomeArquivo}</span>
                  <span className="text-xs text-muted-foreground">({formatFileSize(anexo.tamanho)})</span>
                  {anexo.mimeType && (
                    <span className="text-xs text-muted-foreground">{anexo.mimeType}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {item.observacoes && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            <p className="mt-1 text-sm">{item.observacoes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
