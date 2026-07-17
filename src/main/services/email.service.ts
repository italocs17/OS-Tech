import { EmailRepository } from '../database/repositories/email.repository';
import { ClienteContatoRepository } from '../database/repositories/cliente-contato.repository';
import { EmailConfigService } from './email-config.service';
import { OSService } from './os.service';
import { registrar } from './log.service';
import type { EmailSolicitacaoComVinculos } from '@shared/types/entities.types';

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

    const uid = usuarioId || 0;
    const config = await this.configService.getConfig();
    if (!config) {
      throw new Error('Configuracao de email nao encontrada. Configure o email e senha de app primeiro.');
    }

    const erros: string[] = [];
    let novas = 0;
    let autoConvertidas = 0;
    let received = 0;

    try {
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
              corpoTexto = await this.extrairTexto(client, uid);
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
    } catch (err: any) {
      imapClient = null;
      erros.push(`Erro na conexao IMAP: ${err.message}`);

      if (uid) {
        await registrar({
          nivel: 'ERROR',
          categoria: 'SISTEMA',
          acao: 'EMAIL_CHECK_ERROR',
          descricao: `Erro ao verificar emails: ${err.message}`,
          usuarioId: uid,
          dadosContexto: { error: err.message },
        });
      }
    } finally {
      this.checking = false;
    }

    return { received, novas, autoConvertidas, erros };
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

  private async extrairTexto(client: any, uid: number): Promise<string> {
    try {
      const parts: any = await client.fetchOne(uid, {
        bodyParts: ['TEXT'],
      });

      if (parts?.bodyParts?.get?.('TEXT')) {
        const buffer = parts.bodyParts.get('TEXT');
        return buffer.toString('utf8').trim() || '(Sem conteudo)';
      }
    } catch {}

    try {
      const simple: any = await client.fetchOne(uid, { source: true });
      if (simple?.source) {
        const raw = simple.source.toString('utf8');
        const textPart = this.extrairTextoPlain(raw);
        if (textPart) return textPart;
      }
    } catch {}

    return '(Corpo nao disponivel)';
  }

  private extrairTextoPlain(rawEmail: string): string | null {
    const lines = rawEmail.split('\n');
    let inPlain = false;
    let inHtml = false;
    const textLines: string[] = [];

    for (const line of lines) {
      if (/^Content-Type:\s*text\/plain/i.test(line)) {
        inPlain = true;
        inHtml = false;
        continue;
      }
      if (/^Content-Type:\s*text\/html/i.test(line)) {
        inHtml = true;
        inPlain = false;
        continue;
      }
      if (/^--/.test(line) || /^Content-/.test(line)) {
        if (inPlain) inPlain = false;
        continue;
      }

      if (inPlain && line.trim()) {
        textLines.push(line.trim());
      }
    }

    if (textLines.length > 0) {
      return textLines.join('\n');
    }

    const htmlMatch = rawEmail.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (htmlMatch) {
      return htmlMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }

    return null;
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
}
