import { prisma } from '../connection';
import type { CreateEmailSolicitacaoDTO, UpdateEmailSolicitacaoDTO } from '@shared/types/entities.types';

export class EmailRepository {
  async findMany() {
    return prisma.emailSolicitacao.findMany({
      orderBy: { dataRecebimento: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.emailSolicitacao.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true } },
        contato: true,
        os: { select: { id: true, numeroOS: true } },
      },
    });
  }

  async findByStatus(status: string) {
    return prisma.emailSolicitacao.findMany({
      where: { status: status as any },
      orderBy: { dataRecebimento: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        contato: { select: { id: true, nome: true, email: true } },
        os: { select: { id: true, numeroOS: true } },
      },
    });
  }

  async findByMensagemId(mensagemId: string) {
    return prisma.emailSolicitacao.findUnique({ where: { mensagemId } });
  }

  async findByOsId(osId: number) {
    return prisma.emailSolicitacao.findFirst({ where: { osId } });
  }

  async countByStatus(status: string) {
    return prisma.emailSolicitacao.count({
      where: { status: status as any },
    });
  }

  async countPending() {
    return prisma.emailSolicitacao.count({
      where: {
        status: { in: ['NAO_CADASTRADO', 'AGUARDANDO_ATENDIMENTO'] as any },
      },
    });
  }

  async create(data: CreateEmailSolicitacaoDTO) {
    return prisma.emailSolicitacao.create({ data });
  }

  async update(id: number, data: UpdateEmailSolicitacaoDTO) {
    return prisma.emailSolicitacao.update({ where: { id }, data });
  }

  async listAnexos(emailSolicitacaoId: number) {
    return prisma.anexoEmail.findMany({
      where: { emailSolicitacaoId },
      orderBy: { dataUpload: 'asc' },
    });
  }

  async createAnexo(data: { emailSolicitacaoId: number; nomeArquivo: string; caminhoArquivo: string; tamanho: number; mimeType?: string }) {
    return prisma.anexoEmail.create({ data });
  }

  async findAnexoById(id: number) {
    return prisma.anexoEmail.findUnique({ where: { id } });
  }
}
