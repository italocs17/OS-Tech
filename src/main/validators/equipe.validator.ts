import { z } from 'zod';

export const createEquipeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  categoriaIds: z.array(z.number()).optional(),
});

export const updateEquipeSchema = createEquipeSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type CreateEquipeInput = z.infer<typeof createEquipeSchema>;
export type UpdateEquipeInput = z.infer<typeof updateEquipeSchema>;
