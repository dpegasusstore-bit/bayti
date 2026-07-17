import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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

// Verify a plain-text password against a stored secure PBKDF2 or fallback SHA-256 hash
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  
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

// Seed admin account into PostgreSQL database if not exists
export async function seedAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bayti-ai.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Bayti2026';
  const adminPasswordHash = hashPassword(adminPassword);

  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        email: { equals: adminEmail, mode: 'insensitive' },
        role: 'ADMIN',
      },
    });

    if (!adminExists) {
      const adminId = 'usr_admin_' + generateToken(8);
      
      // Create User with nested Profile, Settings and Onboarding using a single Prisma transaction!
      await prisma.user.create({
        data: {
          id: adminId,
          email: adminEmail.toLowerCase().trim(),
          emailVerified: true,
          role: 'ADMIN',
          profile: {
            create: {
              fullName: 'مدير النظام (Admin)',
              phone: '+201000000000',
              country: 'مصر',
              currency: 'EGP',
              language: 'ar',
              subscription: 'Premium',
              profilePicture: '🦁',
            },
          },
          onboarding: {
            create: {
              onboardingCompleted: true,
              salary: 15000,
              otherIncome: 0,
              familyMembersCount: 1,
              ownsCar: true,
              paysInstallments: false,
              participatesInGroup: false,
              homeStatus: 'own',
              wantsGoals: true,
            },
          },
          settings: {
            create: {
              theme: 'light',
              enableNotifications: true,
              betaFeatures: false,
            },
          },
          aiUsage: {
            create: {
              requestsCount: 0,
              tokensCount: 0,
              monthlyLimit: 10000, // Admin has very high limit
            },
          },
        },
      });

      console.log(`[Database Seed] Successfully created primary administrator account: ${adminEmail}`);
    }
  } catch (error) {
    console.error('[Database Seed] Error seeding admin account:', error);
  }
}
