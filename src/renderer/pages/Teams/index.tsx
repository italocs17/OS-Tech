import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { FormField } from '../../components/shared/form-field';
import { SearchInput } from '../../components/shared/search-input';
import { ToggleSwitch } from '../../components/shared/toggle-switch';
import { AtivoBadge, ativoRowClass } from '../../components/shared/ativo-badge';
import type {
  Equipe, CategoriaServico, Usuario,
  CreateEquipeDTO, UpdateEquipeDTO,
} from '@shared/types/entities.types';

interface EquipeRow {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  categorias?: { categoria?: CategoriaServico | null }[];
  usuarios?: { usuario?: Usuario | null }[];
}

export function TeamsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: equipes, isLoading } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => window.osTech.equipe.listAll(),
  });

  const { data: usuarios } = useQuery({
    queryKey: ['users'],
    queryFn: () => window.osTech.user.listAll(),
  });

  const equipesData = Array.isArray(equipes) ? (equipes as EquipeRow[]) : [];
  const usuariosData = Array.isArray(usuarios) ? (usuarios as Usuario[]) : [];

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => window.osTech.equipe.update(id, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  });

  const columns: Column<EquipeRow>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (item) => (
        <>
          {item.nome}
          <AtivoBadge ativo={item.ativo} />
        </>
      ),
    },
    { key: 'descricao', header: 'Descricao' },
    {
      key: 'categorias',
      header: 'Categorias',
      render: (item) => {
        const cats = item.categorias?.map((ec) => ec.categoria?.nome).filter(Boolean) ?? [];
        return cats.length > 0 ? cats.join(', ') : '-';
      },
    },
    {
      key: 'usuarios',
      header: 'Membros',
      render: (item) => {
        const count = item.usuarios?.length ?? 0;
        return <span className="text-muted-foreground">{count} membro(s)</span>;
      },
    },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <ToggleSwitch
          checked={item.ativo}
          onChange={(ativo) => toggleAtivoMutation.mutate({ id: item.id, ativo })}
          label={item.ativo ? 'Desativar equipe' : 'Ativar equipe'}
        />
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return equipesData;
    const q = searchQuery.toLowerCase();
    return equipesData.filter(
      (e: EquipeRow) =>
        e.nome.toLowerCase().includes(q) ||
        (e.descricao && e.descricao.toLowerCase().includes(q))
    );
  }, [equipesData, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  const handleNew = () => {
    setEditingEquipe(null);
    setModalOpen(true);
  };

  const handleEdit = (item: EquipeRow) => {
    const full = equipesData.find((e) => e.id === item.id);
    if (full) {
      setEditingEquipe(full as unknown as Equipe);
      setModalOpen(true);
    }
  };

  const handleGerenciarUsuarios = (item: EquipeRow) => {
    setSelectedEquipe(item);
    setUsuariosModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipes"
        description={`${filtered.length} de ${equipesData.length} equipes`}
        actions={
          <button
            onClick={handleNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Nova Equipe
          </button>
        }
      />
      <SearchInput
        placeholder="Buscar equipe..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhuma equipe cadastrada"
        onRowClick={handleEdit}
        onRowSecondaryAction={handleGerenciarUsuarios}
        secondaryActionLabel="Membros"
        rowClassName={(item) => ativoRowClass(item.ativo)}
      />

      <EquipeFormModal
        open={modalOpen}
        editingEquipe={editingEquipe}
        onClose={() => { setModalOpen(false); setEditingEquipe(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['equipes'] })}
      />

      <UsuariosModal
        open={usuariosModalOpen}
        equipe={selectedEquipe}
        usuarios={usuariosData}
        onClose={() => { setUsuariosModalOpen(false); setSelectedEquipe(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['equipes'] })}
      />
    </div>
  );
}

function EquipeFormModal({
  open,
  editingEquipe,
  onClose,
  onSuccess,
}: {
  open: boolean;
  editingEquipe: Equipe | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!editingEquipe;
  const existingCategoriaIds = (editingEquipe as any)?.categorias?.map((ec: any) => ec.categoriaId) ?? [];

  const [form, setForm] = useState(() => ({
    nome: editingEquipe?.nome ?? '',
    descricao: editingEquipe?.descricao ?? '',
    categoriaIds: existingCategoriaIds as number[],
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-servico'],
    queryFn: () => window.osTech.categoriaServico.list(),
    enabled: open,
  });

  const categorias = Array.isArray(categoriasData) ? (categoriasData as CategoriaServico[]) : [];

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CreateEquipeDTO | UpdateEquipeDTO = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        categoriaIds: form.categoriaIds,
      };
      if (isEditing) return window.osTech.equipe.update(editingEquipe.id, payload);
      return window.osTech.equipe.create(payload);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err: Error) => { setErrors({ form: err.message }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome e obrigatorio';
    if (form.nome.trim().length < 2) newErrors.nome = 'Minimo 2 caracteres';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    mutation.mutate();
  };

  const toggleCategoria = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categoriaIds: prev.categoriaIds.includes(id)
        ? prev.categoriaIds.filter((c) => c !== id)
        : [...prev.categoriaIds, id],
    }));
  };

  return (
    <Modal open={open} title={isEditing ? 'Editar Equipe' : 'Nova Equipe'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome" required error={errors.nome}>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex: Equipe Bancada"
          />
        </FormField>

        <FormField label="Descricao">
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Categorias de Servico">
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
            {categorias.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma categoria cadastrada</p>
            )}
            {categorias.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={form.categoriaIds.includes(cat.id)}
                  onChange={() => toggleCategoria(cat.id)}
                  className="rounded"
                />
                {cat.nome}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione as categorias que esta equipe atende
          </p>
        </FormField>

        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UsuariosModal({
  open,
  equipe,
  usuarios,
  onClose,
  onSuccess,
}: {
  open: boolean;
  equipe: EquipeRow | null;
  usuarios: Usuario[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const currentMemberIds = useMemo(
    () => equipe?.usuarios?.map((eu) => eu.usuario?.id).filter(Boolean) ?? [],
    [equipe]
  );

  const addMutation = useMutation({
    mutationFn: async (usuarioId: number) => {
      if (!equipe) return;
      return window.osTech.equipe.addUsuario(equipe.id, usuarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      onSuccess();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (usuarioId: number) => {
      if (!equipe) return;
      return window.osTech.equipe.removeUsuario(equipe.id, usuarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      onSuccess();
    },
  });

  const availableUsuarios = usuarios.filter((u) => !currentMemberIds.includes(u.id));

  return (
    <Modal open={open} title={`Membros - ${equipe?.nome ?? ''}`} onClose={onClose} size="md">
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Membros Atuais</h4>
          {currentMemberIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum membro vinculado</p>
          ) : (
            <div className="space-y-1">
              {equipe?.usuarios?.map((eu) => eu.usuario && (
                <div key={eu.usuario.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm">{eu.usuario.nome} ({eu.usuario.perfil})</span>
                  <button
                    onClick={() => removeMutation.mutate(eu.usuario!.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {availableUsuarios.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Adicionar Membro</h4>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {availableUsuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-accent">
                  <span className="text-sm">{u.nome} ({u.perfil})</span>
                  <button
                    onClick={() => addMutation.mutate(u.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
