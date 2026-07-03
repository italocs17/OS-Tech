/**
 * OS.Tech - Handlers IPC de Ordem de Servico
 * Registra os canais de comunicacao para operacoes com OS, eventos e itens.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { OSService } from '../services/os.service';

const osService = new OSService();

export function registerOSIpcHandlers() {
  // ---------------------------------------------------------------------------
  // LIST
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.LIST, async () => {
    return osService.list();
  });

  ipcMain.handle(IPC_CHANNELS.OS.LIST_BY_CLIENT, async (_, clienteId: number) => {
    return osService.listByCliente(clienteId);
  });

  ipcMain.handle(IPC_CHANNELS.OS.LIST_BY_PERIOD, async (_, dataInicio: string, dataFim: string) => {
    return osService.listByPeriod(dataInicio, dataFim);
  });

  ipcMain.handle(IPC_CHANNELS.OS.LIST_BY_EQUIPMENT, async (_, equipamentoId: number) => {
    return osService.listByEquipamento(equipamentoId);
  });

  ipcMain.handle(IPC_CHANNELS.OS.GET, async (_, id: number) => {
    return osService.getById(id);
  });

  // ---------------------------------------------------------------------------
  // CREATE (recebe data + usuarioId)
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.CREATE, async (_, data, usuarioId: number) => {
    return osService.create(data, usuarioId);
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.UPDATE, async (_, id: number, data) => {
    return osService.update(id, data);
  });

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.DELETE, async (_, id: number) => {
    return osService.delete(id);
  });

  // ---------------------------------------------------------------------------
  // CHANGE_STATUS (id + status + usuarioId)
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.OS.CHANGE_STATUS,
    async (_, id: number, status, usuarioId: number) => {
      return osService.changeStatus(id, status, usuarioId);
    }
  );

  // ---------------------------------------------------------------------------
  // ADD_EVENT
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.ADD_EVENT, async (_, data) => {
    return osService.addEvento(data);
  });

  // ---------------------------------------------------------------------------
  // ADD_ITEM
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.ADD_ITEM, async (_, data) => {
    return osService.addItem(data);
  });

  // ---------------------------------------------------------------------------
  // REMOVE_ITEM
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.REMOVE_ITEM, async (_, id: number) => {
    return osService.removeItem(id);
  });

  // ---------------------------------------------------------------------------
  // GET_ITENS
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.GET_ITENS, async (_, osId: number) => {
    return osService.getItens(osId);
  });

  // ---------------------------------------------------------------------------
  // GET_EVENTOS
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.GET_EVENTOS, async (_, osId: number) => {
    return osService.getEventos(osId);
  });

  // ---------------------------------------------------------------------------
  // CALCULAR_TOTAL
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.CALCULAR_TOTAL, async (_, osId: number) => {
    return osService.calcularTotal(osId);
  });

  // ---------------------------------------------------------------------------
  // COUNT_BY_STATUS
  // ---------------------------------------------------------------------------
  ipcMain.handle(IPC_CHANNELS.OS.COUNT_BY_STATUS, async () => {
    return osService.countByStatus();
  });
}
