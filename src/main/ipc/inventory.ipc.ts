/**
 * OS.Tech - Handlers IPC de Inventario
 * Registra os canais de comunicacao para a entidade Inventario.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { InventarioService } from '../services/inventario.service';

const inventarioService = new InventarioService();

export function registerInventoryIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.INVENTORY.GET, async (_, osId: number) => {
    return inventarioService.getByOSId(osId);
  });

  ipcMain.handle(IPC_CHANNELS.INVENTORY.LIST, async () => {
    return inventarioService.count();
  });

  ipcMain.handle(IPC_CHANNELS.INVENTORY.DELETE, async (_, osId: number) => {
    return inventarioService.delete(osId);
  });

  ipcMain.handle(IPC_CHANNELS.INVENTORY.SAVE_MANUAL, async (_, osId: number, data, usuarioId: number) => {
    return inventarioService.saveManual(osId, data, usuarioId);
  });

  ipcMain.handle(IPC_CHANNELS.INVENTORY.LIST_BY_OS, async (_, osId: number) => {
    return inventarioService.getAllByOSId(osId);
  });

  ipcMain.handle(IPC_CHANNELS.INVENTORY.LIST_BY_EQUIPAMENTO, async (_, equipamentoId: number) => {
    return inventarioService.getByEquipamento(equipamentoId);
  });
}
