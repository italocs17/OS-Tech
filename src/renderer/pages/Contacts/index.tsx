import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { Modal } from '../../components/shared/modal';
import { useAuth } from '../../lib/auth-context';

interface ClienteContato {
  id: number;
  clienteId: number;
  nome: string;
  email: string;
  telefone: string | null;
  isPadrao: boolean;
  ativo: boolean;
  cliente?: { id: number; nome: string; cpfCnpj: string };
}

export function ContactsPage() {
  const queryClient = useQueryClient();
  const { isProprietario, isGestor } = useAuth();
  const isRestricted = !isProprietario && !isGestor;
  const [searchTerm, setSearchTerm] = useState('');
  const [editContact, setEditContact] = useState<ClienteContato | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ clienteId: 0, nome: '', email: '', telefone: '' });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => window.osTech.email.listContatos(0) as Promise<ClienteContato[]>,
  });
  const contacts = Array.isArray(contactsData) ? contactsData : [];

  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-contact'],
    queryFn: () => window.osTech.client.list(),
  });
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => window.osTech.email.createContato(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof formData> }) =>
      window.osTech.email.updateContato(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditContact(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => window.osTech.email.deleteContato(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const resetForm = () => {
    setFormData({ clienteId: 0, nome: '', email: '', telefone: '' });
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Contatos" description="Gerenciar contatos de clientes" />

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        {!isRestricted && (
          <button
            onClick={() => {
              resetForm();
              setEditContact(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Novo Contato
          </button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Padrão</th>
              {!isRestricted && <th className="px-4 py-3 font-medium" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredContacts.map((c) => (
              <tr key={c.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">{c.nome}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.telefone || '-'}</td>
                <td className="px-4 py-3">{c.cliente?.nome || '-'}</td>
                <td className="px-4 py-3">{c.isPadrao ? '✓' : ''}</td>
                {!isRestricted && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditContact(c);
                          setFormData({
                            clienteId: c.clienteId,
                            nome: c.nome,
                            email: c.email,
                            telefone: c.telefone || '',
                          });
                          setShowForm(true);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Remover este contato?')) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredContacts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum contato encontrado</p>
        )}
      </div>

      {(showForm || editContact) && (
        <Modal
          open={true}
          title={editContact ? 'Editar Contato' : 'Novo Contato'}
          onClose={() => {
            setShowForm(false);
            setEditContact(null);
            resetForm();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Cliente</label>
              <select
                value={formData.clienteId}
                onChange={(e) => setFormData({ ...formData, clienteId: Number(e.target.value) })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                disabled={!!editContact}
              >
                <option value={0}>Selecione...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} - {c.cpfCnpj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditContact(null);
                  resetForm();
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editContact) {
                    updateMutation.mutate({ id: editContact.id, data: formData });
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                disabled={formData.clienteId === 0 || !formData.nome || !formData.email}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {editContact ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
