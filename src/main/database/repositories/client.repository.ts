/**
 * OS.Tech - Repositorio de Cliente
 * Operacoes de acesso a dados para a entidade Cliente.
 */

import { prisma } from '../connection';
import type { CreateClienteDTO, UpdateClienteDTO } from '@shared/types/entities.types';

export class ClienteRepository {
  async findMany() {
    return prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findAll() {
    return prisma.cliente.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.cliente.findUnique({
      where: { id },
      include: { contatos: { where: { ativo: true }, orderBy: { nome: 'asc' } } },
    });
  }

  async findByCpfCnpj(cpfCnpj: string) {
    return prisma.cliente.findUnique({ where: { cpfCnpj } });
  }

  async create(data: CreateClienteDTO) {
    return prisma.cliente.create({ data });
  }

  async update(id: number, data: UpdateClienteDTO) {
    return prisma.cliente.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.cliente.delete({ where: { id } });
  }

  async count() {
    return prisma.cliente.count({ where: { ativo: true } });
  }
}
