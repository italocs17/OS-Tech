import { useState, useMemo, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { FormField } from '../shared/form-field';
import type { Cliente, Equipamento, TipoAtendimento, CategoriaServico } from '@shared/types/entities.types';

interface OSFormProps {
  onClose: () => void;
}

export function OSForm({ onClose }: OSFormProps) {
  const queryClient = useQueryClient();
  const { user, hasAccessToCategoria, getCategoriasIds, isProprietario, isGestor } = useAuth();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => window.osTech.client.list(),
  });

  const clientList = Array.isArray(clients) ? (clients as Cliente[]) : [];

  const [clienteId, setClienteId] = useState(0);
  const [equipamentoId, setEquipamentoId] = useState(0);
  const [contatoId, setContatoId] = useState(0);
  const [categoriaServicoId, setCategoriaServicoId] = useState(0);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('INTERNO');
  const [observacoes, setObservacoes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [equipError, setEquipError] = useState('');

  const { data: equipments } = useQuery({
    queryKey: ['equipment-by-client', clienteId],
    queryFn: () => window.osTech.equipment.listByClient(clienteId),
    enabled: clienteId > 0,
  });

  const { data: contatos } = useQuery({
    queryKey: ['contatos-by-client', clienteId],
    queryFn: () => window.osTech.email.listContatos(clienteId),
    enabled: clienteId > 0,
  });

  const equipList = Array.isArray(equipments) ? (equipments as Equipamento[]) : [];

  const isRestricted = !isProprietario && !isGestor;
  const allowedCategoriaIds = useMemo(() => {
    if (!isRestricted) return [];
    return getCategoriasIds();
  }, [isRestricted, getCategoriasIds]);

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-servico'],
    queryFn: () => window.osTech.categoriaServico.list(),
  });

  const categoriasList = useMemo(() => {
    const all = Array.isArray(categoriasData) ? (categoriasData as CategoriaServico[]) : [];
    if (!isRestricted) return all;
    return all.filter((c) => allowedCategoriaIds.includes(c.id));
  }, [categoriasData, isRestricted, allowedCategoriaIds]);

  const mutation = useMutation({
    mutationFn: () =>
      window.osTech.os.create({
        clienteId,
        equipamentoId: equipamentoId || undefined,
        contatoId: contatoId || undefined,
        categoriaServicoId,
        tipoAtendimento,
        observacoes: observacoes || undefined,
      }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
      onClose();
    },
    onError: (err: Error) => {
      setEquipError(err.message);
      setErrors({ form: err.message });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setEquipError('');

    const newErrors: Record<string, string> = {};
    if (!clienteId) newErrors.clienteId = 'Selecione um cliente';
    if (!categoriaServicoId) newErrors.categoriaServicoId = 'Selecione uma categoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Tipo de Atendimento" required>
        <select
          value={tipoAtendimento}
          onChange={(e) => setTipoAtendimento(e.target.value as TipoAtendimento)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="INTERNO">Interno (Bancada / Remoto)</option>
          <option value="EXTERNO">Externo (Visita Técnica)</option>
        </select>
      </FormField>

      <FormField label="Cliente" required error={errors.clienteId}>
        <select
          value={clienteId}
          onChange={(e) => {
            setClienteId(Number(e.target.value));
            setEquipamentoId(0);
            setContatoId(0);
          }}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value={0}>Selecione...</option>
          {clientList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} - {c.cpfCnpj}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Equipamento" error={errors.equipamentoId || equipError}>
        <select
          value={equipamentoId}
          onChange={(e) => setEquipamentoId(Number(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={!clienteId}
        >
          <option value={0}>
            {clienteId ? 'ND - Nao Determinado' : 'Primeiro selecione um cliente'}
          </option>
          {equipList.map((e) => (
            <option key={e.id} value={e.id}>
              {e.etiqueta} - {e.marca} {e.modelo}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Contato">
        <select
          value={contatoId}
          onChange={(e) => setContatoId(Number(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={!clienteId}
        >
          <option value={0}>
            {clienteId ? 'Nenhum contato' : 'Primeiro selecione um cliente'}
          </option>
          {(Array.isArray(contatos) ? contatos : []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nome} - {c.email}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Categoria do Serviço" required error={errors.categoriaServicoId}>
        <select
          value={categoriaServicoId}
          onChange={(e) => setCategoriaServicoId(Number(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value={0}>Selecione...</option>
          {categoriasList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Observações">
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </FormField>

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
          {mutation.isPending ? 'Abrindo...' : 'Abrir OS'}
        </button>
      </div>
    </form>
  );
}
