import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '../shared/form-field';
import { formatCPF_CNPJ, formatPhone, toUpper } from '../../lib/utils';
import type { Cliente, CreateClienteDTO, UpdateClienteDTO } from '@shared/types/entities.types';

interface ContatoForm {
  nome: string;
  email: string;
  telefone: string;
}

interface ClientFormProps {
  client?: Cliente;
  onClose: () => void;
  onSuccess?: (cliente: any) => void;
  showContatos?: boolean;
}

export function ClientForm({ client, onClose, onSuccess, showContatos = true }: ClientFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const [form, setForm] = useState<CreateClienteDTO>({
    nome: client?.nome ?? '',
    cpfCnpj: client?.cpfCnpj ?? '',
    rg: client?.rg ?? undefined,
    telefone: client?.telefone ?? undefined,
    whatsapp: client?.whatsapp ?? undefined,
    email: client?.email ?? undefined,
    endereco: client?.endereco ?? undefined,
    observacoes: client?.observacoes ?? undefined,
  });

  const [contatos, setContatos] = useState<ContatoForm[]>([
    { nome: '', email: '', telefone: '' },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const contatosValidos = contatos.filter((c) => c.nome.trim() && c.email.trim());
      const dadosComContatos = {
        ...form,
        ...(showContatos && contatosValidos.length > 0 ? { contatos: contatosValidos } : {}),
      };

      if (isEditing) {
        return window.osTech.client.update(client.id, dadosComContatos as UpdateClienteDTO);
      }
      return window.osTech.client.create(dadosComContatos);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (onSuccess) {
        onSuccess(result);
      } else {
        onClose();
      }
    },
    onError: (err: Error) => {
      setErrors({ form: err.message });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome e obrigatorio';
    if (!form.cpfCnpj.trim()) newErrors.cpfCnpj = 'CPF/CNPJ e obrigatorio';

    if (showContatos) {
      const contatosValidos = contatos.filter((c) => c.nome.trim() || c.email.trim());
      contatosValidos.forEach((c, i) => {
        if (!c.nome.trim()) newErrors[`contato_${i}_nome`] = 'Nome e obrigatorio';
        if (!c.email.trim()) newErrors[`contato_${i}_email`] = 'E-mail e obrigatorio';
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate();
  };

  const set = (field: keyof CreateClienteDTO, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value || undefined }));

  const canAddContato = contatos.length === 0 || (contatos[contatos.length - 1].nome.trim() && contatos[contatos.length - 1].email.trim());

  const addContato = () => {
    if (!canAddContato) return;
    setContatos((prev) => [...prev, { nome: '', email: '', telefone: '' }]);
  };

  const removeContato = (index: number) => {
    setContatos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateContato = (index: number, field: keyof ContatoForm, value: string) => {
    setContatos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

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

        <FormField label="CPF/CNPJ" required error={errors.cpfCnpj}>
          <input
            type="text"
            value={form.cpfCnpj}
            onChange={(e) => set('cpfCnpj', formatCPF_CNPJ(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="000.000.000-00 ou XX.XXX.XXX/XXXX-XX"
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

      <FormField label="Endereco">
        <input
          type="text"
          value={form.endereco ?? ''}
            onChange={(e) => set('endereco', toUpper(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </FormField>

      <FormField label="Observacoes">
        <textarea
          value={form.observacoes ?? ''}
            onChange={(e) => set('observacoes', toUpper(e.target.value))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </FormField>

      {showContatos && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Contatos</h3>
            <button
              type="button"
              onClick={addContato}
              disabled={!canAddContato}
              className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Adicionar Contato
            </button>
          </div>

          {contatos.map((contato, index) => (
            <div key={index} className="flex gap-2 items-start rounded-lg border p-3">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Nome *</label>
                  <input
                    type="text"
                    value={contato.nome}
                    onChange={(e) => updateContato(index, 'nome', toUpper(e.target.value))}
                    className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Nome do contato"
                  />
                  {errors[`contato_${index}_nome`] && (
                    <p className="text-xs text-destructive mt-1">{errors[`contato_${index}_nome`]}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">E-mail *</label>
                  <input
                    type="email"
                    value={contato.email}
                    onChange={(e) => updateContato(index, 'email', e.target.value.toLowerCase())}
                    className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="email@exemplo.com"
                  />
                  {errors[`contato_${index}_email`] && (
                    <p className="text-xs text-destructive mt-1">{errors[`contato_${index}_email`]}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <input
                    type="text"
                    value={contato.telefone}
                    onChange={(e) => updateContato(index, 'telefone', formatPhone(e.target.value))}
                    className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="(11) 1234-5678"
                  />
                </div>
              </div>
              {contatos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContato(index)}
                  className="mt-4 text-destructive hover:text-destructive/80 text-sm"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
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
  );
}
