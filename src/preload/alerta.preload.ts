import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';

export const alertaAPI = {
  list: () => ipcRenderer.invoke(IPC_CHANNELS.ALERTA.LIST),
  count: () => ipcRenderer.invoke(IPC_CHANNELS.ALERTA.COUNT),
  configGet: () => ipcRenderer.invoke(IPC_CHANNELS.ALERTA.CONFIG_GET),
  configSave: (config: unknown) => ipcRenderer.invoke(IPC_CHANNELS.ALERTA.CONFIG_SAVE, config),
};
