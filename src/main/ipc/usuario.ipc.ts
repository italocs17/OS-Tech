/**
 * OS.Tech - Handlers IPC de Usuario
 * Registra os canais de comunicacao para a entidade Usuario.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { UsuarioService } from '../services/usuario.service';

const usuarioService = new UsuarioService();

export function registerUsuarioIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.USER.LIST, async () => {
    return usuarioService.list();
  });

  ipcMain.handle(IPC_CHANNELS.USER.LIST_ALL, async () => {
    return usuarioService.listAll();
  });

  ipcMain.handle(IPC_CHANNELS.USER.GET, async (_, id: number) => {
    return usuarioService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.USER.CREATE, async (_, data) => {
    return usuarioService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.USER.UPDATE, async (_, id: number, data) => {
    return usuarioService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.USER.DELETE, async (_, id: number) => {
    return usuarioService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.USER.LOGIN, async (_, login: string, senha: string) => {
    return usuarioService.login(login, senha);
  });

  ipcMain.handle(IPC_CHANNELS.USER.CHANGE_PASSWORD, async (_, id: number, currentPassword: string, newPassword: string) => {
    return usuarioService.changePassword(id, currentPassword, newPassword);
  });
}
