import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { PecaService } from '../services/peca.service';

const pecaService = new PecaService();

export function registerPecaIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.PECA.LIST, async () => {
    return pecaService.list();
  });

  ipcMain.handle(IPC_CHANNELS.PECA.GET, async (_, id: number) => {
    return pecaService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.PECA.CREATE, async (_, data) => {
    return pecaService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.PECA.UPDATE, async (_, id: number, data) => {
    return pecaService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.PECA.DELETE, async (_, id: number) => {
    return pecaService.delete(id);
  });
}
