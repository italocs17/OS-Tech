import { prisma } from '../connection';
import type { CreateServicoDTO, UpdateServicoDTO } from '@shared/types/entities.types';

export class ServicoRepository {
  async findMany() {
    return prisma.servico.findMany({
      where: { ativo: true },
      orderBy: { descricao: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.servico.findUnique({ where: { id } });
  }

  async create(data: CreateServicoDTO) {
    return prisma.servico.create({ data });
  }

  async update(id: number, data: UpdateServicoDTO) {
    return prisma.servico.update({ where: { id }, data });
  }

  async findAll() {
    return prisma.servico.findMany({ orderBy: { descricao: 'asc' } });
  }
}
