import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { CategoriaServicoService } from '../services/categoria-servico.service';

const categoriaServicoService = new CategoriaServicoService();

export function registerCategoriaServicoIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.LIST, async () => {
    return categoriaServicoService.list();
  });

  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.LIST_ALL, async () => {
    return categoriaServicoService.listAll();
  });

  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.GET, async (_, id: number) => {
    return categoriaServicoService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.CREATE, async (_, data) => {
    return categoriaServicoService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.UPDATE, async (_, id: number, data) => {
    return categoriaServicoService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.CATEGORIA_SERVICO.DELETE, async (_, id: number) => {
    return categoriaServicoService.delete(id);
  });
}
