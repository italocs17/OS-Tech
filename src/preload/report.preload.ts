import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const backupAPI = {
  create: (usuarioId: number, type: 'auto' | 'manual') =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.CREATE, usuarioId, type),
  list: () =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.LIST),
  restore: (filename: string, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP.RESTORE, filename, usuarioId),
};

export const reportAPI = {
  generate: (type: string, osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.PDF, type, osId),
  financial: (dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.FINANCIAL, dataInicio, dataFim, modo),
  osByPeriod: (dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.OS_BY_PERIOD, dataInicio, dataFim, modo),
  byClient: (clienteId: number, dataInicio?: string, dataFim?: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.OS_BY_CLIENT, clienteId, dataInicio, dataFim, modo),
  byEquipment: (equipamentoId: number, dataInicio?: string, dataFim?: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.OS_BY_EQUIPMENT, equipamentoId, dataInicio, dataFim, modo),
  osByStatus: (status: string, dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.OS_BY_STATUS, status, dataInicio, dataFim, modo),
  servicosRealizados: (dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.SERVICOS_REALIZADOS, dataInicio, dataFim, modo),
  pecasUtilizadas: (dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.PECAS_UTILIZADAS, dataInicio, dataFim, modo),
  clientesRecorrentes: (dataInicio: string, dataFim: string, modo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.CLIENTES_RECORRENTES, dataInicio, dataFim, modo),
  save: (type: string, osId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT.SAVE_PDF, type, osId),
};
