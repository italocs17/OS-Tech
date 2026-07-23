import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { SearchInput } from '../../components/shared/search-input';
import { ClientForm } from '../../components/forms/client-form';
import { ToggleSwitch } from '../../components/shared/toggle-switch';
import { FormField } from '../../components/shared/form-field';
import { AtivoBadge, ativoRowClass } from '../../components/shared/ativo-badge';
import { formatDate, cn } from '../../lib/utils';
import type { Cliente, Contrato } from '@shared/types/entities.types';

interface ClienteRow {
  id: number;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  dataCadastro: string | Date;
  ativo?: boolean;
}

interface Contato {
  id: number;
  clienteId: number;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
}

type Tab = 'dados' | 'contatos' | 'contratos';

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dados');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => window.osTech.client.listAll(),
  });

  const columns: Column<ClienteRow>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (item) => (
        <>
          {item.nome}
          <AtivoBadge ativo={item.ativo ?? true} />
        </>
      ),
    },
    { key: 'cpfCnpj', header: 'CPF/CNPJ' },
    { key: 'telefone', header: 'Telefone' },
    { key: 'email', header: 'E-mail' },
    {
      key: 'dataCadastro',
      header: 'Cadastro',
      render: (item) => formatDate(item.dataCadastro),
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
    setActiveTab('dados');
    setModalOpen(true);
  };

  const handleEdit = (item: ClienteRow) => {
    const full = (clients as Cliente[]).find((c) => c.id === item.id);
    if (full) {
      setEditingClient(full);
      setActiveTab('dados');
      setModalOpen(true);
    }
  };

  const handleFormSuccess = (cliente: any) => {
    if (!editingClient && cliente?.id) {
      setEditingClient(cliente as Cliente);
    }
    queryClient.invalidateQueries({ queryKey: ['clients-all'] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes e Contatos"
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
        rowClassName={(item) => ativoRowClass(item.ativo ?? true)}
      />

      {editingClient && (
        <Modal
          open={modalOpen}
          title={`Editar Cliente: ${editingClient.nome}`}
          onClose={() => setModalOpen(false)}
          size="lg"
        >
          <TabbedClientDetail
            client={editingClient}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setModalOpen(false)}
            onFormSuccess={handleFormSuccess}
          />
        </Modal>
      )}

      {modalOpen && !editingClient && (
        <Modal
          open={modalOpen}
          title="Novo Cliente"
          onClose={() => setModalOpen(false)}
          size="lg"
        >
          <ClientForm onClose={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
}

function TabbedClientDetail({
  client,
  activeTab,
  onTabChange,
  onClose,
  onFormSuccess,
}: {
  client: Cliente;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
  onFormSuccess: (cliente: any) => void;
}) {
  const queryClient = useQueryClient();

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      window.osTech.client.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-all'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        <TabButton
          label="Dados"
          active={activeTab === 'dados'}
          onClick={() => onTabChange('dados')}
        />
        <TabButton
          label="Contatos"
          active={activeTab === 'contatos'}
          onClick={() => onTabChange('contatos')}
        />
        <TabButton
          label="Contratos"
          active={activeTab === 'contratos'}
          onClick={() => onTabChange('contratos')}
        />
      </div>

      {activeTab === 'dados' && (
        <DadosTab
          client={client}
          onToggleAtivo={(ativo) => toggleAtivoMutation.mutate({ id: client.id, ativo })}
          onFormSuccess={onFormSuccess}
        />
      )}

      {activeTab === 'contatos' && (
        <ContatosTab clienteId={client.id} />
      )}

      {activeTab === 'contratos' && (
        <ContratosTab clienteId={client.id} />
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function DadosTab({
  client,
  onToggleAtivo,
  onFormSuccess,
}: {
  client: Cliente;
  onToggleAtivo: (ativo: boolean) => void;
  onFormSuccess: (cliente: any) => void;
}) {
  const handleSuccess = (cliente: any) => {
    onFormSuccess(cliente);
  };

  return (
    <div className="space-y-4">
      <ClientForm client={client} onClose={() => {}} onSuccess={handleSuccess} showContatos={false} />
      <div className="flex items-center gap-3 border-t pt-4">
        <ToggleSwitch
          checked={client.ativo ?? true}
          onChange={onToggleAtivo}
          label={client.ativo !== false ? 'Desativar cliente' : 'Ativar cliente'}
        />
        <span className="text-sm text-muted-foreground">
          {client.ativo !== false ? 'Cliente ativo' : 'Cliente inativo'}
        </span>
      </div>
    </div>
  );
}

function ContatosTab({ clienteId }: { clienteId: number }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });
  const [error, setError] = useState('');

  const { data: contatos, isLoading } = useQuery({
    queryKey: ['cliente-contatos-all', clienteId],
    queryFn: () => window.osTech.email.listAllContatos(clienteId) as Promise<Contato[]>,
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
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos-all', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setError(err?.message || 'Erro ao criar contato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contato> }) =>
      window.osTech.email.updateContato(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos-all', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setError(err?.message || 'Erro ao atualizar contato'),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      window.osTech.email.updateContato(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contatos-all', clienteId] });
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

  if (formOpen) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
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
                <tr key={c.id} className={cn('hover:bg-muted/50', ativoRowClass(c.ativo))}>
                  <td className="px-4 py-2 text-sm">
                    {c.nome}
                    <AtivoBadge ativo={c.ativo} />
                  </td>
                  <td className="px-4 py-2 text-sm">{c.email}</td>
                  <td className="px-4 py-2 text-sm">{c.telefone || '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleEdit(c)}
                      disabled={!c.ativo}
                      className="mr-2 text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

function ContratosTab({ clienteId }: { clienteId: number }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [form, setForm] = useState({
    numero: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    observacoes: '',
    status: 'ATIVO' as 'ATIVO' | 'SUSPENSO' | 'ENCERRADO',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['cliente-contratos', clienteId],
    queryFn: () => window.osTech.contrato.listByCliente(clienteId),
  });

  useEffect(() => {
    if (!formOpen) {
      setEditingContrato(null);
      setForm({ numero: '', descricao: '', dataInicio: '', dataFim: '', observacoes: '', status: 'ATIVO' });
      setErrors({});
    }
  }, [formOpen]);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      window.osTech.contrato.create({
        clienteId,
        numero: data.numero,
        descricao: data.descricao || undefined,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        observacoes: data.observacoes || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contratos', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setErrors({ form: err?.message || 'Erro ao criar contrato' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      window.osTech.contrato.update(id, {
        numero: data.numero,
        descricao: data.descricao || undefined,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        observacoes: data.observacoes || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contratos', clienteId] });
      setFormOpen(false);
    },
    onError: (err: any) => setErrors({ form: err?.message || 'Erro ao atualizar contrato' }),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      window.osTech.contrato.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contratos', clienteId] });
    },
  });

  const handleEdit = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setForm({
      numero: contrato.numero,
      descricao: contrato.descricao || '',
      dataInicio: new Date(contrato.dataInicio).toISOString().split('T')[0],
      dataFim: new Date(contrato.dataFim).toISOString().split('T')[0],
      observacoes: contrato.observacoes || '',
      status: contrato.status,
    });
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingContrato(null);
    setForm({ numero: '', descricao: '', dataInicio: '', dataFim: '', observacoes: '', status: 'ATIVO' });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!form.dataInicio) newErrors.dataInicio = 'Data de início é obrigatória';
    if (!form.dataFim) newErrors.dataFim = 'Data de fim é obrigatória';
    if (form.dataInicio && form.dataFim && form.dataInicio > form.dataFim) {
      newErrors.dataFim = 'Data de fim deve ser posterior à data de início';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (editingContrato) {
      updateMutation.mutate({ id: editingContrato.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getStatusBadge = (status: string, dataFim: Date) => {
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diasRestantes = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'ENCERRADO') return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Encerrado</span>;
    if (status === 'SUSPENSO') return <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Suspenso</span>;
    if (diasRestantes < 0) return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Vencido</span>;
    if (diasRestantes <= 30) return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Vence em {diasRestantes}d</span>;
    return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Ativo</span>;
  };

  const items = Array.isArray(contratos) ? contratos : [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={handleNew}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Novo Contrato
        </button>
      </div>

      {formOpen && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Número" required error={errors.numero}>
              <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Ex: 001/2025" />
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="ATIVO">Ativo</option>
                <option value="SUSPENSO">Suspenso</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </FormField>
          </div>
          <FormField label="Descrição">
            <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Ex: Contrato de suporte anual" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data Início" required error={errors.dataInicio}>
              <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </FormField>
            <FormField label="Data Fim" required error={errors.dataFim}>
              <input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </FormField>
          </div>
          <FormField label="Observações">
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={3}
              placeholder="Serviços compreendidos, prazos, demais informações..." />
          </FormField>
          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancelar</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingContrato ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado</p>
      ) : (
        <div className="space-y-2">
          {items.map((c: Contrato) => (
            <div key={c.id} className={cn('flex items-center justify-between rounded-lg border p-3', ativoRowClass(c.ativo))}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">#{c.numero}</span>
                  {getStatusBadge(c.status, c.dataFim)}
                  <AtivoBadge ativo={c.ativo} />
                </div>
                {c.descricao && <p className="text-xs text-muted-foreground mt-1">{c.descricao}</p>}
                <p className="text-xs text-muted-foreground">
                  {formatDate(c.dataInicio)} a {formatDate(c.dataFim)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(c)} disabled={!c.ativo}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                  Editar
                </button>
                <ToggleSwitch
                  checked={c.ativo}
                  onChange={(ativo) => toggleAtivoMutation.mutate({ id: c.id, ativo })}
                  label={c.ativo ? 'Desativar contrato' : 'Ativar contrato'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
