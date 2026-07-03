/**
 * OS.Tech - Servico de Equipamento
 * Regras de negocio para a entidade Equipamento.
 */

import { EquipamentoRepository } from '../database/repositories/equipment.repository';
import { createEquipmentSchema, updateEquipmentSchema } from '../validators/equipment.validator';
import { gerarEtiqueta } from './etiqueta.service';
import type { CreateEquipamentoDTO, UpdateEquipamentoDTO } from '@shared/types/entities.types';

export class EquipamentoService {
  private repository = new EquipamentoRepository();

  async list() {
    return this.repository.findMany();
  }

  async getById(id: number) {
    const equipamento = await this.repository.findById(id);
    if (!equipamento) throw new Error('Equipamento nao encontrado');
    return equipamento;
  }

  async findByEtiqueta(etiqueta: string) {
    const equipamento = await this.repository.findByEtiqueta(etiqueta);
    if (!equipamento) throw new Error('Equipamento nao encontrado');
    return equipamento;
  }

  async listByCliente(clienteId: number) {
    return this.repository.findByClienteId(clienteId);
  }

  async create(data: Omit<CreateEquipamentoDTO, 'etiqueta'>) {
    const createNoEtiqueta = createEquipmentSchema.omit({ etiqueta: true });
    const validated = createNoEtiqueta.parse(data);
    const etiqueta = await gerarEtiqueta();
    return this.repository.create({ ...validated, etiqueta });
  }

  async update(id: number, data: UpdateEquipamentoDTO) {
    await this.getById(id);
    const validated = updateEquipmentSchema.parse(data);
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
