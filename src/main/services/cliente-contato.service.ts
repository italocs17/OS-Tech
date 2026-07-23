/**
 * OS.Tech - Servico de ClienteContato
 * Regras de negocio para contatos de clientes.
 */

import { ClienteContatoRepository } from '../database/repositories/cliente-contato.repository';
import { registrar } from './log.service';
import type { CreateClienteContatoDTO, UpdateClienteContatoDTO } from '@shared/types/entities.types';

export class ClienteContatoService {
  private repository = new ClienteContatoRepository();

  async listByCliente(clienteId: number) {
    return this.repository.findMany(clienteId);
  }

  async listAllByCliente(clienteId: number) {
    return this.repository.findAll(clienteId);
  }

  async getById(id: number) {
    const contato = await this.repository.findById(id);
    if (!contato) throw new Error('Contato nao encontrado');
    return contato;
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async create(data: CreateClienteContatoDTO) {
    return this.repository.create(data);
  }

  async update(id: number, data: UpdateClienteContatoDTO) {
    const atual = await this.getById(id);
    const resultado = await this.repository.update(id, data);
    if (data.ativo !== undefined && data.ativo !== atual.ativo) {
      await registrar({
        nivel: 'INFO',
        categoria: 'CLIENTE',
        acao: 'TOGGLE_ATIVO',
        descricao: `Contato "${atual.nome}" ${data.ativo ? 'ativado' : 'desativado'}`,
        dadosContexto: { entidade: 'CLIENTE_CONTATO', entidadeId: id, ativo: data.ativo },
      });
    }
    return resultado;
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
