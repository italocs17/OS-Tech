import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const equipeAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.LIST),
  get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.GET, id),
  create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.CREATE, data),
  update: (id: number, data: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.UPDATE, id, data),
  delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.DELETE, id),
  addUsuario: (equipeId: number, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.ADD_USUARIO, equipeId, usuarioId),
  removeUsuario: (equipeId: number, usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.REMOVE_USUARIO, equipeId, usuarioId),
  getByUsuario: (usuarioId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.EQUIPE.GET_BY_USUARIO, usuarioId),
};
