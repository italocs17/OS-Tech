import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const subcategoriaServicoAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.LIST),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.GET, id),
  getByCategoria: (categoriaId: number) => ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.GET_BY_CATEGORIA, categoriaId),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.SUBCATEGORIA_SERVICO.DELETE, id),
};
