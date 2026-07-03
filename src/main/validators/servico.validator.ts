import { z } from 'zod';

export const createServicoSchema = z.object({
  descricao: z.string().min(2, 'Descricao deve ter no minimo 2 caracteres'),
  valorPadrao: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.number().min(0, 'Valor nao pode ser negativo').optional()
  ),
});

export const updateServicoSchema = createServicoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>;
