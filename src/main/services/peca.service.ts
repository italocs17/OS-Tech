import { PecaRepository } from '../database/repositories/peca.repository';
import { createPecaSchema, updatePecaSchema } from '../validators/peca.validator';
import type { CreatePecaDTO, UpdatePecaDTO } from '@shared/types/entities.types';

export class PecaService {
  private repository = new PecaRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const peca = await this.repository.findById(id);
    if (!peca) throw new Error('Peca nao encontrada');
    return peca;
  }

  async create(data: CreatePecaDTO) {
    const validated = createPecaSchema.parse(data);
    return this.repository.create(validated);
  }

  async update(id: number, data: UpdatePecaDTO) {
    await this.getById(id);
    const validated = updatePecaSchema.parse(data);
    return this.repository.update(id, validated);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
