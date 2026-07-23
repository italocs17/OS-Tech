import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const contratoAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.LIST),
  listAll: () => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.LIST_ALL),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.GET, id),
  listByCliente: (clienteId: number) => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.LIST_BY_CLIENTE, clienteId),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CONTRATO.DELETE, id),
};
