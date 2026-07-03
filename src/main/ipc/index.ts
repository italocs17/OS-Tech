/**
 * OS.Tech - Registro de todos os handlers IPC
 * Centraliza o registro de todos os canais de comunicacao.
 */

import { registerClientIpcHandlers } from './client.ipc';
import { registerEquipmentIpcHandlers } from './equipment.ipc';
import { registerOSIpcHandlers } from './os.ipc';
import { registerUsuarioIpcHandlers } from './usuario.ipc';
import { registerInventoryIpcHandlers } from './inventory.ipc';
import { registerBackupIpcHandlers } from './backup.ipc';
import { registerReportIpcHandlers } from './report.ipc';
import { registerLogIpcHandlers } from './log.ipc';
import { registerServicoIpcHandlers } from './servico.ipc';
import { registerPecaIpcHandlers } from './peca.ipc';
import { registerEmailIpcHandlers } from './email.ipc';

export function registerAllIpcHandlers() {
  registerClientIpcHandlers();
  registerEquipmentIpcHandlers();
  registerOSIpcHandlers();
  registerUsuarioIpcHandlers();
  registerInventoryIpcHandlers();
  registerBackupIpcHandlers();
  registerReportIpcHandlers();
  registerLogIpcHandlers();
  registerServicoIpcHandlers();
  registerPecaIpcHandlers();
  registerEmailIpcHandlers();
}
