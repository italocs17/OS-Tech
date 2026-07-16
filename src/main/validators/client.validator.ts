/**
 * OS.Tech - Validador de dados de Cliente
 * Schemas Zod para validacao de entrada de dados de clientes.
 * Aceita CPF (11 digitos) ou CNPJ (14 caracteres, alfanumerico desde 07/2026).
 */

import { z } from 'zod';

// CPF validation com digitos verificadores
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

// CNPJ alfanumerico: 12 caracteres alfanumericos + 2 digitos verificadores
// Algoritmo oficial: Modulo 11 com conversao ASCII - 48 (IN RFB 2.229/2024)
function valorCharCNPJ(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calcularDVCNPJ(base: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += valorCharCNPJ(base[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validarCNPJ(cnpj: string): boolean {
  const limpo = cnpj.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(limpo)) return false;
  if (/^0{14}$/.test(limpo)) return false;

  const base = limpo.substring(0, 12);
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const dv1 = calcularDVCNPJ(base, pesos1);
  const dv2 = calcularDVCNPJ(base + dv1, pesos2);

  return `${dv1}${dv2}` === limpo.substring(12);
}

// Validacao unificada: CPF ou CNPJ
function validarCPF_CNPJ(valor: string): boolean {
  const limpoNumeros = valor.replace(/\D/g, '');
  const limpoAlpha = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (limpoNumeros.length === 11) return validarCPF(valor);
  if (limpoAlpha.length === 14) return validarCNPJ(valor);
  return false;
}

export const createClientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  cpfCnpj: z.string().refine(validarCPF_CNPJ, 'CPF ou CNPJ invalido'),
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

export const updateClientSchema = createClientSchema.partial().omit({ cpfCnpj: true }).extend({
  ativo: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
