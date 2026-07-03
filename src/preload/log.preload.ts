import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import type { LogFiltros } from '../main/services/log.service';

export const logAPI = {
  list: (filtros?: LogFiltros) =>
    ipcRenderer.invoke(IPC_CHANNELS.LOG.LIST, filtros ?? {}),
  export: (formato: 'csv' | 'json', filtros?: LogFiltros) =>
    ipcRenderer.invoke(IPC_CHANNELS.LOG.EXPORT, formato, filtros ?? {}),
};
