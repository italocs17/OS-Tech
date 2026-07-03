import { z } from 'zod';

export const createPecaSchema = z.object({
  descricao: z.string().min(2, 'Descricao deve ter no minimo 2 caracteres'),
  fabricante: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  valorReferencia: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.number().min(0, 'Valor nao pode ser negativo').optional()
  ),
});

export const updatePecaSchema = createPecaSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type CreatePecaInput = z.infer<typeof createPecaSchema>;
export type UpdatePecaInput = z.infer<typeof updatePecaSchema>;
