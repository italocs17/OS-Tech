import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const categoriaServicoAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.CATEGORIA_SERVICO.LIST),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CATEGORIA_SERVICO.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.CATEGORIA_SERVICO.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIA_SERVICO.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CATEGORIA_SERVICO.DELETE, id),
};
