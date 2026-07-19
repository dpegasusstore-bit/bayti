import crypto from 'crypto';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { prisma } from '../db-store.js';

// AES-256-CBC Encryption configuration for backups
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.JWT_SECRET || 'BaytiAI_Backup_Encrypt_Secret_2026',
  'bayti-salt-2026',
  32
);
const IV_LENGTH = 16;

/**
 * Encrypts a plain-text string using AES-256-CBC.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts an encrypted hex string.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('صيغة ملف النسخ الاحتياطي غير صالحة أو مشوهة.');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedHex = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates the full structured data backup payload for a specific user.
 */
export async function getBackupPayload(userId: string) {
  const [
    profile,
    familyMembers,
    income,
    expenses,
    bills,
    installments,
    associations,
    savingsGoals,
    notifications,
    aiRequests,
    settings,
    categories,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.familyMember.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.bill.findMany({ where: { userId } }),
    prisma.installment.findMany({ where: { userId } }),
    prisma.association.findMany({ where: { userId } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.aIRequest.findMany({ where: { userId } }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.expenseCategory.findMany(),
  ]);

  return {
    version: '1.0',
    profile,
    familyMembers,
    income,
    expenses,
    bills,
    installments,
    associations,
    savingsGoals,
    notifications,
    aiRequests,
    settings,
    categories,
  };
}

/**
 * Creates a physical encrypted backup record in the PostgreSQL database.
 */
export async function createBackup(userId: string, type: 'manual' | 'auto_daily' | 'auto_weekly' | 'auto_monthly') {
  const payload = await getBackupPayload(userId);
  const jsonStr = JSON.stringify(payload);
  const encrypted = encrypt(jsonStr);
  const sizeBytes = Buffer.byteLength(encrypted);

  const backup = await prisma.backup.create({
    data: {
      userId,
      size: sizeBytes,
      version: '1.0',
      type,
      encryptedData: encrypted,
    },
  });

  return {
    id: backup.id,
    createdAt: backup.createdAt,
    size: backup.size,
    version: backup.version,
    type: backup.type,
  };
}

/**
 * Restores a specific backup and merges or replaces existing tables.
 */
export async function restoreBackup(backupId: string, userId: string, mode: 'replace' | 'merge') {
  // Fetch backup record
  const backup = await prisma.backup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error('النسخة الاحتياطية المطلوبة غير موجودة.');
  }

  // Verify Ownership Security
  if (backup.userId !== userId) {
    throw new Error('غير مصرح لك باستعادة هذه النسخة الاحتياطية.');
  }

  // Decrypt backup payload
  const decryptedStr = decrypt(backup.encryptedData);
  const payload = JSON.parse(decryptedStr);

  if (mode === 'replace') {
    // 1. Delete all current tables for this user inside transaction
    await prisma.$transaction([
      prisma.familyMember.deleteMany({ where: { userId } }),
      prisma.income.deleteMany({ where: { userId } }),
      prisma.expense.deleteMany({ where: { userId } }),
      prisma.bill.deleteMany({ where: { userId } }),
      prisma.installment.deleteMany({ where: { userId } }),
      prisma.association.deleteMany({ where: { userId } }),
      prisma.savingsGoal.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.aIRequest.deleteMany({ where: { userId } }),
    ]);

    // Update Profile and Settings if present
    if (payload.profile) {
      await prisma.profile.update({
        where: { userId },
        data: {
          fullName: payload.profile.fullName,
          phone: payload.profile.phone,
          country: payload.profile.country || 'مصر',
          currency: payload.profile.currency || 'EGP',
          language: payload.profile.language || 'ar',
        },
      });
    }

    if (payload.settings) {
      await prisma.settings.upsert({
        where: { userId },
        update: {
          theme: payload.settings.theme !== undefined ? payload.settings.theme : undefined,
          enableNotifications: payload.settings.enableNotifications !== undefined ? payload.settings.enableNotifications : undefined,
          isPasscodeEnabled: payload.settings.isPasscodeEnabled !== undefined ? !!payload.settings.isPasscodeEnabled : undefined,
          isFaceIdEnabled: payload.settings.isFaceIdEnabled !== undefined ? !!payload.settings.isFaceIdEnabled : undefined,
          hideFinancialValues: payload.settings.hideFinancialValues !== undefined ? !!payload.settings.hideFinancialValues : undefined,
          hideNotificationsContent: payload.settings.hideNotificationsContent !== undefined ? !!payload.settings.hideNotificationsContent : undefined,
        },
        create: {
          userId,
          theme: payload.settings.theme || 'light',
          enableNotifications: payload.settings.enableNotifications !== false,
          isPasscodeEnabled: !!payload.settings.isPasscodeEnabled,
          isFaceIdEnabled: !!payload.settings.isFaceIdEnabled,
          hideFinancialValues: !!payload.settings.hideFinancialValues,
          hideNotificationsContent: !!payload.settings.hideNotificationsContent,
        },
      });
    }

    // Restore tables
    if (payload.familyMembers?.length) {
      await prisma.familyMember.createMany({ data: payload.familyMembers.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.income?.length) {
      await prisma.income.createMany({ data: payload.income.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.expenses?.length) {
      await prisma.expense.createMany({ data: payload.expenses.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.bills?.length) {
      await prisma.bill.createMany({ data: payload.bills.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.installments?.length) {
      await prisma.installment.createMany({ data: payload.installments.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.associations?.length) {
      await prisma.association.createMany({ data: payload.associations.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.savingsGoals?.length) {
      await prisma.savingsGoal.createMany({ data: payload.savingsGoals.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.notifications?.length) {
      await prisma.notification.createMany({ data: payload.notifications.map((x: any) => ({ ...x, userId })) });
    }
    if (payload.aiRequests?.length) {
      await prisma.aIRequest.createMany({ data: payload.aiRequests.map((x: any) => ({ ...x, userId })) });
    }
  } else {
    // Merge mode: Insert only records that don't already exist to prevent duplicates
    const [
      existingFamily,
      existingIncome,
      existingExpenses,
      existingBills,
      existingInstallments,
      existingAssociations,
      existingGoals,
      existingNotifications,
      existingAiHistory,
    ] = await Promise.all([
      prisma.familyMember.findMany({ where: { userId }, select: { id: true } }),
      prisma.income.findMany({ where: { userId }, select: { id: true } }),
      prisma.expense.findMany({ where: { userId }, select: { id: true } }),
      prisma.bill.findMany({ where: { userId }, select: { id: true } }),
      prisma.installment.findMany({ where: { userId }, select: { id: true } }),
      prisma.association.findMany({ where: { userId }, select: { id: true } }),
      prisma.savingsGoal.findMany({ where: { userId }, select: { id: true } }),
      prisma.notification.findMany({ where: { userId }, select: { id: true } }),
      prisma.aIRequest.findMany({ where: { userId }, select: { id: true } }),
    ]);

    const familyIds = new Set(existingFamily.map((x) => x.id));
    const incomeIds = new Set(existingIncome.map((x) => x.id));
    const expenseIds = new Set(existingExpenses.map((x) => x.id));
    const billIds = new Set(existingBills.map((x) => x.id));
    const installmentIds = new Set(existingInstallments.map((x) => x.id));
    const associationIds = new Set(existingAssociations.map((x) => x.id));
    const goalIds = new Set(existingGoals.map((x) => x.id));
    const notificationIds = new Set(existingNotifications.map((x) => x.id));
    const aiIds = new Set(existingAiHistory.map((x) => x.id));

    if (payload.familyMembers?.length) {
      const filtered = payload.familyMembers.filter((x: any) => !familyIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.familyMember.createMany({ data: filtered });
    }
    if (payload.income?.length) {
      const filtered = payload.income.filter((x: any) => !incomeIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.income.createMany({ data: filtered });
    }
    if (payload.expenses?.length) {
      const filtered = payload.expenses.filter((x: any) => !expenseIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.expense.createMany({ data: filtered });
    }
    if (payload.bills?.length) {
      const filtered = payload.bills.filter((x: any) => !billIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.bill.createMany({ data: filtered });
    }
    if (payload.installments?.length) {
      const filtered = payload.installments.filter((x: any) => !installmentIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.installment.createMany({ data: filtered });
    }
    if (payload.associations?.length) {
      const filtered = payload.associations.filter((x: any) => !associationIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.association.createMany({ data: filtered });
    }
    if (payload.savingsGoals?.length) {
      const filtered = payload.savingsGoals.filter((x: any) => !goalIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.savingsGoal.createMany({ data: filtered });
    }
    if (payload.notifications?.length) {
      const filtered = payload.notifications.filter((x: any) => !notificationIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.notification.createMany({ data: filtered });
    }
    if (payload.aiRequests?.length) {
      const filtered = payload.aiRequests.filter((x: any) => !aiIds.has(x.id)).map((x: any) => ({ ...x, userId }));
      if (filtered.length) await prisma.aIRequest.createMany({ data: filtered });
    }
  }

  // Restore custom categories if present
  if (payload.categories?.length) {
    for (const cat of payload.categories) {
      await prisma.expenseCategory.upsert({
        where: { name: cat.name },
        update: {},
        create: {
          name: cat.name,
          icon: cat.icon,
        },
      });
    }
  }

  return { success: true };
}

/**
 * Dynamic premium scheduler for daily, weekly, and monthly backups.
 */
export async function checkAndRunAutoBackups(userId: string) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile || profile.subscription !== 'Premium') {
      return; // Free users do not trigger auto backups
    }

    const backups = await prisma.backup.findMany({
      where: { userId, type: { in: ['auto_daily', 'auto_weekly', 'auto_monthly'] } },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    const lastDaily = backups.find((b) => b.type === 'auto_daily');
    const lastWeekly = backups.find((b) => b.type === 'auto_weekly');
    const lastMonthly = backups.find((b) => b.type === 'auto_monthly');

    if (!lastDaily || now.getTime() - new Date(lastDaily.createdAt).getTime() >= oneDayMs) {
      console.log(`[Auto Backup] Creating daily backup for premium user: ${userId}`);
      await createBackup(userId, 'auto_daily');
    }

    if (!lastWeekly || now.getTime() - new Date(lastWeekly.createdAt).getTime() >= sevenDaysMs) {
      console.log(`[Auto Backup] Creating weekly backup for premium user: ${userId}`);
      await createBackup(userId, 'auto_weekly');
    }

    if (!lastMonthly || now.getTime() - new Date(lastMonthly.createdAt).getTime() >= thirtyDaysMs) {
      console.log(`[Auto Backup] Creating monthly backup for premium user: ${userId}`);
      await createBackup(userId, 'auto_monthly');
    }
  } catch (err) {
    console.error('[Auto Backup Scheduler Error]:', err);
  }
}

/**
 * Compiles specific sections of user data into a clean structure for exporting.
 */
export async function getExportData(userId: string, type: 'all' | 'expenses' | 'income' | 'reports' | 'goals' | 'family') {
  const data: any = {};

  if (type === 'all' || type === 'expenses') {
    data.expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  if (type === 'all' || type === 'income') {
    data.income = await prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  if (type === 'all' || type === 'reports') {
    data.reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (type === 'all' || type === 'goals') {
    data.goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (type === 'all' || type === 'family') {
    data.family = await prisma.familyMember.findMany({
      where: { userId },
    });
  }

  if (type === 'all') {
    data.profile = await prisma.profile.findUnique({ where: { userId } });
    data.bills = await prisma.bill.findMany({ where: { userId } });
    data.installments = await prisma.installment.findMany({ where: { userId } });
    data.associations = await prisma.association.findMany({ where: { userId } });
    data.settings = await prisma.settings.findUnique({ where: { userId } });
  }

  return data;
}

/**
 * Exports compiled user data to CSV string format.
 */
export function generateCsv(data: any): string {
  let csv = '\uFEFF'; // UTF-8 BOM for correct Arabic encoding in Excel

  for (const [sheetName, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    csv += `=== ${sheetName.toUpperCase()} ===\n`;
    const headers = Object.keys(rows[0]).filter((k) => k !== 'userId' && k !== 'encryptedData');
    csv += headers.join(',') + '\n';

    for (const row of rows) {
      const line = headers.map((header) => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csv += line.join(',') + '\n';
    }
    csv += '\n';
  }

  return csv;
}

/**
 * Exports compiled user data into standard Microsoft Excel XLSX binary buffer.
 */
export function generateExcel(data: any): Buffer {
  const wb = XLSX.utils.book_new();

  for (const [sheetName, rows] of Object.entries(data)) {
    if (sheetName === 'profile' || sheetName === 'settings') {
      // 1:1 object format
      const sheetData = Object.entries(rows || {}).map(([k, v]) => ({
        Field: k,
        Value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else if (Array.isArray(rows)) {
      // Array array
      const cleanedRows = rows.map((r: any) => {
        const cleaned: any = {};
        for (const [k, v] of Object.entries(r)) {
          if (k !== 'userId' && k !== 'encryptedData') {
            cleaned[k] = typeof v === 'object' ? JSON.stringify(v) : v;
          }
        }
        return cleaned;
      });
      const ws = XLSX.utils.json_to_sheet(cleanedRows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates an elegant PDF document summarizing the user data.
 */
export function generatePdf(data: any, titleText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title & Branding
      doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('Bayti AI Financial Export', { align: 'center' });
      doc.fontSize(12).fillColor('#64748b').text(`Type: ${titleText} | Export Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Render tables or key-values
      for (const [sectionName, rows] of Object.entries(data)) {
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(sectionName.toUpperCase());
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#cbd5e1').lineWidth(1).stroke();
        doc.moveDown(0.5);

        if (sectionName === 'profile' || sectionName === 'settings') {
          const obj = rows as any;
          if (obj) {
            for (const [k, v] of Object.entries(obj)) {
              if (typeof v !== 'object') {
                doc.fontSize(10).font('Helvetica').fillColor('#334155').text(`${k}: `, { continued: true }).font('Helvetica-Bold').text(String(v));
              }
            }
          }
        } else if (Array.isArray(rows)) {
          if (rows.length === 0) {
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#94a3b8').text('No records available in this section.');
          } else {
            // Display first 15 records to keep PDF size and layout optimal
            const sliced = rows.slice(0, 15);
            for (const item of sliced) {
              const title = item.title || item.fullName || item.name || item.id || 'Record';
              const subtitle = item.amount ? `${item.amount} EGP` : item.date || item.phone || '';
              doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`${title}`, { continued: true }).font('Helvetica').fillColor('#475569').text(` - ${subtitle}`);
            }
            if (rows.length > 15) {
              doc.fontSize(9).font('Helvetica-Oblique').fillColor('#94a3b8').text(`... and ${rows.length - 15} more records (available in Excel/CSV exports)`);
            }
          }
        }
        doc.moveDown(1.5);
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Bayti AI - Smart Family Financial Assistant 2026', doc.x, doc.page.height - 30, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
