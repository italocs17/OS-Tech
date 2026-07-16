import { prisma } from '../connection';
import type { CreateCategoriaServicoDTO, UpdateCategoriaServicoDTO } from '@shared/types/entities.types';

export class CategoriaServicoRepository {
  async findMany() {
    return prisma.categoriaServico.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.categoriaServico.findUnique({ where: { id } });
  }

  async create(data: CreateCategoriaServicoDTO) {
    return prisma.categoriaServico.create({ data });
  }

  async update(id: number, data: UpdateCategoriaServicoDTO) {
    return prisma.categoriaServico.update({ where: { id }, data });
  }

  async findAll() {
    return prisma.categoriaServico.findMany({ orderBy: { nome: 'asc' } });
  }
}
