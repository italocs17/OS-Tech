import { contextBridge, ipcRenderer } from 'electron';
import { clientAPI } from './client.preload';
import { equipmentAPI } from './equipment.preload';
import { osAPI } from './os.preload';
import { userAPI } from './user.preload';
import { inventoryAPI } from './inventory.preload';
import { backupAPI, reportAPI } from './report.preload';
import { logAPI } from './log.preload';
import { servicoAPI } from './servico.preload';
import { categoriaServicoAPI } from './categoria-servico.preload';
import { subcategoriaServicoAPI } from './subcategoria-servico.preload';
import { pecaAPI } from './peca.preload';
import { emailAPI } from './email.preload';
import { equipeAPI } from './equipe.preload';

const eventAPI = {
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ['email:new-found'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

contextBridge.exposeInMainWorld('osTech', {
  client: clientAPI,
  equipment: equipmentAPI,
  os: osAPI,
  user: userAPI,
  inventory: inventoryAPI,
  backup: backupAPI,
  report: reportAPI,
  log: logAPI,
  servico: servicoAPI,
  categoriaServico: categoriaServicoAPI,
  subcategoriaServico: subcategoriaServicoAPI,
  equipe: equipeAPI,
  peca: pecaAPI,
  email: emailAPI,
  events: eventAPI,
});
