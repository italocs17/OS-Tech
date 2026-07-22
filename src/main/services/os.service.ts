/**
 * OS.Tech - Servico de Ordem de Servico
 * Regras de negocio para a entidade OrdemServico, Eventos e Itens.
 */

import { OrdemServicoRepository } from '../database/repositories/os.repository';
import { EventoOSRepository } from '../database/repositories/evento.repository';
import { ItemOSRepository } from '../database/repositories/item-os.repository';
import { proximoNumeroOS } from './numero-os.service';
import { registrar } from './log.service';
import { EmailNotificationService } from './email-notification.service';
import {
  createOSSchema,
  updateOSSchema,
  changeStatusSchema,
  changeStatusLogisticoSchema,
  pausarRetomarSchema,
  createEventoSchema,
  createItemOSSchema,
  validarTransicaoStatus,
  validarTransicaoLogistica,
} from '../validators/os.validator';
import type {
  CreateOrdemServicoDTO,
  UpdateOrdemServicoDTO,
  CreateEventoOSDTO,
  CreateItemOSDTO,
  StatusOS,
  StatusLogistico,
} from '@shared/types/entities.types';

/** Status que nao permitem eventos */
const STATUS_BLOQUEADOS_EVENTO: StatusOS[] = ['CONCLUIDA', 'CANCELADA'];

/** Status que nao permitem itens */
const STATUS_BLOQUEADOS_ITEM: StatusOS[] = ['CONCLUIDA', 'CANCELADA'];

export class OSService {
  private repository = new OrdemServicoRepository();
  private eventoRepository = new EventoOSRepository();
  private itemRepository = new ItemOSRepository();
  private notificationService = new EmailNotificationService();

  // ===========================================================================
  // CONSULTAS
  // ===========================================================================

  async list() {
    return this.repository.findMany();
  }

  async getById(id: number) {
    const os = await this.repository.findById(id);
    if (!os) throw new Error('Ordem de Servico nao encontrada');
    return os;
  }

  async findByNumeroOS(numeroOS: string) {
    const os = await this.repository.findByNumeroOS(numeroOS);
    if (!os) throw new Error('Ordem de Servico nao encontrada');
    return os;
  }

  async listByCliente(clienteId: number) {
    return this.repository.findByClienteId(clienteId);
  }

  async listByPeriod(dataInicio: string, dataFim: string) {
    return this.repository.findByDateRange(
      new Date(`${dataInicio}T00:00:00`),
      new Date(`${dataFim}T23:59:59.999`)
    );
  }

  async listByEquipamento(equipamentoId: number) {
    return this.repository.findByEquipamentoId(equipamentoId);
  }

  async listByStatus(status: string) {
    return this.repository.findByStatus(status);
  }

  // ===========================================================================
  // CRIACAO
  // ===========================================================================

  async create(data: CreateOrdemServicoDTO, usuarioId: number) {
    const validated = createOSSchema.parse(data);
    const numeroOS = await proximoNumeroOS();

    const os = await this.repository.create(validated, numeroOS);

    // Criar evento de abertura
    await this.eventoRepository.create({
      osId: os.id,
      usuarioId,
      descricao: `OS ${numeroOS} aberta`,
    });

    // Notificar cliente por email (fire-and-forget)
    this.notificationService.notifyEvento(os.id, {
      osId: os.id,
      usuarioId,
      descricao: `OS ${numeroOS} aberta`,
    });

    // Registrar log
    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'CREATE',
      descricao: `OS ${numeroOS} criada para cliente ${validated.clienteId}`,
      usuarioId,
      dadosContexto: { osId: os.id, numeroOS },
    });

    return os;
  }

  // ===========================================================================
  // ATUALIZACAO
  // ===========================================================================

  async update(id: number, data: UpdateOrdemServicoDTO) {
    const os = await this.getById(id);
    if (
      (data.desconto !== undefined || data.descontoTipo !== undefined) &&
      ['CONCLUIDA', 'CANCELADA'].includes(os.status)
    ) {
      throw new Error('Nao e possivel alterar desconto em OS finalizada ou cancelada');
    }
    const validated = updateOSSchema.parse(data);
    return this.repository.update(id, validated);
  }

  // ===========================================================================
  // MUDANCA DE STATUS
  // ===========================================================================

  async changeStatus(id: number, novoStatus: StatusOS, usuarioId: number) {
    const validated = changeStatusSchema.parse({ status: novoStatus });
    const os = await this.getById(id);

    if (validated.status === 'CONCLUIDA') {
      if (!os.categoriaServicoId) {
        throw new Error('A OS precisa ter uma Categoria do Serviço atribuída antes de ser concluída');
      }
      const itens = await this.itemRepository.findByOSId(id);
      if (itens.length === 0) {
        throw new Error('Adicione ao menos uma Peça ou Serviço antes de concluir a OS');
      }
    }

    const statusAtual = os.status as StatusOS;
    if (!validarTransicaoStatus(statusAtual, validated.status)) {
      throw new Error(
        `Transicao de status invalida: ${statusAtual} -> ${validated.status}`
      );
    }

    const dadosAtualizacao: Record<string, unknown> = {
      status: validated.status,
    };

    if (validated.status === 'CONCLUIDA') {
      dadosAtualizacao.dataConclusao = new Date();
    }

    const osAtualizada = await this.repository.update(id, dadosAtualizacao as any);

    // Criar evento de mudanca de status
    await this.eventoRepository.create({
      osId: id,
      usuarioId,
      descricao: `Status alterado de ${statusAtual} para ${validated.status}`,
    });

    // Notificar cliente por email (fire-and-forget)
    const eventoData = {
      osId: id,
      usuarioId,
      descricao: `Status alterado de ${statusAtual} para ${validated.status}`,
    };
    this.notificationService.notifyEvento(id, eventoData);

    // Na conclusao, enviar PDF anexado
    if (validated.status === 'CONCLUIDA') {
      this.notificationService.notifyConclusao(id, validated.status);
    }

    // Registrar log
    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'CHANGE_STATUS',
      descricao: `OS ${os.numeroOS}: ${statusAtual} -> ${validated.status}`,
      usuarioId,
      dadosContexto: { osId: id, statusAtual, novoStatus: validated.status },
    });

    return osAtualizada;
  }

  // ===========================================================================
  // PAUSAR / RETOMAR
  // ===========================================================================

  async pausar(id: number, justificativa: string, usuarioId: number) {
    const validated = pausarRetomarSchema.parse({ justificativa });
    const os = await this.getById(id);

    const statusAtual = os.status as StatusOS;
    if (!validarTransicaoStatus(statusAtual, 'PAUSADO')) {
      throw new Error(
        `Nao e possivel pausar OS com status ${statusAtual}`
      );
    }

    const osAtualizada = await this.repository.update(id, { status: 'PAUSADO' } as any);

    await this.eventoRepository.create({
      osId: id,
      usuarioId,
      descricao: `OS pausada: ${validated.justificativa}`,
    });

    this.notificationService.notifyEvento(id, {
      osId: id,
      usuarioId,
      descricao: `OS pausada: ${validated.justificativa}`,
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'PAUSAR',
      descricao: `OS ${os.numeroOS}: pausada - ${validated.justificativa}`,
      usuarioId,
      dadosContexto: { osId: id, justificativa: validated.justificativa },
    });

    return osAtualizada;
  }

  async retomar(id: number, justificativa: string, usuarioId: number) {
    const validated = pausarRetomarSchema.parse({ justificativa });
    const os = await this.getById(id);

    const statusAtual = os.status as StatusOS;
    if (!validarTransicaoStatus(statusAtual, 'EM_ATENDIMENTO')) {
      throw new Error(
        `Nao e possivel retomar OS com status ${statusAtual}`
      );
    }

    const osAtualizada = await this.repository.update(id, { status: 'EM_ATENDIMENTO' } as any);

    await this.eventoRepository.create({
      osId: id,
      usuarioId,
      descricao: `OS retomada: ${validated.justificativa}`,
    });

    this.notificationService.notifyEvento(id, {
      osId: id,
      usuarioId,
      descricao: `OS retomada: ${validated.justificativa}`,
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'RETOMAR',
      descricao: `OS ${os.numeroOS}: retomada - ${validated.justificativa}`,
      usuarioId,
      dadosContexto: { osId: id, justificativa: validated.justificativa },
    });

    return osAtualizada;
  }

  // ===========================================================================
  // STATUS LOGISTICO
  // ===========================================================================

  async changeStatusLogistico(id: number, novoStatus: StatusLogistico, usuarioId: number) {
    const validated = changeStatusLogisticoSchema.parse({ status: novoStatus });
    const os = await this.getById(id);

    const statusAtual = os.statusLogistico as StatusLogistico;
    if (!validarTransicaoLogistica(statusAtual, validated.status)) {
      throw new Error(
        `Transicao logistica invalida: ${statusAtual} -> ${validated.status}`
      );
    }

    const osAtualizada = await this.repository.update(id, { statusLogistico: validated.status } as any);

    const descricoes: Record<string, string> = {
      RECEBIDO: 'Em posse do equipamento',
      ENTREGUE: 'Equipamento Entregue',
    };
    await this.eventoRepository.create({
      osId: id,
      usuarioId,
      descricao: descricoes[validated.status] ?? `Status logistico alterado de ${statusAtual} para ${validated.status}`,
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'CHANGE_LOGISTICO_STATUS',
      descricao: `OS ${os.numeroOS}: logistico ${statusAtual} -> ${validated.status}`,
      usuarioId,
      dadosContexto: { osId: id, statusLogisticoAtual: statusAtual, novoStatusLogistico: validated.status },
    });

    return osAtualizada;
  }

  // ===========================================================================
  // EVENTOS
  // ===========================================================================

  async addEvento(data: CreateEventoOSDTO) {
    const validated = createEventoSchema.parse(data);
    const os = await this.getById(validated.osId);

    if (STATUS_BLOQUEADOS_EVENTO.includes(os.status as StatusOS)) {
      throw new Error(
        `Nao e possivel adicionar eventos em OS com status ${os.status}`
      );
    }

    return this.eventoRepository.create(validated).then((evento) => {
      // Notificar cliente por email (fire-and-forget)
      this.notificationService.notifyEvento(validated.osId, validated);
      return evento;
    });
  }

  async getEventos(osId: number) {
    await this.getById(osId);
    return this.eventoRepository.findByOSId(osId);
  }

  // ===========================================================================
  // ITENS
  // ===========================================================================

  async addItem(data: CreateItemOSDTO) {
    const validated = createItemOSSchema.parse(data);
    const os = await this.getById(validated.osId);

    if (STATUS_BLOQUEADOS_ITEM.includes(os.status as StatusOS)) {
      throw new Error(
        `Nao e possivel adicionar itens em OS com status ${os.status}`
      );
    }

    return this.itemRepository.create(validated);
  }

  async removeItem(id: number) {
    return this.itemRepository.delete(id);
  }

  async getItens(osId: number) {
    await this.getById(osId);
    return this.itemRepository.findByOSId(osId);
  }

  async calcularTotal(osId: number) {
    await this.getById(osId);
    return this.itemRepository.calcularTotalOS(osId);
  }

  // ===========================================================================
  // ESTATISTICAS
  // ===========================================================================

  async count() {
    return this.repository.count();
  }

  async countByStatus() {
    return this.repository.countByStatus();
  }

  // ===========================================================================
  // EXCLUSAO
  // ===========================================================================

  async delete(id: number) {
    await this.getById(id);
    return this.repository.delete(id);
  }
}
