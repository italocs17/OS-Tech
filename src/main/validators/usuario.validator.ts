/**
 * OS.Tech - Validador de dados de Usuario
 * Schemas Zod para validacao de entrada de dados de usuarios.
 */

import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  login: z.string().min(3, 'Login deve ter no minimo 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  perfil: z.enum(['TECNICO', 'RECEPCIONISTA', 'PROPRIETARIO', 'GESTOR']),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').optional(),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres').optional(),
  perfil: z.enum(['TECNICO', 'RECEPCIONISTA', 'PROPRIETARIO', 'GESTOR']).optional(),
  ativo: z.boolean().optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Login e obrigatorio'),
  senha: z.string().min(1, 'Senha e obrigatoria'),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
