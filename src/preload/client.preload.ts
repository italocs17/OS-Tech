/**
 * OS.Tech - Preload de Cliente
 * Expõe operações CRUD de clientes ao processo renderer.
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const clientAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.LIST),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIENT.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.DELETE, id),
  setContatoPadrao: (clienteId: number, contatoId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIENT.SET_CONTATO_PADRAO, clienteId, contatoId),
};
