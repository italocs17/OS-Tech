import { prisma } from '../connection';
import type { CreatePecaDTO, UpdatePecaDTO } from '@shared/types/entities.types';

export class PecaRepository {
  async findMany() {
    return prisma.peca.findMany({
      where: { ativo: true },
      orderBy: { descricao: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.peca.findUnique({ where: { id } });
  }

  async create(data: CreatePecaDTO) {
    return prisma.peca.create({ data });
  }

  async update(id: number, data: UpdatePecaDTO) {
    return prisma.peca.update({ where: { id }, data });
  }

  async findAll() {
    return prisma.peca.findMany({ orderBy: { descricao: 'asc' } });
  }
}
