import { ServicoRepository } from '../database/repositories/servico.repository';
import { createServicoSchema, updateServicoSchema } from '../validators/servico.validator';
import { registrar } from './log.service';
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
    const atual = await this.getById(id);
    const validated = updateServicoSchema.parse(data);
    const resultado = await this.repository.update(id, validated);
    if (validated.ativo !== undefined && validated.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'SISTEMA',
        acao: 'TOGGLE_ATIVO',
        descricao: `Servico "${atual.nome}" ${validated.ativo ? 'ativado' : 'desativado'}`,
        dadosContexto: { entidade: 'SERVICO', entidadeId: id, ativo: validated.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }
}
