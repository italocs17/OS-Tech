/**
 * OS.Tech - Servico de Cliente
 * Regras de negocio para a entidade Cliente.
 */

import { ClienteRepository } from '../database/repositories/client.repository';
import { createClientSchema, updateClientSchema } from '../validators/client.validator';
import type { CreateClienteDTO, UpdateClienteDTO } from '@shared/types/entities.types';

export class ClienteService {
  private repository = new ClienteRepository();

  async list() {
    return this.repository.findMany();
  }

  async getById(id: number) {
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente nao encontrado');
    return cliente;
  }

  async create(data: CreateClienteDTO) {
    const validated = createClientSchema.parse(data);
    const existing = await this.repository.findByCpf(validated.cpf);
    if (existing) throw new Error('CPF ja cadastrado');
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
}
