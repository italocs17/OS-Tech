import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormField } from '../shared/form-field';
import { toUpper } from '../../lib/utils';
import type { Equipamento, CreateEquipamentoDTO, UpdateEquipamentoDTO, Cliente } from '@shared/types/entities.types';

interface EquipmentFormProps {
  equipment?: Equipamento;
  clientId?: number;
  onClose: () => void;
  onSuccess?: (equipment: Equipamento) => void;
}

export function EquipmentForm({ equipment, clientId, onClose, onSuccess }: EquipmentFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!equipment;

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => window.osTech.client.list(),
  });

  const clientList = Array.isArray(clients) ? (clients as Cliente[]) : [];

  const [form, setForm] = useState({
    clienteId: equipment?.clienteId ?? clientId ?? 0,
    tipo: equipment?.tipo ?? '',
    marca: equipment?.marca ?? '',
    modelo: equipment?.modelo ?? '',
    numeroSerie: equipment?.numeroSerie ?? '',
    observacoes: equipment?.observacoes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.clienteId) throw new Error('Selecione um cliente');
      if (isEditing) {
        return window.osTech.equipment.update(equipment.id, form as UpdateEquipamentoDTO);
      }
      return window.osTech.equipment.create(form as CreateEquipamentoDTO);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    },
    onError: (err: Error) => {
      setErrors({ form: err.message });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.clienteId) newErrors.clienteId = 'Selecione um cliente';
    if (!form.tipo.trim()) newErrors.tipo = 'Tipo é obrigatório';
    if (!form.marca.trim()) newErrors.marca = 'Marca é obrigatória';
    if (!form.modelo.trim()) newErrors.modelo = 'Modelo é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate();
  };

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Cliente" required error={errors.clienteId}>
          <select
            value={form.clienteId}
            onChange={(e) => set('clienteId', Number(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isEditing || !!clientId}
          >
            <option value={0}>Selecione...</option>
            {clientList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} - {c.cpfCnpj}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Tipo" required error={errors.tipo}>
          <select
            value={form.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            <option value="Desktop">Desktop</option>
            <option value="Notebook">Notebook</option>
            <option value="Impressora">Impressora</option>
            <option value="Monitor">Monitor</option>
            <option value="Servidor">Servidor</option>
            <option value="Tablet">Tablet</option>
            <option value="Celular">Celular</option>
            <option value="Outro">Outro</option>
          </select>
        </FormField>

        <FormField label="Marca" required error={errors.marca}>
          <input
            type="text"
            value={form.marca}
            onChange={(e) => set('marca', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Modelo" required error={errors.modelo}>
          <input
            type="text"
            value={form.modelo}
            onChange={(e) => set('modelo', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Nº Série">
          <input
            type="text"
            value={form.numeroSerie ?? ''}
            onChange={(e) => set('numeroSerie', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>
      </div>

      <FormField label="Observações">
        <textarea
          value={form.observacoes ?? ''}
            onChange={(e) => set('observacoes', toUpper(e.target.value))}
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
          {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
