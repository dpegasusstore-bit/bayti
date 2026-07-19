import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma, generateToken } from './db-store.js';

async function bootstrap() {
  console.log('[Bootstrap] Starting one-time administrator bootstrap process...');
  
  try {
    // Check if there are any ADMIN or SUPER_ADMIN users in the database
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (existingAdmin) {
      console.log('[Bootstrap] An administrator already exists in the database. Bootstrapping is permanently disabled and bypassed.');
      process.exit(0);
    }

    const adminEmail = 'mohamedmahdy2389@gmail.com';
    const adminPassword = 'Asdka2ghost2@';
    
    // Hash password using bcrypt
    const saltRounds = 10;
    const bcryptHash = bcrypt.hashSync(adminPassword, saltRounds);
    
    const adminId = 'usr_super_admin';

    // Create the SUPER_ADMIN with nested Profile, Settings, Onboarding, and AI Usage
    await prisma.user.create({
      data: {
        id: adminId,
        email: adminEmail.toLowerCase().trim(),
        emailVerified: true,
        passwordHash: bcryptHash,
        role: 'SUPER_ADMIN',
        profile: {
          create: {
            fullName: 'المدير العام (Super Admin)',
            phone: '+201000000000',
            country: 'مصر',
            currency: 'EGP',
            language: 'ar',
            subscription: 'Premium',
            profilePicture: '👑'
          }
        },
        onboarding: {
          create: {
            onboardingCompleted: true,
            salary: 50000,
            otherIncome: 0,
            familyMembersCount: 1,
            ownsCar: true,
            paysInstallments: false,
            participatesInGroup: false,
            homeStatus: 'own',
            wantsGoals: true
          }
        },
        settings: {
          create: {
            theme: 'light',
            enableNotifications: true,
            betaFeatures: true
          }
        },
        aiUsage: {
          create: {
            requestsCount: 0,
            tokensCount: 0,
            monthlyLimit: 100000
          }
        }
      }
    });

    console.log(`[Bootstrap] Successfully created primary SUPER_ADMIN account: ${adminEmail}`);
    console.log('[Bootstrap] One-time bootstrap has been completed and is now permanently disabled.');
    process.exit(0);
  } catch (error) {
    console.error('[Bootstrap] Error executing one-time admin bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
