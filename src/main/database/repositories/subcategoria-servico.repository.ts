import { prisma } from '../connection';
import type { CreateSubcategoriaServicoDTO, UpdateSubcategoriaServicoDTO } from '@shared/types/entities.types';

export class SubcategoriaServicoRepository {
  async findMany() {
    return prisma.subcategoriaServico.findMany({
      where: { ativo: true },
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.subcategoriaServico.findUnique({
      where: { id },
      include: { categoria: true },
    });
  }

  async findByCategoria(categoriaId: number) {
    return prisma.subcategoriaServico.findMany({
      where: { categoriaId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: CreateSubcategoriaServicoDTO) {
    return prisma.subcategoriaServico.create({
      data,
      include: { categoria: true },
    });
  }

  async update(id: number, data: UpdateSubcategoriaServicoDTO) {
    return prisma.subcategoriaServico.update({
      where: { id },
      data,
      include: { categoria: true },
    });
  }

  async findAll() {
    return prisma.subcategoriaServico.findMany({
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }
}
