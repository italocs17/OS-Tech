import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { EquipeService } from '../services/equipe.service';

const equipeService = new EquipeService();

export function registerEquipeIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.EQUIPE.LIST, async () => {
    return equipeService.list();
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.LIST_ALL, async () => {
    return equipeService.listAll();
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.GET, async (_, id: number) => {
    return equipeService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.CREATE, async (_, data) => {
    return equipeService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.UPDATE, async (_, id: number, data) => {
    return equipeService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.DELETE, async (_, id: number) => {
    return equipeService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.ADD_USUARIO, async (_, equipeId: number, usuarioId: number) => {
    return equipeService.addUsuario(equipeId, usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.REMOVE_USUARIO, async (_, equipeId: number, usuarioId: number) => {
    return equipeService.removeUsuario(equipeId, usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPE.GET_BY_USUARIO, async (_, usuarioId: number) => {
    return equipeService.getEquipesByUsuario(usuarioId);
  });
}
