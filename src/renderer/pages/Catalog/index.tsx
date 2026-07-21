import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { FormField } from '../../components/shared/form-field';
import { SearchInput } from '../../components/shared/search-input';
import { ToggleSwitch } from '../../components/shared/toggle-switch';
import { CurrencyInput } from '../../components/shared/currency-input';
import { formatCurrency } from '../../lib/utils';
import type {
  Servico, Peca, CategoriaServico, SubcategoriaServico,
  CreateServicoDTO, UpdateServicoDTO, CreatePecaDTO, UpdatePecaDTO,
  CreateCategoriaServicoDTO, UpdateCategoriaServicoDTO,
  CreateSubcategoriaServicoDTO, UpdateSubcategoriaServicoDTO,
} from '@shared/types/entities.types';

type Tab = 'servicos' | 'pecas' | 'categorias' | 'subcategorias';

interface ServicoRow {
  id: number;
  descricao: string;
  valorPadrao: number;
  ativo: boolean;
  categoriaId: number | null;
  subcategoriaId: number | null;
  categoria?: { nome: string } | null;
  subcategoria?: { nome: string } | null;
}

interface PecaRow {
  id: number;
  descricao: string;
  fabricante: string | null;
  valorReferencia: number;
  ativo: boolean;
}

interface CategoriaServicoRow {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

interface SubcategoriaServicoRow {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  categoriaId: number;
  categoria?: { nome: string } | null;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'servicos';
  const [tab, setTab] = useState<Tab>(initialTab);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoriaId, setFilterCategoriaId] = useState<number | ''>('');
  const [filterSubcategoriaId, setFilterSubcategoriaId] = useState<number | ''>('');
  const queryClient = useQueryClient();

  const { data: servicos, isLoading: servicosLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => window.osTech.servico.list(),
  });

  const { data: pecas, isLoading: pecasLoading } = useQuery({
    queryKey: ['pecas'],
    queryFn: () => window.osTech.peca.list(),
  });

  const { data: categorias, isLoading: categoriasLoading } = useQuery({
    queryKey: ['categorias-servico'],
    queryFn: () => window.osTech.categoriaServico.list(),
  });

  const { data: subcategorias, isLoading: subcategoriasLoading } = useQuery({
    queryKey: ['subcategorias-servico'],
    queryFn: () => window.osTech.subcategoriaServico.list(),
  });

  const servicosData = Array.isArray(servicos) ? servicos : [];
  const pecasData = Array.isArray(pecas) ? pecas : [];
  const categoriasData = Array.isArray(categorias) ? categorias : [];
  const subcategoriasData = Array.isArray(subcategorias) ? subcategorias : [];

  const subcategoriasFiltradas = useMemo(() => {
    if (filterCategoriaId === '') return subcategoriasData;
    return subcategoriasData.filter((s: SubcategoriaServicoRow) => s.categoriaId === filterCategoriaId);
  }, [subcategoriasData, filterCategoriaId]);

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ type, id, ativo }: { type: 'servico' | 'peca' | 'categoria' | 'subcategoria'; id: number; ativo: boolean }) => {
      if (type === 'servico') return window.osTech.servico.update(id, { ativo });
      if (type === 'categoria') return window.osTech.categoriaServico.update(id, { ativo });
      if (type === 'subcategoria') return window.osTech.subcategoriaServico.update(id, { ativo });
      return window.osTech.peca.update(id, { ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-servico'] });
      queryClient.invalidateQueries({ queryKey: ['subcategorias-servico'] });
    },
  });

  const servicoColumns: Column<ServicoRow>[] = [
    { key: 'descricao', header: 'Descricao' },
    {
      key: 'categoria',
      header: 'Categoria',
      render: (item) => item.categoria?.nome ?? '-',
    },
    {
      key: 'subcategoria',
      header: 'Subcategoria',
      render: (item) => item.subcategoria?.nome ?? '-',
    },
    {
      key: 'valorPadrao',
      header: 'Valor Padrao',
      render: (item) => formatCurrency(item.valorPadrao),
    },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <ToggleSwitch
          checked={item.ativo}
          onChange={(ativo) => toggleAtivoMutation.mutate({ type: 'servico', id: item.id, ativo })}
          label={item.ativo ? 'Desativar servico' : 'Ativar servico'}
        />
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
        <ToggleSwitch
          checked={item.ativo}
          onChange={(ativo) => toggleAtivoMutation.mutate({ type: 'peca', id: item.id, ativo })}
          label={item.ativo ? 'Desativar peca' : 'Ativar peca'}
        />
      ),
    },
  ];

  const categoriaColumns: Column<CategoriaServicoRow>[] = [
    { key: 'nome', header: 'Nome' },
    { key: 'descricao', header: 'Descricao' },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <ToggleSwitch
          checked={item.ativo}
          onChange={(ativo) => toggleAtivoMutation.mutate({ type: 'categoria', id: item.id, ativo })}
          label={item.ativo ? 'Desativar categoria' : 'Ativar categoria'}
        />
      ),
    },
  ];

  const subcategoriaColumns: Column<SubcategoriaServicoRow>[] = [
    { key: 'nome', header: 'Nome' },
    {
      key: 'categoria',
      header: 'Categoria',
      render: (item) => item.categoria?.nome ?? '-',
    },
    { key: 'descricao', header: 'Descricao' },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <ToggleSwitch
          checked={item.ativo}
          onChange={(ativo) => toggleAtivoMutation.mutate({ type: 'subcategoria', id: item.id, ativo })}
          label={item.ativo ? 'Desativar subcategoria' : 'Ativar subcategoria'}
        />
      ),
    },
  ];

  const filteredServicos = useMemo(() => {
    let result = servicosData;
    if (filterCategoriaId !== '') {
      result = result.filter((s: ServicoRow) => s.categoriaId === filterCategoriaId);
    }
    if (filterSubcategoriaId !== '') {
      result = result.filter((s: ServicoRow) => s.subcategoriaId === filterSubcategoriaId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: ServicoRow) =>
        s.descricao.toLowerCase().includes(q)
      );
    }
    return result;
  }, [servicosData, searchQuery, filterCategoriaId, filterSubcategoriaId]);

  const filteredPecas = useMemo(() => {
    if (!searchQuery.trim()) return pecasData;
    const q = searchQuery.toLowerCase();
    return pecasData.filter((p: PecaRow) =>
      p.descricao.toLowerCase().includes(q) ||
      (p.fabricante && p.fabricante.toLowerCase().includes(q))
    );
  }, [pecasData, searchQuery]);

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categoriasData;
    const q = searchQuery.toLowerCase();
    return categoriasData.filter((c: CategoriaServicoRow) =>
      c.nome.toLowerCase().includes(q) ||
      (c.descricao && c.descricao.toLowerCase().includes(q))
    );
  }, [categoriasData, searchQuery]);

  const filteredSubcategorias = useMemo(() => {
    let result = subcategoriasData;
    if (filterCategoriaId !== '') {
      result = result.filter((s: SubcategoriaServicoRow) => s.categoriaId === filterCategoriaId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: SubcategoriaServicoRow) =>
        s.nome.toLowerCase().includes(q) ||
        (s.descricao && s.descricao.toLowerCase().includes(q))
      );
    }
    return result;
  }, [subcategoriasData, searchQuery, filterCategoriaId]);

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

  const handleEditCategoria = (item: CategoriaServicoRow) => {
    const full = (categorias as CategoriaServico[]).find((c) => c.id === item.id);
    if (full) {
      setEditingItem({ ...full, _type: 'categoria' });
      setModalOpen(true);
    }
  };

  const handleEditSubcategoria = (item: SubcategoriaServicoRow) => {
    const full = (subcategorias as SubcategoriaServico[]).find((s) => s.id === item.id);
    if (full) {
      setEditingItem({ ...full, _type: 'subcategoria' });
      setModalOpen(true);
    }
  };

  const isLoading = tab === 'servicos' ? servicosLoading : tab === 'pecas' ? pecasLoading : tab === 'categorias' ? categoriasLoading : subcategoriasLoading;
  const totalData = tab === 'servicos' ? servicosData : tab === 'pecas' ? pecasData : tab === 'categorias' ? categoriasData : subcategoriasData;
  const currentData = tab === 'servicos' ? filteredServicos : tab === 'pecas' ? filteredPecas : tab === 'categorias' ? filteredCategorias : filteredSubcategorias;

  const showSubcategoriaFilter = tab === 'servicos' || tab === 'subcategorias';

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
        {(['servicos', 'pecas', 'categorias', 'subcategorias'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { handleTabChange(t); setSearchQuery(''); setFilterCategoriaId(''); setFilterSubcategoriaId(''); }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'servicos' ? 'Servicos' : t === 'pecas' ? 'Pecas' : t === 'categorias' ? 'Categorias' : 'Subcategorias'}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <SearchInput
          placeholder={`Buscar ${tab === 'servicos' ? 'servico' : tab === 'pecas' ? 'peca' : tab === 'categorias' ? 'categoria' : 'subcategoria'}...`}
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-sm"
        />
        {(tab === 'servicos' || tab === 'subcategorias') && (
          <select
            value={filterCategoriaId}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              setFilterCategoriaId(val);
              setFilterSubcategoriaId('');
            }}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {categoriasData.map((c: CategoriaServicoRow) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}
        {tab === 'servicos' && filterCategoriaId !== '' && (
          <select
            value={filterSubcategoriaId}
            onChange={(e) => setFilterSubcategoriaId(e.target.value === '' ? '' : Number(e.target.value))}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as subcategorias</option>
            {subcategoriasFiltradas.map((s: SubcategoriaServicoRow) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        )}
      </div>

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
      ) : tab === 'pecas' ? (
        <DataTable
          columns={pecaColumns as any}
          data={filteredPecas}
          keyExtractor={(item: PecaRow) => item.id}
          emptyMessage="Nenhuma peca cadastrada"
          onRowClick={handleEditPeca}
        />
      ) : tab === 'categorias' ? (
        <DataTable
          columns={categoriaColumns as any}
          data={filteredCategorias}
          keyExtractor={(item: CategoriaServicoRow) => item.id}
          emptyMessage="Nenhuma categoria cadastrada"
          onRowClick={handleEditCategoria}
        />
      ) : (
        <DataTable
          columns={subcategoriaColumns as any}
          data={filteredSubcategorias}
          keyExtractor={(item: SubcategoriaServicoRow) => item.id}
          emptyMessage="Nenhuma subcategoria cadastrada"
          onRowClick={handleEditSubcategoria}
        />
      )}

      <CatalogFormModal
        tab={tab}
        open={modalOpen}
        editingItem={editingItem}
        categorias={categoriasData}
        subcategorias={subcategoriasFiltradas}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['servicos'] });
          queryClient.invalidateQueries({ queryKey: ['pecas'] });
          queryClient.invalidateQueries({ queryKey: ['categorias-servico'] });
          queryClient.invalidateQueries({ queryKey: ['subcategorias-servico'] });
        }}
      />
    </div>
  );
}

function CatalogFormModal({
  tab,
  open,
  editingItem,
  categorias,
  subcategorias,
  onClose,
  onSuccess,
}: {
  tab: Tab;
  open: boolean;
  editingItem: any;
  categorias: CategoriaServicoRow[];
  subcategorias: SubcategoriaServicoRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!editingItem;
  const isServico = tab === 'servicos';
  const isCategoria = tab === 'categorias';
  const isSubcategoria = tab === 'subcategorias';

  const [form, setForm] = useState<any>(() => {
    if (isCategoria) {
      return { nome: editingItem?.nome ?? '', descricao: editingItem?.descricao ?? '' };
    }
    if (isSubcategoria) {
      return { nome: editingItem?.nome ?? '', descricao: editingItem?.descricao ?? '', categoriaId: editingItem?.categoriaId ?? '' };
    }
    if (isServico) {
      return {
        descricao: editingItem?.descricao ?? '',
        valorPadrao: editingItem?.valorPadrao ?? 0,
        categoriaId: editingItem?.categoriaId ?? '',
        subcategoriaId: editingItem?.subcategoriaId ?? '',
      };
    }
    return {
      descricao: editingItem?.descricao ?? '',
      fabricante: editingItem?.fabricante ?? '',
      valorReferencia: editingItem?.valorReferencia ?? 0,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subcategoriasDoForm = useMemo(() => {
    if (form.categoriaId === '' || !form.categoriaId) return [];
    return subcategorias.filter((s: SubcategoriaServicoRow) => s.categoriaId === form.categoriaId);
  }, [subcategorias, form.categoriaId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isCategoria) {
        const payload: CreateCategoriaServicoDTO | UpdateCategoriaServicoDTO = {
          nome: form.nome,
          descricao: form.descricao || undefined,
        };
        if (isEditing) return window.osTech.categoriaServico.update(editingItem.id, payload);
        return window.osTech.categoriaServico.create(payload);
      }
      if (isSubcategoria) {
        const payload: CreateSubcategoriaServicoDTO | UpdateSubcategoriaServicoDTO = {
          nome: form.nome,
          descricao: form.descricao || undefined,
          categoriaId: form.categoriaId,
        };
        if (isEditing) return window.osTech.subcategoriaServico.update(editingItem.id, payload);
        return window.osTech.subcategoriaServico.create(payload);
      }
      if (isServico) {
        const payload = {
          descricao: form.descricao,
          valorPadrao: form.valorPadrao || undefined,
          categoriaId: form.categoriaId === '' ? null : form.categoriaId || null,
          subcategoriaId: form.subcategoriaId === '' ? null : form.subcategoriaId || null,
        };
        if (isEditing) return window.osTech.servico.update(editingItem.id, payload as UpdateServicoDTO);
        return window.osTech.servico.create(payload as CreateServicoDTO);
      }
      const payload = { descricao: form.descricao, fabricante: form.fabricante || undefined, valorReferencia: form.valorReferencia || undefined };
      if (isEditing) return window.osTech.peca.update(editingItem.id, payload as UpdatePecaDTO);
      return window.osTech.peca.create(payload as CreatePecaDTO);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err: Error) => { setErrors({ form: err.message }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (isCategoria || isSubcategoria) {
      if (!form.nome.trim()) newErrors.nome = 'Nome e obrigatorio';
      if (isSubcategoria && !form.categoriaId) newErrors.categoriaId = 'Categoria e obrigatoria';
    } else {
      if (!form.descricao.trim()) newErrors.descricao = 'Descricao e obrigatoria';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    mutation.mutate();
  };

  const set = (field: string, value: string | number) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const title = isEditing
    ? `Editar ${isCategoria ? 'Categoria' : isSubcategoria ? 'Subcategoria' : isServico ? 'Servico' : 'Peca'}`
    : `Nov${isCategoria ? 'a' : isSubcategoria ? 'a' : isServico ? 'o' : 'a'} ${isCategoria ? 'Categoria' : isSubcategoria ? 'Subcategoria' : isServico ? 'Servico' : 'Peca'}`;

  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isCategoria && (
          <>
            <FormField label="Nome" required error={errors.nome}>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Ex: Bancada, Rede, CFTV" />
            </FormField>
            <FormField label="Descricao">
              <input type="text" value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </FormField>
          </>
        )}
        {isSubcategoria && (
          <>
            <FormField label="Categoria" required error={errors.categoriaId}>
              <select value={form.categoriaId} onChange={(e) => set('categoriaId', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione a categoria</option>
                {categorias.map((c: CategoriaServicoRow) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Nome" required error={errors.nome}>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Ex: Manutencao Preventiva" />
            </FormField>
            <FormField label="Descricao">
              <input type="text" value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </FormField>
          </>
        )}
        {(isServico || (!isCategoria && !isSubcategoria)) && (
          <>
            <FormField label="Descricao" required error={errors.descricao}>
              <input type="text" value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </FormField>
            {isServico && (
              <>
                <FormField label="Categoria">
                  <select value={form.categoriaId} onChange={(e) => {
                    set('categoriaId', e.target.value === '' ? '' : Number(e.target.value));
                    set('subcategoriaId', '');
                  }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sem categoria</option>
                    {categorias.map((c: CategoriaServicoRow) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </FormField>
                {form.categoriaId && subcategoriasDoForm.length > 0 && (
                  <FormField label="Subcategoria">
                    <select value={form.subcategoriaId} onChange={(e) => set('subcategoriaId', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Sem subcategoria</option>
                      {subcategoriasDoForm.map((s: SubcategoriaServicoRow) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </FormField>
                )}
                <FormField label="Valor Padrao">
                  <CurrencyInput value={form.valorPadrao} onChange={(val) => set('valorPadrao', val)} />
                </FormField>
              </>
            )}
            {!isServico && (
              <>
                <FormField label="Fabricante">
                  <input type="text" value={form.fabricante} onChange={(e) => set('fabricante', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </FormField>
                <FormField label="Valor Referencia">
                  <CurrencyInput value={form.valorReferencia} onChange={(val) => set('valorReferencia', val)} />
                </FormField>
              </>
            )}
          </>
        )}
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancelar</button>
          <button type="submit" disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
