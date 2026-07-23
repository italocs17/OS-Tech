import { EquipeRepository } from '../database/repositories/equipe.repository';
import { createEquipeSchema, updateEquipeSchema } from '../validators/equipe.validator';
import { registrar } from './log.service';
import type { CreateEquipeDTO, UpdateEquipeDTO } from '@shared/types/entities.types';

export class EquipeService {
  private repository = new EquipeRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const equipe = await this.repository.findById(id);
    if (!equipe) throw new Error('Equipe nao encontrada');
    return equipe;
  }

  async create(data: CreateEquipeDTO) {
    const validated = createEquipeSchema.parse(data);
    return this.repository.create(validated);
  }

  async update(id: number, data: UpdateEquipeDTO) {
    const atual = await this.getById(id);
    const validated = updateEquipeSchema.parse(data);
    const resultado = await this.repository.update(id, validated);
    if (validated.ativo !== undefined && validated.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'SISTEMA',
        acao: 'TOGGLE_ATIVO',
        descricao: `Equipe "${atual.nome}" ${validated.ativo ? 'ativada' : 'desativada'}`,
        dadosContexto: { entidade: 'EQUIPE', entidadeId: id, ativo: validated.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }

  async addUsuario(equipeId: number, usuarioId: number) {
    await this.getById(equipeId);
    return this.repository.addUsuario(equipeId, usuarioId);
  }

  async removeUsuario(equipeId: number, usuarioId: number) {
    await this.getById(equipeId);
    return this.repository.removeUsuario(equipeId, usuarioId);
  }

  async getEquipesByUsuario(usuarioId: number) {
    return this.repository.getEquipesByUsuario(usuarioId);
  }
}
