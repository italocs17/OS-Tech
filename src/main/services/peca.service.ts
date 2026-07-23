import { PecaRepository } from '../database/repositories/peca.repository';
import { createPecaSchema, updatePecaSchema } from '../validators/peca.validator';
import { registrar } from './log.service';
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
    const atual = await this.getById(id);
    const validated = updatePecaSchema.parse(data);
    const resultado = await this.repository.update(id, validated);
    if (validated.ativo !== undefined && validated.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'SISTEMA',
        acao: 'TOGGLE_ATIVO',
        descricao: `Peca "${atual.nome}" ${validated.ativo ? 'ativada' : 'desativada'}`,
        dadosContexto: { entidade: 'PECA', entidadeId: id, ativo: validated.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
