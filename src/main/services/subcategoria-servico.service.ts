import { SubcategoriaServicoRepository } from '../database/repositories/subcategoria-servico.repository';
import { createSubcategoriaServicoSchema, updateSubcategoriaServicoSchema } from '../validators/subcategoria-servico.validator';
import type { CreateSubcategoriaServicoDTO, UpdateSubcategoriaServicoDTO } from '@shared/types/entities.types';

export class SubcategoriaServicoService {
  private repository = new SubcategoriaServicoRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const subcategoria = await this.repository.findById(id);
    if (!subcategoria) throw new Error('Subcategoria nao encontrada');
    return subcategoria;
  }

  async getByCategoria(categoriaId: number) {
    return this.repository.findByCategoria(categoriaId);
  }

  async create(data: CreateSubcategoriaServicoDTO) {
    const validated = createSubcategoriaServicoSchema.parse(data);
    return this.repository.create(validated);
  }

  async update(id: number, data: UpdateSubcategoriaServicoDTO) {
    await this.getById(id);
    const validated = updateSubcategoriaServicoSchema.parse(data);
    return this.repository.update(id, validated);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
