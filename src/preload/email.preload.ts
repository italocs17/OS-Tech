import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const emailAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.LIST),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.GET, id),
  listByStatus: (status: string) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.LIST_BY_STATUS, status),
  countPending: () => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.COUNT_PENDING),
  checkMail: (usuarioId: number) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.CHECK_MAIL, usuarioId),
  linkClient: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.LINK_CLIENT, data),
  convertToOS: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.CONVERT_TO_OS, data),
  reject: (id: number, usuarioId: number, motivo?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.EMAIL.REJECT, id, usuarioId, motivo),
  configGet: () => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.CONFIG_GET),
  configSave: (config: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.CONFIG_SAVE, config),
  listContatos: (clienteId: number) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.LIST_CONTATOS, clienteId),
  createContato: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.CREATE_CONTATO, data),
  updateContato: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.EMAIL.UPDATE_CONTATO, id, data),
  deleteContato: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EMAIL.DELETE_CONTATO, id),
};
