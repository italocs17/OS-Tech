import crypto from 'crypto';

const KEY_LENGTH = 64;
const ITERATIONS = 210000;
const DIGEST = 'sha512';
const SALT_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const computed = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}
