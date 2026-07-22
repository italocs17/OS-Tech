/**
 * OS.Tech - Servico de Cliente
 * Regras de negocio para a entidade Cliente.
 */

import { prisma } from '../database/connection';
import { ClienteRepository } from '../database/repositories/client.repository';
import { createClientSchema, updateClientSchema } from '../validators/client.validator';
import type { CreateClienteDTO, UpdateClienteDTO } from '@shared/types/entities.types';

interface CreateClienteComContatosDTO extends CreateClienteDTO {
  contatos?: Array<{ nome: string; email: string; telefone?: string }>;
}

export class ClienteService {
  private repository = new ClienteRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente nao encontrado');
    return cliente;
  }

  async create(data: CreateClienteComContatosDTO) {
    const { contatos, ...clienteData } = data;
    const validated = createClientSchema.parse(clienteData);
    const existing = await this.repository.findByCpfCnpj(validated.cpfCnpj);
    if (existing) throw new Error('CPF/CNPJ ja cadastrado');

    if (contatos && contatos.length > 0) {
      return prisma.$transaction(async (tx: any) => {
        const cliente = await tx.cliente.create({ data: validated });
        let hasDefault = false;
        for (const contato of contatos) {
          if (contato.nome?.trim() && contato.email?.trim()) {
            const isFirst = !hasDefault;
            hasDefault = true;
            await tx.clienteContato.create({
              data: {
                clienteId: cliente.id,
                nome: contato.nome.trim(),
                email: contato.email.trim().toLowerCase(),
                telefone: contato.telefone?.trim() || null,
                isPadrao: isFirst,
              },
            });
          }
        }
        return cliente;
      });
    }

    if (validated.email?.trim()) {
      return prisma.$transaction(async (tx: any) => {
        const cliente = await tx.cliente.create({ data: validated });
        await tx.clienteContato.create({
          data: {
            clienteId: cliente.id,
            nome: validated.nome.trim(),
            email: validated.email!.trim().toLowerCase(),
            telefone: validated.telefone?.trim() || null,
            isPadrao: true,
          },
        });
        return cliente;
      });
    }

    return this.repository.create(validated);
  }

  async update(id: number, data: UpdateClienteDTO) {
    await this.getById(id);
    const validated = updateClientSchema.parse(data);
    return this.repository.update(id, validated);
  }

  async delete(id: number) {
    await this.getById(id);
    // Soft delete
    return this.repository.update(id, { ativo: false });
  }

  async count() {
    return this.repository.count();
  }

  async setContatoPadrao(clienteId: number, contatoId: number) {
    await prisma.$transaction(async (tx: any) => {
      await tx.clienteContato.updateMany({
        where: { clienteId, ativo: true },
        data: { isPadrao: false },
      });
      await tx.clienteContato.update({
        where: { id: contatoId },
        data: { isPadrao: true },
      });
    });
  }
}
