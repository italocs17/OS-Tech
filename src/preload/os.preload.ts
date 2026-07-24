/**
 * OS.Tech - Preload de Ordem de Serviço (OS)
 * Expõe operações de OS, itens, eventos e cálculos ao processo renderer.
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const osAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.OS.LIST),
  listByClient: (clienteId: number) => ipcRenderer.invoke(IPC_CHANNELS.OS.LIST_BY_CLIENT, clienteId),
  listByPeriod: (dataInicio: string, dataFim: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.LIST_BY_PERIOD, dataInicio, dataFim),
  listByEquipamento: (equipamentoId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.LIST_BY_EQUIPMENT, equipamentoId),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.OS.GET, id),
  create: (data: unknown, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.CREATE, data, usuarioId),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.OS.DELETE, id),
  changeStatus: (id: number, status: string, usuarioId: number, motivo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.CHANGE_STATUS, id, status, usuarioId, motivo),
  pausar: (id: number, justificativa: string, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.PAUSAR, id, justificativa, usuarioId),
  retomar: (id: number, justificativa: string, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.RETOMAR, id, justificativa, usuarioId),
  changeLogisticoStatus: (id: number, status: string, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.CHANGE_LOGISTICO_STATUS, id, status, usuarioId),
  addEvent: (data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.ADD_EVENT, data),
  addItem: (data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.ADD_ITEM, data),
  removeItem: (id: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.REMOVE_ITEM, id),
  getItens: (osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.GET_ITENS, osId),
  getEventos: (osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.GET_EVENTOS, osId),
  calcularTotal: (osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.CALCULAR_TOTAL, osId),
  countByStatus: () =>
    ipcRenderer.invoke(IPC_CHANNELS.OS.COUNT_BY_STATUS),
};
