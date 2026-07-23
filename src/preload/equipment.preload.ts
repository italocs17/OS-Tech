/**
 * OS.Tech - Preload de Equipamento
 * Expõe operações CRUD de equipamentos ao processo renderer.
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const equipmentAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.LIST),
  listAll: () => ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.LIST_ALL),
  listByClient: (clienteId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.LIST_BY_CLIENT, clienteId),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.GET, id),
  getByTag: (etiqueta: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.GET_BY_TAG, etiqueta),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPMENT.DELETE, id),
};
