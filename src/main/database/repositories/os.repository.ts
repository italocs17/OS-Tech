/**
 * OS.Tech - Repositorio de Ordem de Servico
 * Operacoes de acesso a dados para a entidade OrdemServico.
 */

import { prisma } from '../connection';
import type { CreateOrdemServicoDTO, UpdateOrdemServicoDTO, TipoDesconto } from '@shared/types/entities.types';

export class OrdemServicoRepository {
  async findMany() {
    return prisma.ordemServico.findMany({
      include: {
        cliente: true,
        equipamento: true,
        eventos: { orderBy: { dataHora: 'asc' } },
        itens: true,
      },
      orderBy: { dataEntrada: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        equipamento: true,
        contato: true,
        eventos: { orderBy: { dataHora: 'asc' } },
        itens: true,
        inventarios: true,
        emailSolicitacao: {
          include: { contato: true },
          orderBy: { dataRecebimento: 'asc' },
          take: 1,
        },
      },
    });
  }

  async findByNumeroOS(numeroOS: string) {
    return prisma.ordemServico.findUnique({
      where: { numeroOS },
      include: {
        cliente: true,
        equipamento: true,
        eventos: { orderBy: { dataHora: 'asc' } },
        itens: true,
      },
    });
  }

  async findByClienteId(clienteId: number) {
    return prisma.ordemServico.findMany({
      where: { clienteId },
      include: {
        equipamento: true,
        eventos: { orderBy: { dataHora: 'asc' } },
      },
      orderBy: { dataEntrada: 'asc' },
    });
  }

  async findByEquipamentoId(equipamentoId: number) {
    return prisma.ordemServico.findMany({
      where: { equipamentoId },
      include: {
        cliente: true,
        eventos: { orderBy: { dataHora: 'asc' } },
      },
      orderBy: { dataEntrada: 'asc' },
    });
  }

  async findByDateRange(dataInicio: Date, dataFim: Date) {
    return prisma.ordemServico.findMany({
      where: {
        dataEntrada: { gte: dataInicio, lte: dataFim },
      },
      include: {
        cliente: true,
        equipamento: true,
      },
      orderBy: { dataEntrada: 'asc' },
    });
  }

  async findByStatus(status: string) {
    return prisma.ordemServico.findMany({
      where: { status: status as any },
      include: {
        cliente: true,
        equipamento: true,
      },
      orderBy: { dataEntrada: 'asc' },
    });
  }

  async create(data: CreateOrdemServicoDTO, numeroOS: string) {
    return prisma.ordemServico.create({
      data: {
        ...data,
        numeroOS,
      },
    });
  }

  async update(id: number, data: Record<string, unknown>) {
    return prisma.ordemServico.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return prisma.ordemServico.delete({
      where: { id },
    });
  }

  async count() {
    return prisma.ordemServico.count();
  }

  async countByStatus() {
    return prisma.ordemServico.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }
}
