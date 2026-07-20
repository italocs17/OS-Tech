import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';

interface ConciliarModalProps {
  solicitacaoId: number;
  open: boolean;
  onClose: () => void;
}

interface EmailSolicitacaoItem {
  id: number;
  emailRemetente: string;
  assunto: string;
  corpoTexto: string;
  status: string;
  osId: number | null;
  cliente?: { id: number; nome: string } | null;
  os?: { id: number; numeroOS: string } | null;
}

export function ConciliarModal({ solicitacaoId, open, onClose }: ConciliarModalProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchNumero, setSearchNumero] = useState('');

  const { data: allSolicitacoes = [] } = useQuery({
    queryKey: ['email-solicitacoes'],
    queryFn: () => window.osTech.email.list() as Promise<EmailSolicitacaoItem[]>,
    enabled: open,
  });

  const conciliarMutation = useMutation({
    mutationFn: (destinoId: number) =>
      window.osTech.email.conciliar(solicitacaoId, destinoId, 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['email-pending'] });
      onClose();
    },
  });

  const origem = allSolicitacoes.find((s) => s.id === solicitacaoId);
  const candidates = allSolicitacoes.filter(
    (s) =>
      s.id !== solicitacaoId &&
      s.osId !== null &&
      (s.status === 'CONVERTIDO' || s.status === 'AGUARDANDO_ATENDIMENTO')
  );

  const filteredCandidates = searchNumero.trim()
    ? candidates.filter((s) =>
        s.os?.numeroOS?.toLowerCase().includes(searchNumero.toLowerCase())
      )
    : candidates;

  const selectedSolicitacao = selectedId
    ? allSolicitacoes.find((s) => s.id === selectedId)
    : null;

  return (
    <Modal open={open} title="Conciliar Chamado" onClose={onClose} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Vincule este chamado a um chamado ja existente. O conteudo sera adicionado como evento na OS principal.
        </p>

        {origem && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Chamado a conciliar:</p>
            <p className="text-sm font-medium">{origem.assunto}</p>
            <p className="text-xs text-muted-foreground">{origem.emailRemetente}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Selecione o chamado principal:</p>
          <input
            type="text"
            placeholder="Buscar por numero da OS..."
            value={searchNumero}
            onChange={(e) => setSearchNumero(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {filteredCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {candidates.length === 0
                ? 'Nenhum chamado disponivel para conciliacao.'
                : 'Nenhum resultado para a busca.'}
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {filteredCandidates.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === s.id
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.assunto}</p>
                      <p className="text-xs text-muted-foreground">{s.emailRemetente}</p>
                      {s.cliente && (
                        <p className="text-xs text-muted-foreground">Cliente: {s.cliente.nome}</p>
                      )}
                    </div>
                    {s.os && (
                      <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                        OS {s.os.numeroOS}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSolicitacao && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Texto original do chamado selecionado:</p>
            <p className="text-xs font-medium">{selectedSolicitacao.assunto}</p>
            <div className="mt-1 max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedSolicitacao.corpoTexto}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={() => selectedId && conciliarMutation.mutate(selectedId)}
            disabled={!selectedId || conciliarMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {conciliarMutation.isPending ? 'Conciliando...' : 'Conciliar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
