import crypto from 'crypto';
import { prisma } from '../database/connection';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const APP_SECRET = 'OS.Tech-Email-Config-v1';

function deriveKey(): Buffer {
  return crypto.scryptSync(APP_SECRET, 'ostech-email-salt', 32);
}

function encrypt(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const key = deriveKey();
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class EmailConfigService {
  async getConfig(): Promise<{ email: string; appPassword: string } | null> {
    const configEmail = await prisma.configuracao.findUnique({
      where: { chave: 'email_imap_user' },
    });
    const configPass = await prisma.configuracao.findUnique({
      where: { chave: 'email_imap_pass' },
    });

    if (!configEmail?.valor || !configPass?.valor) {
      return null;
    }

    return {
      email: configEmail.valor,
      appPassword: decrypt(configPass.valor),
    };
  }

  async saveConfig(email: string, appPassword: string): Promise<void> {
    const encryptedPass = encrypt(appPassword);

    await prisma.configuracao.upsert({
      where: { chave: 'email_imap_user' },
      update: { valor: email },
      create: { chave: 'email_imap_user', valor: email },
    });

    await prisma.configuracao.upsert({
      where: { chave: 'email_imap_pass' },
      update: { valor: encryptedPass },
      create: { chave: 'email_imap_pass', valor: encryptedPass },
    });
  }

  async hasConfig(): Promise<boolean> {
    const config = await this.getConfig();
    return config !== null && config.email.length > 0 && config.appPassword.length > 0;
  }
}
