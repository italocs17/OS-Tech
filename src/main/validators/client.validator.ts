/**
 * OS.Tech - Validador de dados de Cliente
 * Schemas Zod para validacao de entrada de dados de clientes.
 */

import { z } from 'zod';

// CPF validation com dígitos verificadores
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

export const createClientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  cpf: z.string().refine(validarCPF, 'CPF invalido'),
  rg: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  telefone: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(10, 'Telefone deve ter no minimo 10 digitos').optional()
  ),
  whatsapp: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(10, 'WhatsApp deve ter no minimo 10 digitos').optional()
  ),
  email: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().email('E-mail invalido').optional()
  ),
  endereco: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
});

export const updateClientSchema = createClientSchema.partial().omit({ cpf: true }).extend({
  ativo: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
