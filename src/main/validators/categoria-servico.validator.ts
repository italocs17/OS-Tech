import { z } from 'zod';

export const createCategoriaServicoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
});

export const updateCategoriaServicoSchema = createCategoriaServicoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type CreateCategoriaServicoInput = z.infer<typeof createCategoriaServicoSchema>;
export type UpdateCategoriaServicoInput = z.infer<typeof updateCategoriaServicoSchema>;
