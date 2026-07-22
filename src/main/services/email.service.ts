import { EmailRepository } from '../database/repositories/email.repository';
import { ClienteContatoRepository } from '../database/repositories/cliente-contato.repository';
import { EmailConfigService } from './email-config.service';
import { OSService } from './os.service';
import { registrar } from './log.service';
import type { EmailSolicitacaoComVinculos } from '@shared/types/entities.types';
import path from 'path';
import fs from 'fs';

let imapClient: any = null;

export class EmailService {
  private repository = new EmailRepository();
  private contatoRepository = new ClienteContatoRepository();
  private configService = new EmailConfigService();
  private osService = new OSService();

  private checking = false;

  async checkMail(usuarioId?: number): Promise<{ received: number; novas: number; autoConvertidas: number; erros: string[] }> {
    if (this.checking) {
      return { received: 0, novas: 0, autoConvertidas: 0, erros: ['Verificacao ja em andamento'] };
    }
    this.checking = true;

    let result = { received: 0, novas: 0, autoConvertidas: 0, erros: [] as string[] };

    try {
      const uid = usuarioId || 0;
      const config = await this.configService.getConfig();
      if (!config) {
        throw new Error('Configuracao de email nao encontrada. Configure o email e senha de app primeiro.');
      }

      const erros: string[] = [];
      let novas = 0;
      let autoConvertidas = 0;
      let received = 0;

      const { ImapFlow } = await import('imapflow');

      if (imapClient) {
        try { await imapClient.logout(); } catch {}
        imapClient = null;
      }

      const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
        logger: false,
      });

      imapClient = client;
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      try {
        const searchResult: any = await client.search({ seen: false });
        const messages: number[] = Array.isArray(searchResult) ? searchResult : [];
        received = messages.length;

        for (const uid of messages) {
          try {
            const fetchResult: any = await client.fetchOne(uid, {
              envelope: true,
              source: true,
              bodyStructure: true,
            });

            if (!fetchResult || !fetchResult.envelope) continue;

            const mensagemId = fetchResult.envelope.messageId || `${uid}`;

            const jaExiste = await this.repository.findByMensagemId(mensagemId);
            if (jaExiste) continue;

            const from = fetchResult.envelope.from?.[0];
            const emailRemetente = from?.address || 'desconhecido';
            const assunto = fetchResult.envelope.subject || '(Sem assunto)';

            let corpoTexto = '';
            try {
              corpoTexto = this.extrairTexto(fetchResult.source, fetchResult.bodyStructure);
            } catch {
              corpoTexto = '(Corpo nao disponivel)';
            }

            const replyToId = fetchResult.envelope.inReplyTo || this.extractReferencesHeader(fetchResult.source);

            if (replyToId) {
              const originalSolicitacao = await this.repository.findByMensagemId(replyToId);
              if (originalSolicitacao?.osId) {
                try {
                  await this.osService.addEvento({
                    osId: originalSolicitacao.osId,
                    usuarioId: 0,
                    descricao: `[Reply - ${emailRemetente}] ${corpoTexto}`,
                  });
                  await registrar({
                    nivel: 'INFO',
                    categoria: 'OS',
                    acao: 'EMAIL_REPLY_ADDED',
                    descricao: `Reply de ${emailRemetente} adicionado como evento na OS #${originalSolicitacao.osId}`,
                    dadosContexto: { osId: originalSolicitacao.osId, emailRemetente, replyToId },
                  });
                } catch (err: any) {
                  erros.push(`Erro ao adicionar reply como evento: ${err.message}`);
                }
                continue;
              }
            }

            const contato = await this.contatoRepository.findByEmail(emailRemetente);

            const solicitacao = await this.repository.create({
              emailRemetente,
              assunto,
              corpoTexto,
              mensagemId,
              status: contato ? 'AGUARDANDO_ATENDIMENTO' : 'NAO_CADASTRADO',
              clienteId: contato?.clienteId || undefined,
              contatoId: contato?.id || undefined,
            });

            novas++;

            if (solicitacao) {
              try {
                await this.baixarAnexos(client, uid, fetchResult, solicitacao.id);
              } catch (err: any) {
                erros.push(`Erro ao baixar anexos do email ${emailRemetente}: ${err.message}`);
              }
            }

            if (contato && solicitacao) {
              try {
                await this.autoConvertToOS(solicitacao.id, contato.clienteId);
                autoConvertidas++;
              } catch (err: any) {
                erros.push(`Auto-conversao falhou para email ${emailRemetente}: ${err.message}`);
              }
            }
          } catch (err: any) {
            erros.push(`Erro ao processar email UID ${uid}: ${err.message}`);
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
      imapClient = null;

      if (uid) {
        await registrar({
          nivel: 'INFO',
          categoria: 'SISTEMA',
          acao: 'EMAIL_CHECK',
          descricao: `Verificacao de email concluida: ${received} nao lidos, ${novas} novos, ${autoConvertidas} auto-convertidos`,
          usuarioId: uid,
          dadosContexto: { received, novas, autoConvertidas, erros: erros.length },
        });
      }

      result = { received, novas, autoConvertidas, erros };
    } catch (err: any) {
      imapClient = null;
      result.erros.push(`Erro na conexao IMAP: ${err.message}`);

      if (usuarioId || 0) {
        await registrar({
          nivel: 'ERROR',
          categoria: 'SISTEMA',
          acao: 'EMAIL_CHECK_ERROR',
          descricao: `Erro ao verificar emails: ${err.message}`,
          usuarioId: usuarioId || 0,
          dadosContexto: { error: err.message },
        });
      }
    } finally {
      this.checking = false;
    }

    return result;
  }

  private async autoConvertToOS(solicitacaoId: number, clienteId: number): Promise<void> {
    const solicitacao = await this.repository.findById(solicitacaoId);
    if (!solicitacao || solicitacao.status !== 'AGUARDANDO_ATENDIMENTO') return;

    const observacoes = [
      solicitacao.assunto,
      '---',
      solicitacao.corpoTexto,
    ].join('\n');

    const os = await this.osService.create(
      {
        clienteId,
        contatoId: solicitacao.contatoId || undefined,
        tipoAtendimento: 'INTERNO',
        observacoes,
      },
      0
    );

    await this.repository.update(solicitacaoId, {
      status: 'CONVERTIDO',
      osId: os.id,
      dataProcessamento: new Date(),
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'OS',
      acao: 'EMAIL_AUTO_CONVERT',
      descricao: `Solicitacao de email #${solicitacaoId} convertida automaticamente para OS ${os.numeroOS}`,
      dadosContexto: { solicitacaoId, osId: os.id, numeroOS: os.numeroOS, clienteId },
    });
  }

  private async baixarAnexos(client: any, uid: number, fetchResult: any, solicitacaoId: number): Promise<void> {
    const bodyStructure = fetchResult.bodyStructure;
    if (!bodyStructure?.children) return;

    const attachments = bodyStructure.children.filter((child: any) => {
      const disposition = child.disposition;
      return disposition === 'attachment' || (child.type && !child.type.startsWith('text/'));
    });

    if (attachments.length === 0) return;

    const attachDir = path.join('resources', 'attachments', String(solicitacaoId));
    if (!fs.existsSync(attachDir)) {
      fs.mkdirSync(attachDir, { recursive: true });
    }

    for (const [index, attachment] of attachments.entries()) {
      try {
        const section = `${index + 1}`;
        const partData: any = await client.fetchOne(uid, {
          bodyParts: [section],
        });

        if (!partData?.bodyParts?.get?.(section)) continue;

        const buffer = partData.bodyParts.get(section);
        const filename = attachment.name || `anexo_${index + 1}`;
        const filePath = path.join(attachDir, filename);

        fs.writeFileSync(filePath, buffer);

        await this.repository.createAnexo({
          emailSolicitacaoId: solicitacaoId,
          nomeArquivo: filename,
          caminhoArquivo: filePath,
          tamanho: buffer.length,
          mimeType: attachment.type || null,
        });
      } catch (err: any) {
        console.error(`[EmailService] Erro ao baixar anexo ${index}:`, err.message);
      }
    }
  }

  private extrairTexto(source: any, bodyStructure: any): string {
    if (source) {
      const raw = source.toString('utf8');
      const text = this.parseMIMEBody(raw, bodyStructure);
      if (text) return text;
    }

    return '(Corpo nao disponivel)';
  }

  private parseMIMEBody(rawEmail: string, bodyStructure?: any): string | null {
    const boundaryMatch = rawEmail.match(/^Content-Type:\s*[^;]+;\s*boundary="?([^";\s\r\n]+)"?/im);

    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = rawEmail.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?`, 'g'));

      const plainPart = this.findPartByType(parts, 'text/plain');
      if (plainPart) {
        return this.extractPartContent(plainPart, 'text/plain');
      }

      const htmlPart = this.findPartByType(parts, 'text/html');
      if (htmlPart) {
        return this.htmlToText(this.extractPartContent(htmlPart, 'text/html'));
      }
    } else {
      const contentType = rawEmail.match(/^Content-Type:\s*(\S+)/im);
      const mimeBody = this.extractMIMEBody(rawEmail);
      if (contentType && mimeBody) {
        if (/text\/plain/i.test(contentType[1])) {
          return this.decodeBodyContent(mimeBody, rawEmail);
        }
        if (/text\/html/i.test(contentType[1])) {
          return this.htmlToText(this.decodeBodyContent(mimeBody, rawEmail));
        }
      }

      if (mimeBody) {
        return this.decodeBodyContent(mimeBody, rawEmail);
      }
    }

    return null;
  }

  private findPartByType(parts: string[], mimeType: string): string | null {
    for (const part of parts) {
      const ctMatch = part.match(/Content-Type:\s*([^\s;]+)/i);
      if (ctMatch && new RegExp(mimeType, 'i').test(ctMatch[1])) {
        return part;
      }
    }
    return null;
  }

  private extractPartContent(part: string, mimeType: string): string {
    const headerEnd = this.findHeaderEnd(part);
    if (headerEnd === -1) return '';

    const body = part.substring(headerEnd);
    return this.decodeBodyContent(body, part);
  }

  private extractMIMEBody(rawEmail: string): string | null {
    const headerEnd = this.findHeaderEnd(rawEmail);
    if (headerEnd === -1) return null;
    return rawEmail.substring(headerEnd);
  }

  private findHeaderEnd(text: string): number {
    const idx1 = text.indexOf('\r\n\r\n');
    const idx2 = text.indexOf('\n\n');
    if (idx1 !== -1 && idx2 !== -1) return Math.min(idx1, idx2);
    if (idx1 !== -1) return idx1 + 4;
    if (idx2 !== -1) return idx2 + 2;
    return -1;
  }

  private decodeBodyContent(body: string, headers: string): string {
    const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase() : '7bit';

    let content = body;

    if (encoding === 'quoted-printable') {
      content = this.decodeQuotedPrintable(content);
    } else if (encoding === 'base64') {
      content = content.replace(/\s/g, '');
      try {
        content = Buffer.from(content, 'base64').toString('utf8');
      } catch {}
    }

    return content.trim();
  }

  private decodeQuotedPrintable(text: string): string {
    let result = text.replace(/=\r?\n/g, '');
    result = result.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    return result;
  }

  private htmlToText(html: string): string {
    let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }

  private extractReferencesHeader(source: any): string | null {
    if (!source) return null;
    try {
      const raw = source.toString('utf8');
      const refMatch = raw.match(/^References:\s*(.+)$/mi);
      if (refMatch) {
        const refs = refMatch[1].trim().split(/\s+/);
        return refs[0] || null;
      }
    } catch {}
    return null;
  }

  async reparseEmailBody(solicitacaoId: number): Promise<boolean> {
    const solicitacao = await this.repository.findById(solicitacaoId);
    if (!solicitacao) return false;
    if (solicitacao.corpoTexto && solicitacao.corpoTexto !== '(Corpo nao disponivel)' && solicitacao.corpoTexto !== '(Sem conteudo)') {
      return false;
    }

    const config = await this.configService.getConfig();
    if (!config) return false;

    const { ImapFlow } = await import('imapflow');
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user: config.email, pass: config.appPassword },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        const uidList: any = await client.search({ header: ['Message-ID', solicitacao.mensagemId] } as any);
        const uids = Array.isArray(uidList) ? uidList : [];
        if (uids.length === 0) return false;

        const fetchResult: any = await client.fetchOne(uids[0], {
          source: true,
          bodyStructure: true,
        });

        if (!fetchResult?.source) return false;

        const corpoTexto = this.extrairTexto(fetchResult.source, fetchResult.bodyStructure);
        if (corpoTexto && corpoTexto !== '(Corpo nao disponivel)') {
          await this.repository.update(solicitacaoId, { corpoTexto });
          return true;
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch {
      try { await client.logout(); } catch {}
    }

    return false;
  }
}
