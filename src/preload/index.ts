import { contextBridge } from 'electron';
import { clientAPI } from './client.preload';
import { equipmentAPI } from './equipment.preload';
import { osAPI } from './os.preload';
import { userAPI } from './user.preload';
import { inventoryAPI } from './inventory.preload';
import { backupAPI, reportAPI } from './report.preload';
import { logAPI } from './log.preload';
import { servicoAPI } from './servico.preload';
import { pecaAPI } from './peca.preload';
import { emailAPI } from './email.preload';

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
  peca: pecaAPI,
  email: emailAPI,
});
