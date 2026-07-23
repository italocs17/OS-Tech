import { CategoriaServicoRepository } from '../database/repositories/categoria-servico.repository';
import { createCategoriaServicoSchema, updateCategoriaServicoSchema } from '../validators/categoria-servico.validator';
import { registrar } from './log.service';
import type { CreateCategoriaServicoDTO, UpdateCategoriaServicoDTO } from '@shared/types/entities.types';

export class CategoriaServicoService {
  private repository = new CategoriaServicoRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const categoria = await this.repository.findById(id);
    if (!categoria) throw new Error('Categoria nao encontrada');
    return categoria;
  }

  async create(data: CreateCategoriaServicoDTO) {
    const validated = createCategoriaServicoSchema.parse(data);
    return this.repository.create(validated);
  }

  async update(id: number, data: UpdateCategoriaServicoDTO) {
    const atual = await this.getById(id);
    const validated = updateCategoriaServicoSchema.parse(data);
    const resultado = await this.repository.update(id, validated);
    if (validated.ativo !== undefined && validated.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'SISTEMA',
        acao: 'TOGGLE_ATIVO',
        descricao: `Categoria "${atual.nome}" ${validated.ativo ? 'ativada' : 'desativada'}`,
        dadosContexto: { entidade: 'CATEGORIA_SERVICO', entidadeId: id, ativo: validated.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
