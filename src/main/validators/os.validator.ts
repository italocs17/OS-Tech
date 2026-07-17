/**
 * OS.Tech - Validador de dados de Ordem de Servico
 * Schemas Zod para validacao de entrada de dados de OS, Eventos e Itens.
 */

import { z } from 'zod';
import type { StatusOS } from '@shared/types/entities.types';

// =============================================================================
// OS
// =============================================================================

export const createOSSchema = z.object({
  clienteId: z.number().int().positive('ID do cliente e obrigatorio'),
  equipamentoId: z.number().int().positive().optional(),
  contatoId: z.number().int().positive().optional(),
  tipoAtendimento: z.enum(['INTERNO', 'EXTERNO']).optional(),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  dataPrevisao: z.date().optional(),
});

export const updateOSSchema = z.object({
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  dataPrevisao: z.date().optional(),
  dataConclusao: z.date().optional(),
  tipoAtendimento: z.enum(['INTERNO', 'EXTERNO']).optional(),
  equipamentoId: z.number().int().positive().nullable().optional(),
  contatoId: z.number().int().positive().nullable().optional(),
  desconto: z.number().min(0).nullable().optional(),
  descontoTipo: z.enum(['ABSOLUTO', 'PERCENTUAL']).optional(),
  formaPagamento: z.enum(['CONTRATO', 'PIX', 'ESPECIE', 'DEBITO', 'CREDITO_A_VISTA', 'CREDITO_PARCELADO']).optional(),
});

// =============================================================================
// STATUS
// =============================================================================

const STATUS_OS: StatusOS[] = [
  'ABERTA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'AGUARDANDO_PECA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'ENTREGUE',
  'CANCELADA',
];

export const changeStatusSchema = z.object({
  status: z.enum(STATUS_OS, {
    message: 'Status invalido',
  }),
});

/**
 * Mapa de transicoes permitidas de status.
 * ABERTA -> [EM_DIAGNOSTICO, CANCELADA]
 * EM_DIAGNOSTICO -> [AGUARDANDO_APROVACAO, CANCELADA]
 * AGUARDANDO_APROVACAO -> [AGUARDANDO_PECA, EM_EXECUCAO, CANCELADA]
 * AGUARDANDO_PECA -> [EM_EXECUCAO, CANCELADA]
 * EM_EXECUCAO -> [CONCLUIDA, CANCELADA]
 * CONCLUIDA -> [ENTREGUE, CANCELADA]
 * ENTREGUE -> []
 * CANCELADA -> []
 */
const TRANSICOES_PERMITIDAS: Record<StatusOS, StatusOS[]> = {
  ABERTA: ['EM_DIAGNOSTICO', 'CANCELADA'],
  EM_DIAGNOSTICO: ['AGUARDANDO_APROVACAO', 'CANCELADA'],
  AGUARDANDO_APROVACAO: ['AGUARDANDO_PECA', 'EM_EXECUCAO', 'CANCELADA'],
  AGUARDANDO_PECA: ['EM_EXECUCAO', 'CANCELADA'],
  EM_EXECUCAO: ['CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: ['ENTREGUE', 'CANCELADA'],
  ENTREGUE: [],
  CANCELADA: [],
};

export function validarTransicaoStatus(
  statusAtual: StatusOS,
  novoStatus: StatusOS
): boolean {
  const permitidos = TRANSICOES_PERMITIDAS[statusAtual];
  if (!permitidos) return false;
  return permitidos.includes(novoStatus);
}

// =============================================================================
// EVENTO
// =============================================================================

export const createEventoSchema = z.object({
  osId: z.number().int().positive('ID da OS e obrigatorio'),
  usuarioId: z.number().int().positive('ID do usuario e obrigatorio'),
  descricao: z.string().min(1, 'Descricao e obrigatoria'),
});

// =============================================================================
// ITEM OS
// =============================================================================

const TIPO_ITEM = ['SERVICO', 'PECA'] as const;

export const createItemOSSchema = z.object({
  osId: z.number().int().positive('ID da OS e obrigatorio'),
  tipoItem: z.enum(TIPO_ITEM, {
    message: 'Tipo de item deve ser SERVICO ou PECA',
  }),
  referenciaId: z.number().int().min(0).default(0),
  descricao: z.string().min(1, 'Descricao e obrigatoria'),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  valorUnitario: z.number().min(0, 'Valor unitario nao pode ser negativo'),
  valorTotal: z.number().min(0, 'Valor total nao pode ser negativo'),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================

export type CreateOSInput = z.infer<typeof createOSSchema>;
export type UpdateOSInput = z.infer<typeof updateOSSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type CreateItemOSInput = z.infer<typeof createItemOSSchema>;
