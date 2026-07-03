import { ServicoRepository } from '../database/repositories/servico.repository';
import { createServicoSchema, updateServicoSchema } from '../validators/servico.validator';
import type { CreateServicoDTO, UpdateServicoDTO } from '@shared/types/entities.types';

export class ServicoService {
  private repository = new ServicoRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const servico = await this.repository.findById(id);
    if (!servico) throw new Error('Servico nao encontrado');
    return servico;
  }

  async create(data: CreateServicoDTO) {
    const validated = createServicoSchema.parse(data);
    return this.repository.create(validated);
  }

  async update(id: number, data: UpdateServicoDTO) {
    await this.getById(id);
    const validated = updateServicoSchema.parse(data);
    return this.repository.update(id, validated);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
