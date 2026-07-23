import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { AlertaService } from '../services/alerta.service';

const alertaService = new AlertaService();

export function registerAlertaIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.ALERTA.LIST, async () => {
    return alertaService.getAlertas();
  });

  ipcMain.handle(IPC_CHANNELS.ALERTA.COUNT, async () => {
    return alertaService.countAlertas();
  });

  ipcMain.handle(IPC_CHANNELS.ALERTA.CONFIG_GET, async () => {
    return alertaService.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.ALERTA.CONFIG_SAVE, async (_, config) => {
    return alertaService.saveConfig(config);
  });
}
