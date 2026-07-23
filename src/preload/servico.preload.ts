import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const servicoAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.SERVICO.LIST),
  listAll: () => ipcRenderer.invoke(IPC_CHANNELS.SERVICO.LIST_ALL),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.SERVICO.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SERVICO.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SERVICO.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.SERVICO.DELETE, id),
};
