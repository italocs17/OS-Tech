import { formatDateTime } from '@/lib/utils';

interface EmailSolicitacaoItem {
  id: number;
  emailRemetente: string;
  assunto: string;
  dataRecebimento: string | Date;
  status: string;
  cliente?: { id: number; nome: string } | null;
  contato?: { id: number; nome: string; email: string } | null;
}

interface EmailCardProps {
  item: EmailSolicitacaoItem;
  onView: (id: number) => void;
  onLinkClient?: (id: number) => void;
  onConvert?: (id: number) => void;
  onReject?: (id: number) => void;
  onConciliar?: (id: number) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NAO_CADASTRADO: { label: 'Não cadastrado', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  AGUARDANDO_ATENDIMENTO: { label: 'Aguardando', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  CONVERTIDO: { label: 'Convertido', color: 'text-green-600 bg-green-50 border-green-200' },
  REJEITADO: { label: 'Rejeitado', color: 'text-red-600 bg-red-50 border-red-200' },
};

export function EmailCard({ item, onView, onLinkClient, onConvert, onReject, onConciliar }: EmailCardProps) {
  const statusInfo = STATUS_MAP[item.status] || { label: item.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };

  return (
    <div
      className="flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent/50"
      onClick={() => onView(item.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.assunto}</p>
          <p className="truncate text-xs text-muted-foreground">{item.emailRemetente}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {formatDateTime(item.dataRecebimento)}
          {item.cliente && ` — ${item.cliente.nome}`}
        </p>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status === 'NAO_CADASTRADO' && onLinkClient && (
            <button
              onClick={() => onLinkClient(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
            >
              Vincular
            </button>
          )}
          {item.status === 'AGUARDANDO_ATENDIMENTO' && onConvert && (
            <button
              onClick={() => onConvert(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Converter
            </button>
          )}
          {(item.status === 'NAO_CADASTRADO' || item.status === 'AGUARDANDO_ATENDIMENTO') && onReject && (
            <button
              onClick={() => onReject(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Rejeitar
            </button>
          )}
          {(item.status === 'NAO_CADASTRADO' || item.status === 'AGUARDANDO_ATENDIMENTO') && onConciliar && (
            <button
              onClick={() => onConciliar(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50"
            >
              Conciliar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
