import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { SearchInput } from '../../components/shared/search-input';
import { ClientForm } from '../../components/forms/client-form';
import { ContactsModal } from '../EmailInbox/components/contacts-modal';
import { formatDate } from '../../lib/utils';
import type { Cliente } from '@shared/types/entities.types';

interface ClienteRow {
  id: number;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  dataCadastro: string | Date;
}

export function ClientsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactsModal, setContactsModal] = useState<{ id: number; nome: string } | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => window.osTech.client.list(),
  });

  const columns: Column<ClienteRow>[] = [
    { key: 'nome', header: 'Nome' },
    { key: 'cpfCnpj', header: 'CPF/CNPJ' },
    { key: 'telefone', header: 'Telefone' },
    { key: 'email', header: 'E-mail' },
    {
      key: 'dataCadastro',
      header: 'Cadastro',
      render: (item) => formatDate(item.dataCadastro),
    },
    {
      key: 'contatos',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setContactsModal({ id: (item as any).id, nome: (item as any).nome });
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          Contatos
        </button>
      ),
    },
  ];

  const data = Array.isArray(clients) ? clients : [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (c: ClienteRow) =>
        c.nome.toLowerCase().includes(q) ||
        c.cpfCnpj.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  const handleNew = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleEdit = (item: ClienteRow) => {
    const full = (clients as Cliente[]).find((c) => c.id === item.id);
    if (full) {
      setEditingClient(full);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${filtered.length} de ${data.length} clientes`}
        actions={
          <button
            onClick={handleNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Novo Cliente
          </button>
        }
      />
      <SearchInput
        placeholder="Buscar por nome ou CPF/CNPJ..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum cliente cadastrado"
        onRowClick={handleEdit}
      />

      <Modal
        open={modalOpen}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <ClientForm client={editingClient ?? undefined} onClose={() => setModalOpen(false)} />
      </Modal>

      {contactsModal && (
        <ContactsModal
          clienteId={contactsModal.id}
          clienteNome={contactsModal.nome}
          open={true}
          onClose={() => setContactsModal(null)}
        />
      )}
    </div>
  );
}
