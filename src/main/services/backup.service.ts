/**
 * OS.Tech - Servico de Backup
 * Regras de negocio para backup e restauracao do banco de dados.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import { app } from 'electron';
import { prisma } from '../database/connection';
import { registrar } from './log.service';

export interface BackupManifest {
  backup_version: string;
  app_version: string;
  created_at: string;
  backup_type: 'auto' | 'manual';
  contents: {
    database: { file: string; size_bytes: number; sha256: string };
    inventories: { count: number; total_size_bytes: number };
  };
}

export class BackupService {
  private getBackupDir(): string {
    const configuredDir = process.env.BACKUP_DIR;
    if (configuredDir) return configuredDir;

    if (app?.isPackaged) {
      return path.join(app.getPath('documents'), 'OS.Tech', 'backups');
    }
    return path.join(process.cwd(), 'prisma', 'backups');
  }

  private async getDatabasePath(): Promise<string> {
    if (app?.isPackaged) {
      return path.join(app.getPath('userData'), 'ostech.db');
    }
    return path.join(process.cwd(), 'prisma', 'ostech.db');
  }

  async createBackup(usuarioId: number, type: 'auto' | 'manual' = 'manual'): Promise<string> {
    const backupDir = this.getBackupDir();
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
    const filename = `OSTech_Backup_${timestamp}_${type.toUpperCase()}.db.gz`;
    const backupPath = path.join(backupDir, filename);

    // Caminho do banco de dados
    const dbPath = await this.getDatabasePath();

    // Calcular SHA-256 do banco
    const dbBuffer = await fs.readFile(dbPath);
    const sha256 = crypto.createHash('sha256').update(dbBuffer).digest('hex');
    const sizeBytes = dbBuffer.length;

    // Criar arquivo comprimido com gzip
    await pipeline(
      createReadStream(dbPath),
      createGzip(),
      createWriteStream(backupPath)
    );

    // Criar manifest
    const manifest: BackupManifest = {
      backup_version: '1.0',
      app_version: '1.0.0',
      created_at: new Date().toISOString(),
      backup_type: type,
      contents: {
        database: {
          file: path.basename(dbPath),
          size_bytes: sizeBytes,
          sha256: sha256,
        },
        inventories: {
          count: await prisma.inventario.count(),
          total_size_bytes: 0,
        },
      },
    };

    await fs.writeFile(
      path.join(backupDir, `${filename}.json`),
      JSON.stringify(manifest, null, 2)
    );

    await registrar({
      nivel: 'INFO',
      categoria: 'BACKUP',
      acao: 'BACKUP_CONCLUIDO',
      descricao: `Backup ${type} criado: ${filename}`,
      usuarioId,
      dadosContexto: { filename, size_bytes: sizeBytes },
    });

    return backupPath;
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; date: Date; type: string }>> {
    const backupDir = this.getBackupDir();

    try {
      const files = await fs.readdir(backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.gz') || file.endsWith('.zip') || file.endsWith('.db')) {
          const filePath = path.join(backupDir, file);
          const stat = await fs.stat(filePath);
          backups.push({
            filename: file,
            size: stat.size,
            date: stat.mtime,
            type: file.includes('_AUTO_') ? 'Automatico' : 'Manual',
          });
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch {
      return [];
    }
  }

  async restoreBackup(backupFilename: string, usuarioId: number): Promise<void> {
    const backupDir = this.getBackupDir();
    const backupPath = path.join(backupDir, backupFilename);

    // Verificar se backup existe
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error('Backup nao encontrado');
    }

    const dbPath = await this.getDatabasePath();

    // Criar backup de seguranca do estado atual
    const safetyBackup = `PRE_RESTORE_${Date.now()}.db`;
    await fs.copyFile(dbPath, path.join(backupDir, safetyBackup));

    // Restaurar banco
    if (backupFilename.endsWith('.gz')) {
      await pipeline(
        createReadStream(backupPath),
        createGunzip(),
        createWriteStream(dbPath)
      );
    } else {
      await fs.copyFile(backupPath, dbPath);
    }

    await registrar({
      nivel: 'INFO',
      categoria: 'RESTAURACAO',
      acao: 'RESTAURACAO_CONCLUIDA',
      descricao: `Backup restaurado: ${backupFilename}`,
      usuarioId,
      dadosContexto: { backup: backupFilename },
    });
  }
}
