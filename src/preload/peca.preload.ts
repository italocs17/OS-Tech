import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const pecaAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.PECA.LIST),
  listAll: () => ipcRenderer.invoke(IPC_CHANNELS.PECA.LIST_ALL),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PECA.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PECA.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.PECA.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PECA.DELETE, id),
};
