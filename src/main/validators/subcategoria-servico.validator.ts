import { z } from 'zod';

export const createSubcategoriaServicoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  categoriaId: z.number().min(1, 'Categoria e obrigatoria'),
});

export const updateSubcategoriaServicoSchema = createSubcategoriaServicoSchema.partial().extend({
  ativo: z.boolean().optional(),
  categoriaId: z.number().optional(),
});

export type CreateSubcategoriaServicoInput = z.infer<typeof createSubcategoriaServicoSchema>;
export type UpdateSubcategoriaServicoInput = z.infer<typeof updateSubcategoriaServicoSchema>;
