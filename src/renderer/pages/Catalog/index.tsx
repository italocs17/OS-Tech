import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { FormField } from '../../components/shared/form-field';
import { SearchInput } from '../../components/shared/search-input';
import { CurrencyInput } from '../../components/shared/currency-input';
import { formatCurrency } from '../../lib/utils';
import type { Servico, Peca, CreateServicoDTO, UpdateServicoDTO, CreatePecaDTO, UpdatePecaDTO } from '@shared/types/entities.types';

type Tab = 'servicos' | 'pecas';

interface ServicoRow {
  id: number;
  descricao: string;
  valorPadrao: number;
}

interface PecaRow {
  id: number;
  descricao: string;
  fabricante: string | null;
  valorReferencia: number;
}

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>('servicos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: servicos, isLoading: servicosLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => window.osTech.servico.list(),
  });

  const { data: pecas, isLoading: pecasLoading } = useQuery({
    queryKey: ['pecas'],
    queryFn: () => window.osTech.peca.list(),
  });

  const servicosData = Array.isArray(servicos) ? servicos : [];
  const pecasData = Array.isArray(pecas) ? pecas : [];

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'servico' | 'peca'; id: number }) => {
      if (type === 'servico') return window.osTech.servico.delete(id);
      return window.osTech.peca.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
  });

  const servicoColumns: Column<ServicoRow>[] = [
    { key: 'descricao', header: 'Descricao' },
    {
      key: 'valorPadrao',
      header: 'Valor Padrao',
      render: (item) => formatCurrency(item.valorPadrao),
    },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Excluir este servico?')) {
              deleteMutation.mutate({ type: 'servico', id: item.id });
            }
          }}
          className="text-sm text-destructive hover:underline"
        >
          Excluir
        </button>
      ),
    },
  ];

  const pecaColumns: Column<PecaRow>[] = [
    { key: 'descricao', header: 'Descricao' },
    { key: 'fabricante', header: 'Fabricante' },
    {
      key: 'valorReferencia',
      header: 'Valor Referencia',
      render: (item) => formatCurrency(item.valorReferencia),
    },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Excluir esta peca?')) {
              deleteMutation.mutate({ type: 'peca', id: item.id });
            }
          }}
          className="text-sm text-destructive hover:underline"
        >
          Excluir
        </button>
      ),
    },
  ];

  const filteredServicos = useMemo(() => {
    if (!searchQuery.trim()) return servicosData;
    const q = searchQuery.toLowerCase();
    return servicosData.filter((s: ServicoRow) =>
      s.descricao.toLowerCase().includes(q)
    );
  }, [servicosData, searchQuery]);

  const filteredPecas = useMemo(() => {
    if (!searchQuery.trim()) return pecasData;
    const q = searchQuery.toLowerCase();
    return pecasData.filter((p: PecaRow) =>
      p.descricao.toLowerCase().includes(q) ||
      (p.fabricante && p.fabricante.toLowerCase().includes(q))
    );
  }, [pecasData, searchQuery]);

  const handleNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditServico = (item: ServicoRow) => {
    const full = (servicos as Servico[]).find((s) => s.id === item.id);
    if (full) {
      setEditingItem({ ...full, _type: 'servico' });
      setModalOpen(true);
    }
  };

  const handleEditPeca = (item: PecaRow) => {
    const full = (pecas as Peca[]).find((p) => p.id === item.id);
    if (full) {
      setEditingItem({ ...full, _type: 'peca' });
      setModalOpen(true);
    }
  };

  const isLoading = tab === 'servicos' ? servicosLoading : pecasLoading;
  const totalData = tab === 'servicos' ? servicosData : pecasData;
  const currentData = tab === 'servicos' ? filteredServicos : filteredPecas;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo"
        description={`${currentData.length} de ${totalData.length} registros`}
        actions={
          <button
            onClick={handleNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Novo
          </button>
        }
      />

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('servicos')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'servicos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Servicos
        </button>
        <button
          onClick={() => setTab('pecas')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'pecas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pecas
        </button>
      </div>

      <SearchInput
        placeholder={`Buscar ${tab === 'servicos' ? 'servico' : 'peca'}...`}
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : tab === 'servicos' ? (
        <DataTable
          columns={servicoColumns as any}
          data={filteredServicos}
          keyExtractor={(item: ServicoRow) => item.id}
          emptyMessage="Nenhum servico cadastrado"
          onRowClick={handleEditServico}
        />
      ) : (
        <DataTable
          columns={pecaColumns as any}
          data={filteredPecas}
          keyExtractor={(item: PecaRow) => item.id}
          emptyMessage="Nenhuma peca cadastrada"
          onRowClick={handleEditPeca}
        />
      )}

      <CatalogFormModal
        tab={tab}
        open={modalOpen}
        editingItem={editingItem}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['servicos'] });
          queryClient.invalidateQueries({ queryKey: ['pecas'] });
        }}
      />
    </div>
  );
}

function CatalogFormModal({
  tab,
  open,
  editingItem,
  onClose,
  onSuccess,
}: {
  tab: Tab;
  open: boolean;
  editingItem: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!editingItem;
  const isServico = tab === 'servicos';

  const [form, setForm] = useState<any>(() => ({
    descricao: editingItem?.descricao ?? '',
    ...(isServico
      ? { valorPadrao: editingItem?.valorPadrao ?? 0 }
      : { fabricante: editingItem?.fabricante ?? '', valorReferencia: editingItem?.valorReferencia ?? 0 }),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = isServico
        ? { descricao: form.descricao, valorPadrao: form.valorPadrao || undefined }
        : { descricao: form.descricao, fabricante: form.fabricante || undefined, valorReferencia: form.valorReferencia || undefined };

      if (isEditing) {
        if (isServico) {
          return window.osTech.servico.update(editingItem.id, payload as UpdateServicoDTO);
        }
        return window.osTech.peca.update(editingItem.id, payload as UpdatePecaDTO);
      }

      if (isServico) {
        return window.osTech.servico.create(payload as CreateServicoDTO);
      }
      return window.osTech.peca.create(payload as CreatePecaDTO);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      setErrors({ form: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.descricao.trim()) newErrors.descricao = 'Descricao e obrigatoria';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    mutation.mutate();
  };

  const set = (field: string, value: string | number) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const title = isEditing
    ? `Editar ${isServico ? 'Servico' : 'Peca'}`
    : `Nov${isServico ? 'o' : 'a'} ${isServico ? 'Servico' : 'Peca'}`;

  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Descricao" required error={errors.descricao}>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        {isServico ? (
          <FormField label="Valor Padrao">
            <CurrencyInput
              value={form.valorPadrao}
              onChange={(val) => set('valorPadrao', val)}
            />
          </FormField>
        ) : (
          <>
            <FormField label="Fabricante">
              <input
                type="text"
                value={form.fabricante}
                onChange={(e) => set('fabricante', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </FormField>
            <FormField label="Valor Referencia">
              <CurrencyInput
                value={form.valorReferencia}
                onChange={(val) => set('valorReferencia', val)}
              />
            </FormField>
          </>
        )}

        {errors.form && (
          <p className="text-sm text-destructive">{errors.form}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
