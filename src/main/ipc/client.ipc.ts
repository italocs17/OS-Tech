/**
 * OS.Tech - Handlers IPC de Cliente
 * Registra os canais de comunicacao para operacoes com clientes.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { ClienteService } from '../services/client.service';

const clientService = new ClienteService();

export function registerClientIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.CLIENT.LIST, async () => {
    return clientService.list();
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.GET, async (_, id: number) => {
    return clientService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.CREATE, async (_, data) => {
    return clientService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.UPDATE, async (_, id: number, data) => {
    return clientService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.DELETE, async (_, id: number) => {
    return clientService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.SET_CONTATO_PADRAO, async (_, clienteId: number, contatoId: number) => {
    return clientService.setContatoPadrao(clienteId, contatoId);
  });
}
