import { prisma } from '../connection';
import type { CreateEquipeDTO, UpdateEquipeDTO } from '@shared/types/entities.types';

export class EquipeRepository {
  async findMany() {
    return prisma.equipe.findMany({
      where: { ativo: true },
      include: {
        categorias: { include: { categoria: true } },
        usuarios: { include: { usuario: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.equipe.findUnique({
      where: { id },
      include: {
        categorias: { include: { categoria: true } },
        usuarios: { include: { usuario: true } },
      },
    });
  }

  async create(data: CreateEquipeDTO) {
    const { categoriaIds, ...equipeData } = data;
    return prisma.equipe.create({
      data: {
        ...equipeData,
        categorias: categoriaIds?.length
          ? { create: categoriaIds.map((categoriaId) => ({ categoriaId })) }
          : undefined,
      },
      include: {
        categorias: { include: { categoria: true } },
        usuarios: { include: { usuario: true } },
      },
    });
  }

  async update(id: number, data: UpdateEquipeDTO) {
    const { categoriaIds, ...equipeData } = data;
    if (categoriaIds !== undefined) {
      await prisma.equipeCategoria.deleteMany({ where: { equipeId: id } });
      if (categoriaIds.length > 0) {
        await prisma.equipeCategoria.createMany({
          data: categoriaIds.map((categoriaId) => ({ equipeId: id, categoriaId })),
        });
      }
    }
    return prisma.equipe.update({
      where: { id },
      data: equipeData,
      include: {
        categorias: { include: { categoria: true } },
        usuarios: { include: { usuario: true } },
      },
    });
  }

  async findAll() {
    return prisma.equipe.findMany({
      include: {
        categorias: { include: { categoria: true } },
        usuarios: { include: { usuario: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async addUsuario(equipeId: number, usuarioId: number) {
    return prisma.usuarioEquipe.create({
      data: { equipeId, usuarioId },
    });
  }

  async removeUsuario(equipeId: number, usuarioId: number) {
    return prisma.usuarioEquipe.deleteMany({
      where: { equipeId, usuarioId },
    });
  }

  async getEquipesByUsuario(usuarioId: number) {
    return prisma.usuarioEquipe.findMany({
      where: { usuarioId },
      include: {
        equipe: {
          include: {
            categorias: { include: { categoria: true } },
          },
        },
      },
    });
  }
}
