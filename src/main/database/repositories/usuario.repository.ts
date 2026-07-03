import { prisma } from '../connection';
import type { CreateUsuarioDTO } from '@shared/types/entities.types';

export class UsuarioRepository {
  async findMany() {
    return prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.usuario.findUnique({ where: { id } });
  }

  async findByLogin(login: string) {
    return prisma.usuario.findUnique({ where: { login } });
  }

  async create(data: CreateUsuarioDTO) {
    return prisma.usuario.create({ data });
  }

  async update(id: number, data: Record<string, unknown>) {
    return prisma.usuario.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.usuario.delete({ where: { id } });
  }

  async count() {
    return prisma.usuario.count({ where: { ativo: true } });
  }
}
