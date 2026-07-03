/**
 * OS.Tech - Repositorio de Inventario
 * Operacoes de acesso a dados para a entidade Inventario.
 */

import { prisma } from '../connection';
import type { CreateInventarioDTO } from '@shared/types/entities.types';

export class InventarioRepository {
  async findByOSId(osId: number) {
    return prisma.inventario.findMany({
      where: { osId },
      orderBy: { dataCaptura: 'asc' },
    });
  }

  async findLatestByOSId(osId: number) {
    return prisma.inventario.findFirst({
      where: { osId },
      orderBy: { dataCaptura: 'desc' },
    });
  }

  async findByEquipamento(equipamentoId: number) {
    return prisma.inventario.findMany({
      where: { os: { equipamentoId } },
      orderBy: [{ os: { dataEntrada: 'asc' } }, { dataCaptura: 'asc' }],
      include: {
        os: { select: { id: true, numeroOS: true, status: true } },
      },
    });
  }

  async create(data: CreateInventarioDTO) {
    return prisma.inventario.create({
      data: {
        osId: data.osId,
        tipo: data.tipo ?? 'MANUAL',
        jsonCompleto: JSON.stringify(data.jsonCompleto),
      },
    });
  }

  async update(id: number, data: CreateInventarioDTO) {
    return prisma.inventario.update({
      where: { id },
      data: {
        jsonCompleto: JSON.stringify(data.jsonCompleto),
      },
    });
  }

  async delete(id: number) {
    return prisma.inventario.delete({ where: { id } });
  }

  async count() {
    return prisma.inventario.count();
  }
}
