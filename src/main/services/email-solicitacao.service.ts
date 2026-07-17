import { EmailRepository } from '../database/repositories/email.repository';
import { OSService } from './os.service';
import { registrar } from './log.service';
import { linkClientSchema, convertToOSSchema } from '../validators/email.validator';
import type { LinkClientDTO, ConvertToOSDTO } from '@shared/types/entities.types';

export class EmailSolicitacaoService {
  private repository = new EmailRepository();
  private osService = new OSService();

  async list() {
    return this.repository.findMany();
  }

  async getById(id: number) {
    const solicitacao = await this.repository.findById(id);
    if (!solicitacao) throw new Error('Solicitacao nao encontrada');
    return solicitacao;
  }

  async listByStatus(status: string) {
    return this.repository.findByStatus(status);
  }

  async countPending() {
    return this.repository.countPending();
  }

  async linkClient(data: LinkClientDTO) {
    const validated = linkClientSchema.parse(data);

    const solicitacao = await this.getById(validated.solicitacaoId);

    const updated = await this.repository.update(validated.solicitacaoId, {
      clienteId: validated.clienteId,
      contatoId: validated.contatoId,
      status: 'AGUARDANDO_ATENDIMENTO',
      usuarioAprovadorId: validated.usuarioId,
      dataProcessamento: new Date(),
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'EMAIL_LINK_CLIENT',
      descricao: `Solicitacao de email #${solicitacao.id} vinculada ao cliente ${validated.clienteId}`,
      usuarioId: validated.usuarioId,
      dadosContexto: { solicitacaoId: solicitacao.id, clienteId: validated.clienteId },
    });

    return updated;
  }

  async convertToOS(data: ConvertToOSDTO) {
    const validated = convertToOSSchema.parse(data);
    const solicitacao = await this.getById(validated.solicitacaoId);

    if (solicitacao.status !== 'AGUARDANDO_ATENDIMENTO') {
      throw new Error('Solicitacao deve estar em AGUARDANDO_ATENDIMENTO para ser convertida');
    }
    if (!solicitacao.clienteId) {
      throw new Error('Solicitacao deve estar vinculada a um cliente');
    }

    const observacoes = [
      solicitacao.assunto,
      '---',
      solicitacao.corpoTexto,
    ].join('\n');

    const os = await this.osService.create(
      {
        clienteId: solicitacao.clienteId,
        contatoId: solicitacao.contatoId || undefined,
        tipoAtendimento: validated.tipoAtendimento as any || 'INTERNO',
        observacoes: validated.observacoes || observacoes,
      },
      validated.usuarioId
    );

    await this.repository.update(validated.solicitacaoId, {
      status: 'CONVERTIDO',
      osId: os.id,
      usuarioAprovadorId: validated.usuarioId,
      dataProcessamento: new Date(),
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'EMAIL_CONVERT_TO_OS',
      descricao: `Solicitacao de email #${solicitacao.id} convertida para OS ${os.numeroOS}`,
      usuarioId: validated.usuarioId,
      dadosContexto: {
        solicitacaoId: solicitacao.id,
        osId: os.id,
        numeroOS: os.numeroOS,
      },
    });

    return os;
  }

  async reject(id: number, usuarioId: number, motivo?: string) {
    const solicitacao = await this.getById(id);

    if (solicitacao.status === 'CONVERTIDO' || solicitacao.status === 'REJEITADO') {
      throw new Error('Solicitacao ja foi processada');
    }

    const updated = await this.repository.update(id, {
      status: 'REJEITADO',
      usuarioAprovadorId: usuarioId,
      dataProcessamento: new Date(),
      observacoes: motivo ?? null,
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'EMAIL_REJECT',
      descricao: `Solicitacao de email #${solicitacao.id} rejeitada: ${motivo || 'Sem motivo'}`,
      usuarioId,
      dadosContexto: { solicitacaoId: id, motivo },
    });

    return updated;
  }

  async conciliar(solicitacaoOrigemId: number, solicitacaoDestinoId: number, usuarioId: number) {
    const origem = await this.getById(solicitacaoOrigemId);
    const destino = await this.getById(solicitacaoDestinoId);

    if (!destino.osId) {
      throw new Error('A solicitacao de destino nao esta vinculada a uma OS');
    }

    await this.osService.addEvento({
      osId: destino.osId,
      usuarioId,
      descricao: `[Chamado conciliado - ${origem.emailRemetente}] ${origem.assunto}\n${origem.corpoTexto}`,
    });

    await this.repository.update(solicitacaoOrigemId, {
      status: 'CONVERTIDO',
      osId: destino.osId,
      usuarioAprovadorId: usuarioId,
      dataProcessamento: new Date(),
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'EMAIL_CONCILIAR',
      descricao: `Solicitacao #${solicitacaoOrigemId} conciliada com solicitacao #${solicitacaoDestinoId} (OS #${destino.osId})`,
      usuarioId,
      dadosContexto: { origemId: solicitacaoOrigemId, destinoId: solicitacaoDestinoId, osId: destino.osId },
    });

    return { osId: destino.osId };
  }
}
