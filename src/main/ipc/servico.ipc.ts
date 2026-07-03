import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { ServicoService } from '../services/servico.service';

const servicoService = new ServicoService();

export function registerServicoIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.SERVICO.LIST, async () => {
    return servicoService.list();
  });

  ipcMain.handle(IPC_CHANNELS.SERVICO.GET, async (_, id: number) => {
    return servicoService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.SERVICO.CREATE, async (_, data) => {
    return servicoService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.SERVICO.UPDATE, async (_, id: number, data) => {
    return servicoService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.SERVICO.DELETE, async (_, id: number) => {
    return servicoService.delete(id);
  });
}
