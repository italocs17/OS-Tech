import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { SubcategoriaServicoService } from '../services/subcategoria-servico.service';

const subcategoriaServicoService = new SubcategoriaServicoService();

export function registerSubcategoriaServicoIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.LIST, async () => {
    return subcategoriaServicoService.list();
  });

  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.GET, async (_, id: number) => {
    return subcategoriaServicoService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.GET_BY_CATEGORIA, async (_, categoriaId: number) => {
    return subcategoriaServicoService.getByCategoria(categoriaId);
  });

  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.CREATE, async (_, data) => {
    return subcategoriaServicoService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.UPDATE, async (_, id: number, data) => {
    return subcategoriaServicoService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.SUBCATEGORIA_SERVICO.DELETE, async (_, id: number) => {
    return subcategoriaServicoService.delete(id);
  });
}
