import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { prisma } from '../database/connection';
import { EmailConfigService } from './email-config.service';
import { PDFService } from './pdf.service';
import { registrar } from './log.service';
import type { StatusOS, CreateEventoOSDTO } from '@shared/types/entities.types';

const STATUS_LABELS: Record<StatusOS, string> = {
  ABERTA: 'Aberta',
  EM_DIAGNOSTICO: 'Em Diagnostico',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovacao',
  AGUARDANDO_PECA: 'Aguardando Peca',
  EM_EXECUCAO: 'Em Execucao',
  CONCLUIDA: 'Concluida',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
};

export class EmailNotificationService {
  private configService = new EmailConfigService();
  private pdfService = new PDFService();

  async notifyEvento(osId: number, evento: CreateEventoOSDTO): Promise<void> {
    try {
      const recipient = await this.getRecipientEmail(osId);
      if (!recipient) return;

      const os = await prisma.ordemServico.findUnique({
        where: { id: osId },
        include: { cliente: true },
      });
      if (!os) return;

      const config = await this.configService.getConfig();
      if (!config) return;

      const solicitacao = await prisma.emailSolicitacao.findFirst({
        where: { osId },
        orderBy: { dataRecebimento: 'asc' },
      });

      const transport = this.buildTransport(config.email, config.appPassword);

      const statusLabel = STATUS_LABELS[os.status as StatusOS] || os.status;
      const subject = `OS.Tech - OS ${os.numeroOS} - Atualizacao`;
      const body = [
        `Prezado(a) ${recipient.nome},`,
        '',
        `Sua ordem de servico OS ${os.numeroOS} teve uma atualizacao:`,
        '',
        evento.descricao,
        '',
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        `Status atual: ${statusLabel}`,
        '',
        'Atenciosamente,',
        'OS.Tech - Assistencia Tecnica',
      ].join('\n');

      const mailOptions: any = {
        from: `"OS.Tech" <${config.email}>`,
        to: recipient.email,
        subject,
        text: body,
      };

      if (solicitacao?.mensagemId) {
        mailOptions.headers = {
          'In-Reply-To': solicitacao.mensagemId,
          'References': solicitacao.mensagemId,
        };
      }

      await transport.sendMail(mailOptions);

      await registrar({
        nivel: 'INFO',
        categoria: 'OS',
        acao: 'EMAIL_NOTIFICATION_SENT',
        descricao: `Email de notificacao enviado para ${recipient.email} - OS ${os.numeroOS}`,
        dadosContexto: { osId, emailDestino: recipient.email },
      });
    } catch (err: any) {
      await registrar({
        nivel: 'ERROR',
        categoria: 'OS',
        acao: 'EMAIL_NOTIFICATION_ERROR',
        descricao: `Erro ao enviar email de notificacao: ${err.message}`,
        dadosContexto: { osId, error: err.message },
      });
    }
  }

  async notifyConclusao(osId: number, status: StatusOS): Promise<void> {
    try {
      const recipient = await this.getRecipientEmail(osId);
      if (!recipient) return;

      const os = await prisma.ordemServico.findUnique({
        where: { id: osId },
        include: { cliente: true, equipamento: true },
      });
      if (!os) return;

      const config = await this.configService.getConfig();
      if (!config) return;

      const tempPdfPath = path.join(os.tmpdir(), `OS_${os.numeroOS}_${Date.now()}.pdf`);
      await this.pdfService.generateOS(osId, tempPdfPath);

      const pdfBuffer = fs.readFileSync(tempPdfPath);
      fs.unlinkSync(tempPdfPath);

      const transport = this.buildTransport(config.email, config.appPassword);

      const statusLabel = STATUS_LABELS[status] || status;
      const subject = `OS.Tech - OS ${os.numeroOS} - ${statusLabel}`;
      const body = [
        `Prezado(a) ${recipient.nome},`,
        '',
        `Sua ordem de servico OS ${os.numeroOS} foi ${statusLabel.toLowerCase()}.`,
        '',
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        '',
        'O relatorio detalhado esta em anexo.',
        '',
        'Atenciosamente,',
        'OS.Tech - Assistencia Tecnica',
      ].join('\n');

      await transport.sendMail({
        from: `"OS.Tech" <${config.email}>`,
        to: recipient.email,
        subject,
        text: body,
        attachments: [
          {
            filename: `OS_${os.numeroOS}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      await registrar({
        nivel: 'INFO',
        categoria: 'OS',
        acao: 'EMAIL_CONCLUSION_SENT',
        descricao: `Email de conclusao com PDF enviado para ${recipient.email} - OS ${os.numeroOS}`,
        dadosContexto: { osId, emailDestino: recipient.email, status },
      });
    } catch (err: any) {
      await registrar({
        nivel: 'ERROR',
        categoria: 'OS',
        acao: 'EMAIL_CONCLUSION_ERROR',
        descricao: `Erro ao enviar email de conclusao: ${err.message}`,
        dadosContexto: { osId, error: err.message },
      });
    }
  }

  private async getRecipientEmail(
    osId: number
  ): Promise<{ email: string; nome: string } | null> {
    const os = await prisma.ordemServico.findUnique({
      where: { id: osId },
      include: { cliente: true, contato: true },
    });

    if (os?.contato?.email) {
      return { email: os.contato.email, nome: os.contato.nome };
    }

    const solicitacao = await prisma.emailSolicitacao.findFirst({
      where: { osId },
      include: { contato: true },
    });

    if (solicitacao?.contato?.email) {
      return { email: solicitacao.contato.email, nome: solicitacao.contato.nome };
    }

    if (os?.cliente?.email) {
      return { email: os.cliente.email, nome: os.cliente.nome };
    }

    return null;
  }

  private buildTransport(email: string, appPassword: string) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: appPassword,
      },
    });
  }
}
