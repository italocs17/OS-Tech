/**
 * OS.Tech - Validador de dados de Equipamento
 * Schemas Zod para validacao de entrada de dados de equipamentos.
 */

import { z } from 'zod';

export const createEquipmentSchema = z.object({
  clienteId: z.number().int().positive('ID do cliente e obrigatorio'),
  etiqueta: z
    .string()
    .length(5, 'Etiqueta deve ter exatamente 5 caracteres')
    .regex(
      /^[A-Z0-9]{5}$/,
      'Etiqueta deve conter apenas letras maiusculas e numeros'
    )
    .optional(), // Gerada automaticamente pelo service se não fornecida
  tipo: z.string().min(1, 'Tipo e obrigatorio'),
  marca: z.string().min(1, 'Marca e obrigatoria'),
  modelo: z.string().min(1, 'Modelo e obrigatorio'),
  numeroSerie: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
});

export const updateEquipmentSchema = z.object({
  tipo: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  modelo: z.string().min(1).optional(),
  numeroSerie: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  ativo: z.boolean().optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
