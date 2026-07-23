import { z } from 'zod';

export const createContratoSchema = z.object({
  clienteId: z.number().int().positive('Cliente e obrigatorio'),
  numero: z.string().min(1, 'Numero e obrigatorio'),
  descricao: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  dataInicio: z.coerce.date({ message: 'Data de inicio e obrigatoria' }),
  dataFim: z.coerce.date({ message: 'Data de fim e obrigatoria' }),
  observacoes: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().optional()
  ),
  status: z.enum(['ATIVO', 'SUSPENSO', 'ENCERRADO']).optional(),
});

export const updateContratoSchema = createContratoSchema
  .omit({ clienteId: true })
  .extend({
    ativo: z.boolean().optional(),
  });

export type CreateContratoInput = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput = z.infer<typeof updateContratoSchema>;
