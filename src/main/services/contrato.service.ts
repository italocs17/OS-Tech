import { ContratoRepository } from '../database/repositories/contrato.repository';
import { createContratoSchema, updateContratoSchema } from '../validators/contrato.validator';
import { registrar } from './log.service';

export class ContratoService {
  private repository = new ContratoRepository();

  async list() {
    return this.repository.findMany();
  }

  async listAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const contrato = await this.repository.findById(id);
    if (!contrato) throw new Error('Contrato nao encontrado');
    return contrato;
  }

  async listByCliente(clienteId: number) {
    return this.repository.findByClienteId(clienteId);
  }

  async create(data: {
    clienteId: number;
    numero: string;
    descricao?: string;
    dataInicio: Date;
    dataFim: Date;
    observacoes?: string;
    status?: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO';
  }) {
    const validated = createContratoSchema.parse(data);
    if (validated.dataInicio > validated.dataFim) {
      throw new Error('Data de inicio deve ser anterior a data de fim');
    }
    const contrato = await this.repository.create({
      ...validated,
      dataInicio: validated.dataInicio,
      dataFim: validated.dataFim,
    });
    await registrar({
      nivel: 'INFO',
      categoria: 'CLIENTE',
      acao: 'CRIAR',
      descricao: `Contrato "${validated.numero}" criado para cliente ID ${validated.clienteId}`,
      dadosContexto: { entidade: 'CONTRATO', entidadeId: contrato.id, numero: validated.numero },
    });
    return contrato;
  }

  async update(id: number, data: Record<string, unknown>) {
    const atual = await this.getById(id);
    const validated = updateContratoSchema.parse(data);
    if (validated.dataInicio && validated.dataFim && validated.dataInicio > validated.dataFim) {
      throw new Error('Data de inicio deve ser anterior a data de fim');
    }
    const resultado = await this.repository.update(id, {
      ...validated,
      dataInicio: validated.dataInicio as Date | undefined,
      dataFim: validated.dataFim as Date | undefined,
    });
    if (validated.ativo !== undefined && validated.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'SISTEMA',
        acao: 'TOGGLE_ATIVO',
        descricao: `Contrato "${atual.numero}" ${validated.ativo ? 'ativado' : 'desativado'}`,
        dadosContexto: { entidade: 'CONTRATO', entidadeId: id, ativo: validated.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    const contrato = await this.getById(id);
    await this.repository.delete(id);
    await registrar({
      nivel: 'INFO',
      categoria: 'CLIENTE',
      acao: 'EXCLUIR',
      descricao: `Contrato "${contrato.numero}" excluido`,
      dadosContexto: { entidade: 'CONTRATO', entidadeId: id },
    });
  }
}
