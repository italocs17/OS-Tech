import { prisma } from '../connection';

export class ContratoRepository {
  async findMany() {
    return prisma.contrato.findMany({
      where: { ativo: true },
      include: { cliente: true },
      orderBy: { dataFim: 'asc' },
    });
  }

  async findAll() {
    return prisma.contrato.findMany({
      include: { cliente: true },
      orderBy: { dataFim: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.contrato.findUnique({
      where: { id },
      include: { cliente: true },
    });
  }

  async findByClienteId(clienteId: number) {
    return prisma.contrato.findMany({
      where: { clienteId },
      orderBy: { dataFim: 'asc' },
    });
  }

  async create(data: {
    clienteId: number;
    numero: string;
    descricao?: string;
    dataInicio: Date;
    dataFim: Date;
    observacoes?: string;
    status?: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO';
  }) {
    return prisma.contrato.create({
      data,
      include: { cliente: true },
    });
  }

  async update(id: number, data: {
    numero?: string;
    descricao?: string;
    dataInicio?: Date;
    dataFim?: Date;
    observacoes?: string;
    status?: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO';
    ativo?: boolean;
  }) {
    return prisma.contrato.update({
      where: { id },
      data,
      include: { cliente: true },
    });
  }

  async delete(id: number) {
    return prisma.contrato.delete({ where: { id } });
  }
}
