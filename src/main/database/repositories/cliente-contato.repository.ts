import { prisma } from '../connection';
import type { CreateClienteContatoDTO, UpdateClienteContatoDTO } from '@shared/types/entities.types';

export class ClienteContatoRepository {
  async findMany(clienteId: number) {
    return prisma.clienteContato.findMany({
      where: { clienteId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findAll(clienteId: number) {
    return prisma.clienteContato.findMany({
      where: { clienteId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.clienteContato.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.clienteContato.findFirst({
      where: { email, ativo: true },
      include: { cliente: true },
    });
  }

  async create(data: CreateClienteContatoDTO) {
    return prisma.clienteContato.create({ data });
  }

  async update(id: number, data: UpdateClienteContatoDTO) {
    return prisma.clienteContato.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.clienteContato.update({ where: { id }, data: { ativo: false } });
  }
}
