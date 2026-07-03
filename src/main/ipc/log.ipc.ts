import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { listar, exportar } from '../services/log.service';
import type { LogFiltros } from '../services/log.service';

export function registerLogIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.LOG.LIST, async (_, filtros: LogFiltros) => {
    return listar(filtros);
  });

  ipcMain.handle(IPC_CHANNELS.LOG.EXPORT, async (_, formato: 'csv' | 'json', filtros: LogFiltros) => {
    return exportar(formato, filtros);
  });
}
