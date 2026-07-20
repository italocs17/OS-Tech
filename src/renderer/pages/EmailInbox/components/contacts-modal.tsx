import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';
import { ToggleSwitch } from '../../../components/shared/toggle-switch';

interface Contato {
  id: number;
  clienteId: number;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
}

interface ContactsModalProps {
  clienteId: number;
  clienteNome: string;
  open: boolean;
  onClose: () => void;
}

export function ContactsModal({ clienteId, clienteNome, open, onClose }: ContactsModalProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });
  const [error, setError] = useState('');

  const { data: contatos, isLoading } = useQuery({
    queryKey: ['cliente-contatos', clienteId],
    queryFn: () => window.osTech.email.listContatos(clienteId) as Promise<Contato[]>,
    enabled: open,
  });

  useEffect(() => {
    if (!formOpen) {
      setEditingContato(null);
      setFormData({ nome: '', email: '', telefone: '' });
      setError('');
    }
  }, [formOpen]);

  const createMutation = useMutation({
    mutationFn: (data: { clienteId: number; nome: string; email: string; telefone?: string }) =>
      window.osTech.email.createContato(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setError(err?.message || 'Erro ao criar contato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contato> }) =>
      window.osTech.email.updateContato(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setError(err?.message || 'Erro ao atualizar contato'),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => window.osTech.email.updateContato(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos', clienteId] });
    },
  });

  const handleEdit = (contato: Contato) => {
    setEditingContato(contato);
    setFormData({
      nome: contato.nome,
      email: contato.email,
      telefone: contato.telefone || '',
    });
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingContato(null);
    setFormData({ nome: '', email: '', telefone: '' });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    setError('');
    if (!formData.nome || !formData.email) {
      setError('Nome e email sao obrigatorios');
      return;
    }
    if (editingContato) {
      updateMutation.mutate({
        id: editingContato.id,
        data: {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || undefined,
        },
      });
    } else {
      createMutation.mutate({
        clienteId,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || undefined,
      });
    }
  };

  const items = Array.isArray(contatos) ? contatos : [];

  return (
    <Modal open={open} title={`Contatos - ${clienteNome}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {!formOpen ? (
          <>
            <div className="flex justify-end">
              <button
                onClick={handleNew}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                + Novo Contato
              </button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">E-mail</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Telefone</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((c: Contato) => (
                      <tr key={c.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-sm">{c.nome}</td>
                        <td className="px-4 py-2 text-sm">{c.email}</td>
                        <td className="px-4 py-2 text-sm">{c.telefone || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleEdit(c)}
                            className="mr-2 text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <ToggleSwitch
                            checked={c.ativo}
                            onChange={(ativo) => toggleAtivoMutation.mutate({ id: c.id, ativo })}
                            label={c.ativo ? 'Desativar contato' : 'Ativar contato'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Telefone</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {editingContato ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
