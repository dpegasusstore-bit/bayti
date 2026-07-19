import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('[Database] DATABASE_URL environment variable is missing.');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// Hash password with highly secure PBKDF2 algorithm (with salt)
export function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

// Verify a plain-text password against a stored secure PBKDF2, bcrypt, or fallback SHA-256 hash
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Support bcrypt hashes (e.g. for super_admin)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch (err) {
      console.error('[verifyPassword] bcrypt verification failed:', err);
      return false;
    }
  }
  
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const [_, iterations, salt, hash] = parts;
      const computedHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations, 10), 64, 'sha512').toString('hex');
      return computedHash === hash;
    }
  }
  
  // Backwards compatibility fallback to SHA-256
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  return sha256Hash === storedHash;
}

// Generate secure random string
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
