import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '../shared/form-field';
import { formatCPF, formatPhone, toUpper } from '../../lib/utils';
import type { Cliente, CreateClienteDTO, UpdateClienteDTO } from '@shared/types/entities.types';

interface ClientFormProps {
  client?: Cliente;
  onClose: () => void;
}

export function ClientForm({ client, onClose }: ClientFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const [form, setForm] = useState<CreateClienteDTO>({
    nome: client?.nome ?? '',
    cpf: client?.cpf ?? '',
    rg: client?.rg ?? undefined,
    telefone: client?.telefone ?? undefined,
    whatsapp: client?.whatsapp ?? undefined,
    email: client?.email ?? undefined,
    endereco: client?.endereco ?? undefined,
    observacoes: client?.observacoes ?? undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        return window.osTech.client.update(client.id, form as UpdateClienteDTO);
      }
      return window.osTech.client.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
    if (!form.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!form.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate();
  };

  const set = (field: keyof CreateClienteDTO, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value || undefined }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nome" required error={errors.nome}>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => set('nome', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="CPF" required error={errors.cpf}>
          <input
            type="text"
            value={form.cpf}
            onChange={(e) => set('cpf', formatCPF(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="000.000.000-00"
          />
        </FormField>

        <FormField label="RG">
          <input
            type="text"
            value={form.rg ?? ''}
            onChange={(e) => set('rg', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Telefone">
          <input
            type="text"
            value={form.telefone ?? ''}
            onChange={(e) => set('telefone', formatPhone(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="(11) 1234-5678"
          />
        </FormField>

        <FormField label="WhatsApp">
          <input
            type="text"
            value={form.whatsapp ?? ''}
            onChange={(e) => set('whatsapp', formatPhone(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="(11) 91234-5678"
          />
        </FormField>

        <FormField label="E-mail">
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', toUpper(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>
      </div>

      <FormField label="Endereço">
        <input
          type="text"
          value={form.endereco ?? ''}
            onChange={(e) => set('endereco', toUpper(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </FormField>

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
