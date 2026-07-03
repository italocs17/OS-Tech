import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';
import { useAuth } from '@/lib/auth-context';

interface ClientOption {
  id: number;
  nome: string;
  cpf: string;
  contatos?: { id: number; nome: string; email: string }[];
}

interface LinkClientModalProps {
  solicitacaoId: number;
  open: boolean;
  onClose: () => void;
}

export function LinkClientModal({ solicitacaoId, open, onClose }: LinkClientModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedContatoId, setSelectedContatoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => window.osTech.client.list() as Promise<ClientOption[]>,
  });

  const { data: contatos } = useQuery({
    queryKey: ['cliente-contatos', selectedClientId],
    queryFn: () => window.osTech.email.listContatos(selectedClientId!) as Promise<{ id: number; nome: string; email: string }[]>,
    enabled: !!selectedClientId,
  });

  const linkMutation = useMutation({
    mutationFn: (data: { solicitacaoId: number; clienteId: number; contatoId: number; usuarioId: number }) =>
      window.osTech.email.linkClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['email-pending'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message || 'Erro ao vincular cliente');
    },
  });

  const filteredClients = Array.isArray(clients)
    ? clients.filter((c: ClientOption) =>
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cpf.includes(searchQuery)
      )
    : [];

  const handleLink = () => {
    if (!selectedClientId || !selectedContatoId || !user) return;
    setError('');
    linkMutation.mutate({
      solicitacaoId,
      clienteId: selectedClientId,
      contatoId: selectedContatoId,
      usuarioId: user.id,
    });
  };

  return (
    <Modal open={open} title="Vincular Cliente" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Buscar Cliente</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Digite nome ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-40 overflow-y-auto rounded-lg border">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Carregando...</p>
          ) : filteredClients.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          ) : (
            filteredClients.map((client: ClientOption) => (
              <button
                key={client.id}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  selectedClientId === client.id ? 'bg-accent font-medium' : ''
                }`}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setSelectedContatoId(null);
                }}
              >
                {client.nome} — {client.cpf}
              </button>
            ))
          )}
        </div>

        {selectedClientId && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Contato</label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border">
              {!contatos || contatos.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nenhum contato cadastrado para este cliente</p>
              ) : (
                contatos.map((c: { id: number; nome: string; email: string }) => (
                  <button
                    key={c.id}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      selectedContatoId === c.id ? 'bg-accent font-medium' : ''
                    }`}
                    onClick={() => setSelectedContatoId(c.id)}
                  >
                    {c.nome} — {c.email}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

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
            onClick={handleLink}
            disabled={!selectedClientId || !selectedContatoId || linkMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {linkMutation.isPending ? 'Vinculando...' : 'Vincular'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
