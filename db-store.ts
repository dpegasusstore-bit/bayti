import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Interface declarations
export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
  verified: boolean;
  verificationToken?: string;
  resetToken?: string;
}

export interface DbProfile {
  userId: string;
  fullName: string;
  phone: string;
  country: string;
  currency: string;
  language: string;
  subscription: 'Standard' | 'Premium';
  profilePicture?: string;
  createdDate: string;
  lastLogin: string;
  subscriptionExpiryDate?: string; // ISO Date String
  aiUsageCount?: number;
  limitResetDate?: string; // ISO Date String
}

export interface DbSubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  plan: 'Premium';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  paymentMethod: string;
  vodafoneNumberUsed?: string;
  senderNumber?: string;
  screenshotBase64: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
  actionDate?: string;
  rejectionReason?: string;
}

export interface DbSystemConfig {
  monthlyPrice: number;
  yearlyPrice: number;
  vodafoneNumber: string;
  featureFlags: {
    betaFeatures: boolean;
    maintenanceMode: boolean;
    forceUpdate: boolean;
    aiInsightsEngine: boolean;
    voiceInputPremium: boolean;
  };
}

export interface DbOnboarding {
  userId: string;
  onboardingCompleted: boolean;
  salary: number;
  otherIncome: number;
  familyMembersCount: number;
  ownsCar: boolean;
  paysInstallments: boolean;
  participatesInGroup: boolean;
  homeStatus: 'rent' | 'own';
  wantsGoals: boolean;
}

export interface DbSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  device: string;
  platform: string;
  browser: string;
  ip: string;
  country: string;
  isActive: boolean;
}

export interface DbLoginHistory {
  id: string;
  userId: string;
  loginDate: string;
  logoutDate: string | null;
  ip: string;
  country: string;
  browser: string;
  device: string;
  platform: string;
}

export interface DbExpense {
  userId: string;
  id: string;
  title: string;
  amount: number;
  date: string;
  time: string;
  category: string;
  merchant: string;
  paymentMethod: string;
  vat: number;
  recordedBy: string;
  notes: string;
  tags: string[];
}

export interface DbFamilyMember {
  userId: string;
  id: string;
  name: string;
  avatar: string;
  monthlyBudget: number;
  spentThisMonth: number;
  role: string;
}

export interface DbReminder {
  userId: string;
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'upcoming' | 'completed' | 'missed';
}

export interface DbNotification {
  userId: string;
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface DatabaseSchema {
  users: DbUser[];
  profiles: DbProfile[];
  onboarding: DbOnboarding[];
  sessions: DbSession[];
  loginHistory: DbLoginHistory[];
  expenses: DbExpense[];
  familyMembers: DbFamilyMember[];
  reminders: DbReminder[];
  notifications: DbNotification[];
  subscriptionRequests?: DbSubscriptionRequest[];
  systemConfig?: DbSystemConfig;
}

// Default/Initial State
const initialDbState: DatabaseSchema = {
  users: [],
  profiles: [],
  onboarding: [],
  sessions: [],
  loginHistory: [],
  expenses: [],
  familyMembers: [],
  reminders: [],
  notifications: [],
  subscriptionRequests: [],
  systemConfig: {
    monthlyPrice: 99,
    yearlyPrice: 599,
    vodafoneNumber: '01002345678',
    featureFlags: {
      betaFeatures: false,
      maintenanceMode: false,
      forceUpdate: false,
      aiInsightsEngine: true,
      voiceInputPremium: false
    }
  }
};

// Utility to read database
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDbState, null, 2), 'utf-8');
      return initialDbState;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data) as DatabaseSchema;

    // Self-healing migrations for backwards-compatibility
    let changed = false;
    if (!parsed.subscriptionRequests) {
      parsed.subscriptionRequests = [];
      changed = true;
    }
    if (!parsed.systemConfig) {
      parsed.systemConfig = {
        monthlyPrice: 99,
        yearlyPrice: 599,
        vodafoneNumber: '01002345678',
        featureFlags: {
          betaFeatures: false,
          maintenanceMode: false,
          forceUpdate: false,
          aiInsightsEngine: true,
          voiceInputPremium: false
        }
      };
      changed = true;
    }
    parsed.profiles.forEach(p => {
      if (p.aiUsageCount === undefined) {
        p.aiUsageCount = 0;
        changed = true;
      }
      if (!p.limitResetDate) {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        p.limitResetDate = d.toISOString();
        changed = true;
      }
    });

    if (changed) {
      writeDb(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error reading DB file, returning empty state:', err);
    return initialDbState;
  }
}

// Utility to write database
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// Hash password with SHA-256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate secure random string
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Seed admin account from environment or default config
export function seedAdminUser(): void {
  const db = readDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bayti-ai.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Bayti2026';
  const adminPasswordHash = hashPassword(adminPassword);

  const adminExists = db.users.some(u => u.email.toLowerCase() === adminEmail.toLowerCase() && u.role === 'ADMIN');
  if (!adminExists) {
    const adminId = 'usr_admin_' + generateToken(8);
    
    // Add Admin user
    db.users.push({
      id: adminId,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      verified: true
    });

    // Add Admin profile
    db.profiles.push({
      userId: adminId,
      fullName: 'مدير النظام (Admin)',
      phone: '+201000000000',
      country: 'مصر',
      currency: 'EGP',
      language: 'ar',
      subscription: 'Premium',
      profilePicture: '🦁',
      createdDate: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    writeDb(db);
    console.log(`[Database Seed] Created primary administrator account with email: ${adminEmail}`);
  }
}
