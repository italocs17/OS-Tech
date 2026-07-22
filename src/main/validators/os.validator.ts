/**
 * OS.Tech - Validador de dados de Ordem de Servico
 * Schemas Zod para validacao de entrada de dados de OS, Eventos e Itens.
 */

import { z } from 'zod';
import type { StatusOS, StatusLogistico } from '@shared/types/entities.types';

// =============================================================================
// OS
// =============================================================================

export const createOSSchema = z.object({
  clienteId: z.number().int().positive('ID do cliente e obrigatorio'),
  equipamentoId: z.number().int().positive().optional(),
  contatoId: z.number().int().positive().optional(),
  categoriaServicoId: z.number().int().positive().optional(),
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
  categoriaServicoId: z.number().int().positive().nullable().optional(),
  desconto: z.number().min(0).nullable().optional(),
  descontoTipo: z.enum(['ABSOLUTO', 'PERCENTUAL']).optional(),
  formaPagamento: z.enum(['CONTRATO', 'PIX', 'ESPECIE', 'DEBITO', 'CREDITO_A_VISTA', 'CREDITO_PARCELADO']).optional(),
});

// =============================================================================
// STATUS TECNICO
// =============================================================================

const STATUS_OS: StatusOS[] = [
  'AGUARDANDO_ATENDIMENTO',
  'EM_ATENDIMENTO',
  'PAUSADO',
  'CONCLUIDA',
  'CANCELADA',
];

export const changeStatusSchema = z.object({
  status: z.enum(STATUS_OS, {
    message: 'Status invalido',
  }),
});

/**
 * Mapa de transicoes permitidas de status tecnico.
 * AGUARDANDO_ATENDIMENTO -> [EM_ATENDIMENTO, CANCELADA]
 * EM_ATENDIMENTO -> [PAUSADO, CONCLUIDA, CANCELADA]
 * PAUSADO -> [EM_ATENDIMENTO, CANCELADA]
 * CONCLUIDA -> []
 * CANCELADA -> []
 */
const TRANSICOES_PERMITIDAS: Record<StatusOS, StatusOS[]> = {
  AGUARDANDO_ATENDIMENTO: ['EM_ATENDIMENTO', 'CANCELADA'],
  EM_ATENDIMENTO: ['PAUSADO', 'CONCLUIDA', 'CANCELADA'],
  PAUSADO: ['EM_ATENDIMENTO', 'CANCELADA'],
  CONCLUIDA: [],
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
// STATUS LOGISTICO
// =============================================================================

const STATUS_LOGISTICO: StatusLogistico[] = [
  'PENDENTE',
  'RECEBIDO',
  'ENTREGUE',
];

export const changeStatusLogisticoSchema = z.object({
  status: z.enum(STATUS_LOGISTICO, {
    message: 'Status logistico invalido',
  }),
});

/**
 * Mapa de transicoes permitidas de status logistico.
 * PENDENTE -> [RECEBIDO]
 * RECEBIDO -> [ENTREGUE]
 * ENTREGUE -> []
 */
const TRANSICOES_LOGISTICAS: Record<StatusLogistico, StatusLogistico[]> = {
  PENDENTE: ['RECEBIDO'],
  RECEBIDO: ['ENTREGUE'],
  ENTREGUE: [],
};

export function validarTransicaoLogistica(
  statusAtual: StatusLogistico,
  novoStatus: StatusLogistico
): boolean {
  const permitidos = TRANSICOES_LOGISTICAS[statusAtual];
  if (!permitidos) return false;
  return permitidos.includes(novoStatus);
}

// =============================================================================
// PAUSAR / RETOMAR
// =============================================================================

export const pausarRetomarSchema = z.object({
  justificativa: z.string().min(3, 'Justificativa e obrigatoria (minimo 3 caracteres)'),
});

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
export type ChangeStatusLogisticoInput = z.infer<typeof changeStatusLogisticoSchema>;
export type PausarRetomarInput = z.infer<typeof pausarRetomarSchema>;
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type CreateItemOSInput = z.infer<typeof createItemOSSchema>;
