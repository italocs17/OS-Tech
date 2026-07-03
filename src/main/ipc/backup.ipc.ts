/**
 * OS.Tech - Handlers IPC de Backup
 * Registra os canais de comunicacao para a entidade Backup.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { BackupService } from '../services/backup.service';

const backupService = new BackupService();

export function registerBackupIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.BACKUP.CREATE, async (_, usuarioId: number, type: 'auto' | 'manual') => {
    return backupService.createBackup(usuarioId, type);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP.LIST, async () => {
    return backupService.listBackups();
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP.RESTORE, async (_, filename: string, usuarioId: number) => {
    return backupService.restoreBackup(filename, usuarioId);
  });
}
