import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';
import { ClientForm } from '../../../components/forms/client-form';
import { useAuth } from '@/lib/auth-context';

interface ClientOption {
  id: number;
  nome: string;
  cpfCnpj: string;
  contatos?: { id: number; nome: string; email: string }[];
}

interface LinkClientModalProps {
  solicitacaoId: number;
  emailRemetente: string;
  open: boolean;
  onClose: () => void;
}

export function LinkClientModal({ solicitacaoId, emailRemetente, open, onClose }: LinkClientModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedContatoId, setSelectedContatoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedContatoEmail, setSelectedContatoEmail] = useState('');

  const emailMatch = selectedContatoEmail
    ? selectedContatoEmail.toLowerCase() === emailRemetente.toLowerCase()
    : true;

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
        c.cpfCnpj.includes(searchQuery)
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

  const handleNewClientSuccess = (cliente: any) => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setShowNewClientForm(false);
    setSelectedClientId(cliente.id);
  };

  if (showNewClientForm) {
    return (
      <Modal open={open} title="Novo Cliente" onClose={onClose} size="lg">
        <ClientForm
          onClose={() => setShowNewClientForm(false)}
          onSuccess={handleNewClientSuccess}
          showContatos={true}
        />
      </Modal>
    );
  }

  return (
    <Modal open={open} title="Vincular Cliente" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar Cliente</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Digite nome ou CPF/CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowNewClientForm(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + Novo Cliente
            </button>
          </div>
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
                {client.nome} — {client.cpfCnpj}
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
                    onClick={() => {
                      setSelectedContatoId(c.id);
                      setSelectedContatoEmail(c.email);
                    }}
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

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-xs font-medium text-blue-700">E-mail do remetente: <strong>{emailRemetente}</strong></p>
        </div>

        {selectedContatoId && !emailMatch && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-700">
              O e-mail do contato selecionado ({selectedContatoEmail}) nao corresponde ao e-mail do remetente.
            </p>
          </div>
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
            disabled={!selectedClientId || !selectedContatoId || !emailMatch || linkMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {linkMutation.isPending ? 'Vinculando...' : 'Vincular'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
