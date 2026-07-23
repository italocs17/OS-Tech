import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { ContratoService } from '../services/contrato.service';

const contratoService = new ContratoService();

export function registerContratoIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.CONTRATO.LIST, async () => {
    return contratoService.list();
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.LIST_ALL, async () => {
    return contratoService.listAll();
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.GET, async (_, id: number) => {
    return contratoService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.LIST_BY_CLIENTE, async (_, clienteId: number) => {
    return contratoService.listByCliente(clienteId);
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.CREATE, async (_, data) => {
    return contratoService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.UPDATE, async (_, id: number, data) => {
    return contratoService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.CONTRATO.DELETE, async (_, id: number) => {
    return contratoService.delete(id);
  });
}
