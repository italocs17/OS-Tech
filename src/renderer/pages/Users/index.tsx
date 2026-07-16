import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { FormField } from '../../components/shared/form-field';
import { SearchInput } from '../../components/shared/search-input';
import type { Usuario, PerfilUsuario, Equipe } from '@shared/types/entities.types';

const PERFIS: PerfilUsuario[] = ['TECNICO', 'RECEPCIONISTA', 'PROPRIETARIO', 'GESTOR'];

interface UsuarioRow {
  id: number;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => window.osTech.user.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => window.osTech.user.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const columns: Column<UsuarioRow>[] = [
    { key: 'nome', header: 'Nome' },
    { key: 'login', header: 'Login' },
    { key: 'perfil', header: 'Perfil' },
    {
      key: 'ativo',
      header: 'Status',
      render: (item) => (
        <span className={item.ativo ? 'text-green-600' : 'text-destructive'}>
          {item.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Excluir usuario ${item.nome}?`)) {
              deleteMutation.mutate(item.id);
            }
          }}
          className="text-sm text-destructive hover:underline"
        >
          Excluir
        </button>
      ),
    },
  ];

  const data = Array.isArray(users) ? users : [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (u: UsuarioRow) =>
        u.nome.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  const handleNew = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (item: UsuarioRow) => {
    const full = (users as Usuario[]).find((u) => u.id === item.id);
    if (full) {
      setEditingUser(full);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description={`${filtered.length} de ${data.length} usuarios`}
        actions={
          <button
            onClick={handleNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Novo Usuario
          </button>
        }
      />
      <SearchInput
        placeholder="Buscar por nome ou login..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum usuario cadastrado"
        onRowClick={handleEdit}
      />

      <UserFormModal
        open={modalOpen}
        user={editingUser}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  );
}

function UserFormModal({
  open,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user: Usuario | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!user;

  const [form, setForm] = useState({
    nome: user?.nome ?? '',
    login: user?.login ?? '',
    senha: '',
    perfil: user?.perfil ?? 'TECNICO' as PerfilUsuario,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: equipesData } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => window.osTech.equipe.list(),
    enabled: open,
  });

  const equipesList = useMemo(
    () => (Array.isArray(equipesData) ? (equipesData as Equipe[]) : []),
    [equipesData]
  );

  const { data: equipesDoUsuario } = useQuery({
    queryKey: ['equipes-by-usuario', user?.id],
    queryFn: () => window.osTech.equipe.getByUsuario(user!.id),
    enabled: open && isEditing && !!user,
  });

  const equipesUsuarioIds = useMemo(() => {
    if (!equipesDoUsuario || !Array.isArray(equipesDoUsuario)) return [];
    return (equipesDoUsuario as any[]).map((eu: any) => eu.equipeId);
  }, [equipesDoUsuario]);

  const [selectedEquipes, setSelectedEquipes] = useState<number[]>([]);

  useState(() => {
    if (isEditing && equipesUsuarioIds.length > 0) {
      setSelectedEquipes(equipesUsuarioIds);
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const payload: any = { nome: form.nome, perfil: form.perfil };
        if (form.senha) payload.senha = form.senha;
        const result = await window.osTech.user.update(user.id, payload);
        for (const equipeId of selectedEquipes) {
          if (!equipesUsuarioIds.includes(equipeId)) {
            await window.osTech.equipe.addUsuario(equipeId, user.id);
          }
        }
        for (const equipeId of equipesUsuarioIds) {
          if (!selectedEquipes.includes(equipeId)) {
            await window.osTech.equipe.removeUsuario(equipeId, user.id);
          }
        }
        return result;
      }
      return window.osTech.user.create({
        nome: form.nome,
        login: form.login,
        senha: form.senha,
        perfil: form.perfil,
      });
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
    if (!form.nome.trim()) newErrors.nome = 'Nome e obrigatorio';
    if (!form.login.trim() && !isEditing) newErrors.login = 'Login e obrigatorio';
    if (!form.senha && !isEditing) newErrors.senha = 'Senha e obrigatoria';
    if (form.senha && form.senha.length < 6) newErrors.senha = 'Minimo 6 caracteres';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate();
  };

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleEquipe = (id: number) => {
    setSelectedEquipes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      open={open}
      title={isEditing ? 'Editar Usuario' : 'Novo Usuario'}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome" required error={errors.nome}>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Login" required={!isEditing} error={errors.login}>
          <input
            type="text"
            value={form.login}
            onChange={(e) => set('login', e.target.value)}
            disabled={isEditing}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </FormField>

        <FormField
          label={isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
          required={!isEditing}
          error={errors.senha}
        >
          <input
            type="password"
            value={form.senha}
            onChange={(e) => set('senha', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            minLength={6}
          />
        </FormField>

        <FormField label="Perfil" required>
          <select
            value={form.perfil}
            onChange={(e) => set('perfil', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERFIS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormField>

        {isEditing && equipesList.length > 0 && (
          <FormField label="Equipes">
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
              {equipesList.map((eq) => (
                <label
                  key={eq.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedEquipes.includes(eq.id)}
                    onChange={() => toggleEquipe(eq.id)}
                    className="rounded"
                  />
                  {eq.nome}
                </label>
              ))}
            </div>
          </FormField>
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
