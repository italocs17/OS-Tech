/**
 * OS.Tech - Preload de Usuário
 * Expõe operações CRUD e autenticação de usuários ao processo renderer.
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const userAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.USER.LIST),
  listAll: () => ipcRenderer.invoke(IPC_CHANNELS.USER.LIST_ALL),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.USER.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.USER.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.USER.DELETE, id),
  login: (login: string, senha: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER.LOGIN, login, senha),
  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER.CHANGE_PASSWORD, id, currentPassword, newPassword),
};
