import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { hashPassword } from '../services/password.service';

function getDatabasePath(): string {
  if (app?.isPackaged) {
    return path.join(app.getPath('userData'), 'ostech.db');
  }
  return path.join(process.cwd(), 'prisma', 'ostech.db');
}

function getGeneratedPath(): string {
  if (app?.isPackaged) {
    return path.join(app.getAppPath(), 'src', 'main', 'database', 'generated');
  }
  return path.join(__dirname, '..', '..', 'src', 'main', 'database', 'generated');
}

function getPreSeedDbPath(): string {
  if (app?.isPackaged) {
    return path.join(process.resourcesPath, 'db', 'ostech.db');
  }
  return path.join(process.cwd(), 'resources', 'db', 'ostech.db');
}

const { PrismaClient } = require(getGeneratedPath());

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${getDatabasePath()}`,
    },
  },
});

async function copyPreSeedDb(targetPath: string): Promise<void> {
  const sourcePath = getPreSeedDbPath();
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Banco pre-semeado nao encontrado em: ${sourcePath}`);
  }
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(sourcePath, targetPath);
}

export async function connectDatabase(): Promise<void> {
  const targetPath = getDatabasePath();

  if (!fs.existsSync(targetPath)) {
    await copyPreSeedDb(targetPath);
  }

  await prisma.$connect();

  try {
    const adminCount = await prisma.usuario.count({ where: { login: 'admin' } });
    if (adminCount === 0) {
      const senhaHash = hashPassword('admin123');
      await prisma.usuario.create({
        data: {
          nome: 'Admin OS.Tech',
          login: 'admin',
          senhaHash,
          perfil: 'PROPRIETARIO',
          ativo: true,
        },
      });
    }
  } catch {
    await prisma.$disconnect().catch(() => {});
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    await copyPreSeedDb(targetPath);
    await prisma.$connect();
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
