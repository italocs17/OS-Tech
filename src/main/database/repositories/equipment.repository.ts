/**
 * OS.Tech - Repositorio de Equipamento
 * Operacoes de acesso a dados para a entidade Equipamento.
 */

import { prisma } from '../connection';
import type { CreateEquipamentoDTO, UpdateEquipamentoDTO } from '@shared/types/entities.types';

export class EquipamentoRepository {
  async findMany() {
    return prisma.equipamento.findMany({
      where: { ativo: true },
      include: { cliente: true },
      orderBy: { dataCadastro: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.equipamento.findUnique({
      where: { id },
      include: { cliente: true },
    });
  }

  async findByEtiqueta(etiqueta: string) {
    return prisma.equipamento.findUnique({
      where: { etiqueta },
      include: { cliente: true },
    });
  }

  async findByClienteId(clienteId: number) {
    return prisma.equipamento.findMany({
      where: { clienteId, ativo: true },
    });
  }

  async create(data: CreateEquipamentoDTO) {
    return prisma.equipamento.create({ data });
  }

  async update(id: number, data: UpdateEquipamentoDTO) {
    return prisma.equipamento.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.equipamento.delete({ where: { id } });
  }

  async count() {
    return prisma.equipamento.count({ where: { ativo: true } });
  }
}
