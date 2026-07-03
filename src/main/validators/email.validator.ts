import { z } from 'zod';

export const createContatoSchema = z.object({
  clienteId: z.number().int().positive(),
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  telefone: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
});

export const updateContatoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').optional(),
  email: z.string().email('Email invalido').optional(),
  telefone: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  ativo: z.boolean().optional(),
});

export const emailConfigSchema = z.object({
  email: z.string().email('Email invalido'),
  appPassword: z.string().min(1, 'Senha de app obrigatoria'),
});

export const linkClientSchema = z.object({
  solicitacaoId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  contatoId: z.number().int().positive(),
  usuarioId: z.number().int().positive(),
});

export const convertToOSSchema = z.object({
  solicitacaoId: z.number().int().positive(),
  usuarioId: z.number().int().positive(),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  tipoAtendimento: z.enum(['INTERNO', 'EXTERNO']).optional().default('INTERNO'),
});
