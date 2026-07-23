/**
 * OS.Tech - Handlers IPC de Equipamento
 * Registra os canais de comunicacao para operacoes com equipamentos.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { EquipamentoService } from '../services/equipment.service';

const equipmentService = new EquipamentoService();

export function registerEquipmentIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.LIST, async () => {
    return equipmentService.list();
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.LIST_ALL, async () => {
    return equipmentService.listAll();
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.LIST_BY_CLIENT, async (_, clienteId: number) => {
    return equipmentService.listByCliente(clienteId);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.GET, async (_, id: number) => {
    return equipmentService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.GET_BY_TAG, async (_, etiqueta: string) => {
    return equipmentService.findByEtiqueta(etiqueta);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.CREATE, async (_, data) => {
    return equipmentService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.UPDATE, async (_, id: number, data) => {
    return equipmentService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.EQUIPMENT.DELETE, async (_, id: number) => {
    return equipmentService.delete(id);
  });
}
