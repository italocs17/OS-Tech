/**
 * OS.Tech - Preload de Inventário
 * Expõe operações de captura e consulta de inventário ao processo renderer.
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const inventoryAPI = {
  get: (osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.INVENTORY.GET, osId),
  list: () =>
    ipcRenderer.invoke(IPC_CHANNELS.INVENTORY.LIST),
  saveManual: (osId: number, data: unknown, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.INVENTORY.SAVE_MANUAL, osId, data, usuarioId),
  listByOs: (osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.INVENTORY.LIST_BY_OS, osId),
  listByEquipamento: (equipamentoId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.INVENTORY.LIST_BY_EQUIPAMENTO, equipamentoId),
};
