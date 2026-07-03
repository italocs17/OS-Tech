import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';
import { useAuth } from '@/lib/auth-context';

interface ConvertModalProps {
  solicitacaoId: number;
  solicitacaoAssunto: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (osId: number) => void;
}

export function ConvertModal({ solicitacaoId, solicitacaoAssunto, open, onClose, onSuccess }: ConvertModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState<'INTERNO' | 'EXTERNO'>('INTERNO');
  const [error, setError] = useState('');

  const convertMutation = useMutation({
    mutationFn: (data: { solicitacaoId: number; usuarioId: number; observacoes?: string; tipoAtendimento?: string }) =>
      window.osTech.email.convertToOS(data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['email-pending'] });
      queryClient.invalidateQueries({ queryKey: ['os'] });
      onSuccess(result.id);
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message || 'Erro ao converter');
    },
  });

  const handleConvert = () => {
    if (!user) return;
    setError('');
    convertMutation.mutate({
      solicitacaoId,
      usuarioId: user.id,
      observacoes: observacoes || undefined,
      tipoAtendimento,
    });
  };

  return (
    <Modal open={open} title="Converter em Ordem de Serviço" onClose={onClose} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Uma nova OS será criada a partir da solicitação: <strong>{solicitacaoAssunto}</strong>
        </p>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo de Atendimento</label>
          <div className="mt-1 flex gap-2">
            <button
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tipoAtendimento === 'INTERNO'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-accent'
              }`}
              onClick={() => setTipoAtendimento('INTERNO')}
            >
              Interno
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tipoAtendimento === 'EXTERNO'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-accent'
              }`}
              onClick={() => setTipoAtendimento('EXTERNO')}
            >
              Externo
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Observações adicionais (opcional)
          </label>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            rows={4}
            placeholder="Informacoes adicionais para a OS..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={handleConvert}
            disabled={convertMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {convertMutation.isPending ? 'Convertendo...' : 'Converter em OS'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
