import { prisma } from '../connection';
import type { CreateServicoDTO, UpdateServicoDTO } from '@shared/types/entities.types';

export class ServicoRepository {
  async findMany() {
    return prisma.servico.findMany({
      where: { ativo: true },
      include: { categoria: true, subcategoria: true },
      orderBy: { descricao: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.servico.findUnique({
      where: { id },
      include: { categoria: true, subcategoria: true },
    });
  }

  async create(data: CreateServicoDTO) {
    return prisma.servico.create({
      data,
      include: { categoria: true, subcategoria: true },
    });
  }

  async update(id: number, data: UpdateServicoDTO) {
    return prisma.servico.update({
      where: { id },
      data,
      include: { categoria: true, subcategoria: true },
    });
  }

  async findAll() {
    return prisma.servico.findMany({
      include: { categoria: true, subcategoria: true },
      orderBy: { descricao: 'asc' },
    });
  }
}
