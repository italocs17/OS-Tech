import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { EmailSolicitacaoService } from '../services/email-solicitacao.service';
import { EmailConfigService } from '../services/email-config.service';
import { EmailService } from '../services/email.service';
import { ClienteContatoRepository } from '../database/repositories/cliente-contato.repository';

const solicitacaoService = new EmailSolicitacaoService();
const configService = new EmailConfigService();
const emailService = new EmailService();
const contatoRepository = new ClienteContatoRepository();

export function registerEmailIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.EMAIL.LIST, async () => {
    return solicitacaoService.list();
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.GET, async (_, id: number) => {
    return solicitacaoService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.LIST_BY_STATUS, async (_, status: string) => {
    return solicitacaoService.listByStatus(status);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.COUNT_PENDING, async () => {
    return solicitacaoService.countPending();
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CHECK_MAIL, async (_, usuarioId: number) => {
    return emailService.checkMail(usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.LINK_CLIENT, async (_, data) => {
    return solicitacaoService.linkClient(data);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CONVERT_TO_OS, async (_, data) => {
    return solicitacaoService.convertToOS(data);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.REJECT, async (_, id: number, usuarioId: number, motivo?: string) => {
    return solicitacaoService.reject(id, usuarioId, motivo);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.REVISAR, async (_, id: number, usuarioId: number) => {
    return solicitacaoService.revisar(id, usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CONCILIAR, async (_, solicitacaoOrigemId: number, solicitacaoDestinoId: number, usuarioId: number) => {
    return solicitacaoService.conciliar(solicitacaoOrigemId, solicitacaoDestinoId, usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CONFIG_GET, async () => {
    return configService.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CONFIG_SAVE, async (_, config: { email: string; appPassword: string }) => {
    await configService.saveConfig(config.email, config.appPassword);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.LIST_CONTATOS, async (_, clienteId: number) => {
    return contatoRepository.findMany(clienteId);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.CREATE_CONTATO, async (_, data) => {
    return contatoRepository.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.UPDATE_CONTATO, async (_, id: number, data) => {
    return contatoRepository.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.DELETE_CONTATO, async (_, id: number) => {
    return contatoRepository.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.LIST_ATTACHMENTS, async (_, emailSolicitacaoId: number) => {
    return solicitacaoService.listAnexos(emailSolicitacaoId);
  });

  ipcMain.handle(IPC_CHANNELS.EMAIL.LIST_ATTACHMENTS_BY_OS, async (_, osId: number) => {
    return solicitacaoService.listAnexosByOsId(osId);
  });
}
