import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { prisma } from './db-store.js';
import { registerAuthRoutes, getSessionFromRequest } from './auth-routes.js';
import { aiService } from './server/ai-service.js';
import { uploadFile } from './server/storage-service.js';
import jwt from 'jsonwebtoken';
import { 
  createBackup, 
  restoreBackup, 
  checkAndRunAutoBackups, 
  getExportData, 
  generateCsv, 
  generateExcel, 
  generatePdf,
  decrypt
} from './server/backup-service.js';


// Administrative seeding is handled through a secure dedicated bootstrap script


const app = express();
const PORT = 3000;

// Enable cookies parsing for HTTP-only JWT secure sessions
app.use(cookieParser());

// Enable large bodies for receipt photos and voice files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware for API routes to monitor request pipeline
app.use('/api', (req, res, next) => {
  const start = Date.now();
  const token = req.headers.authorization ? 'Has Bearer' : 'No Bearer';
  const hasCookie = req.cookies?.access_token ? 'Has Cookie' : 'No Cookie';
  console.log(`[API Request] ${req.method} ${req.originalUrl || req.url} | Auth: ${token}, ${hasCookie}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API Response] ${req.method} ${req.originalUrl || req.url} | Status: ${res.statusCode} | Duration: ${duration}ms`);
  });
  next();
});

// Register authentication & user management REST APIs
registerAuthRoutes(app);

// Middleware to verify AI request limits
async function verifyAiLimits(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });
    
    if (!profile) {
      return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود.' });
    }

    // If Premium, they have UNLIMITED usage!
    if (profile.subscription === 'Premium') {
      return next();
    }

    // Retrieve or create AI usage tracker
    const usage = await prisma.aIUsage.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        requestsCount: 0,
        tokensCount: 0,
        monthlyLimit: 20,
        limitResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
      update: {},
    });

    // Check reset date for FREE tier (Standard)
    const now = new Date();
    const limitReset = usage.limitResetDate ? new Date(usage.limitResetDate) : null;
    
    if (!limitReset || limitReset < now) {
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      
      await prisma.aIUsage.update({
        where: { userId: session.userId },
        data: {
          requestsCount: 0,
          limitResetDate: nextReset,
        },
      });
      usage.requestsCount = 0;
    }

    if (usage.requestsCount >= usage.monthlyLimit) {
      return res.status(429).json({
        success: false,
        limitReached: true,
        error: 'لقد استنفدت الحد الأقصى المجاني (20 عملية ذكاء اصطناعي شهرياً).\n\nقم بالترقية للباقة الممتازة Premium للتمتع باستخدام لانهائي وميزات متقدمة فوراً!',
      });
    }

    // Store user ID to increment usage after successful operation
    (req as any).userProfileId = session.userId;
    next();
  } catch (err) {
    console.error('Error verifying AI limits:', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء فحص حدود الاستخدام للذكاء الاصطناعي.' });
  }
}

// Helper to increment AI usage in database
async function incrementAiUsage(userId: string | undefined) {
  if (!userId) return;
  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile && profile.subscription !== 'Premium') {
      await prisma.aIUsage.update({
        where: { userId },
        data: {
          requestsCount: { increment: 1 },
        },
      });
      console.log(`[AI Limit] Incremented usage for user ${userId}.`);
    }
  } catch (err) {
    console.error('Failed to increment AI usage count:', err);
  }
}

// 1. Parse Arabic Natural Text Input
app.post('/api/ai/parse-text', verifyAiLimits, async (req, res) => {
  try {
    const { text, recordedBy } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const result = await aiService.parseText(text, recordedBy);
    
    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: result.title,
      amount: result.amount,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: result.category,
      merchant: result.merchant,
      paymentMethod: result.paymentMethod,
      vat: result.vat,
      items: result.items,
      recordedBy: recordedBy || 'أحمد',
      notes: result.notes,
      tags: result.tags,
    };

    await incrementAiUsage((req as any).userProfileId);
    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-text:', error);
    res.status(500).json({ error: error.message || 'Failed to parse text' });
  }
});

// 2. Parse Receipt Photos (OCR + Structure)
app.post('/api/ai/parse-receipt', verifyAiLimits, async (req, res) => {
  try {
    const { image, recordedBy } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Base64 image is required' });
    }

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
    const result = await aiService.parseReceipt(cleanBase64, recordedBy);

    // Optimize and upload receipt image to secure cloud object storage
    const userId = (req as any).userProfileId;
    console.log(`[AI Receipt OCR] Optimizing and uploading receipt image to cloud storage for user: ${userId}`);
    let secureUrl = '';
    try {
      const buffer = Buffer.from(cleanBase64, 'base64');
      const uploadRes = await uploadFile(
        buffer,
        `receipt_${Date.now()}.jpg`,
        'image/jpeg',
        userId
      );
      secureUrl = uploadRes.url;
    } catch (err: any) {
      console.error('[AI Receipt OCR] Failed to upload receipt to cloud storage:', err);
    }

    // Connect everything with PostgreSQL by storing the ReceiptOCR record
    if (userId) {
      try {
        await prisma.receiptOCR.create({
          data: {
            userId,
            imageUrl: secureUrl || null,
            extractedContent: JSON.stringify(result),
            timestamp: new Date(),
          },
        });
        console.log(`[AI Receipt OCR] Registered ReceiptOCR inside PostgreSQL successfully.`);
      } catch (dbErr) {
        console.error('[AI Receipt OCR] Failed to write ReceiptOCR metadata to PostgreSQL:', dbErr);
      }
    }

    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: result.title || `فاتورة من ${result.merchant || 'محل'}`,
      amount: result.amount,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: result.category || 'Home',
      merchant: result.merchant,
      paymentMethod: result.paymentMethod,
      vat: result.vat,
      items: result.items,
      recordedBy: recordedBy || 'أحمد',
      notes: result.notes,
      tags: result.tags,
      imageUrl: secureUrl, // Include the secure URL in the response
    };

    await incrementAiUsage(userId);
    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-receipt:', error);
    res.status(500).json({ error: error.message || 'Failed to parse receipt photo' });
  }
});

// 3. Parse Natural Voice Input
app.post('/api/ai/parse-voice', verifyAiLimits, async (req, res) => {
  try {
    const { audio, mimeType, recordedBy } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Base64 audio is required' });
    }

    const cleanBase64 = audio.replace(/^data:audio\/\w+;base64,/, '');
    const cleanMimeType = mimeType || 'audio/webm';

    const result = await aiService.parseVoice(cleanBase64, cleanMimeType, recordedBy);

    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: result.title || 'تسجيل صوتي مالي',
      amount: result.amount,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: result.category || 'Home',
      merchant: result.merchant,
      paymentMethod: result.paymentMethod,
      vat: result.vat,
      items: result.items,
      recordedBy: recordedBy || 'أحمد',
      notes: result.notes || 'تمت الإضافة عبر التسجيل الصوتي',
      tags: result.tags,
    };

    await incrementAiUsage((req as any).userProfileId);
    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-voice:', error);
    res.status(500).json({ error: error.message || 'Failed to parse voice message' });
  }
});

// 4. Generate Family Financial Insights & Smart Advice
app.post('/api/ai/generate-insights', verifyAiLimits, async (req, res) => {
  try {
    const { expenses, familyMembers, monthlyBudget } = req.body;
    
    const insights = await aiService.generateInsights(expenses || [], familyMembers || [], monthlyBudget || 15000);
    
    // Assign stable IDs and default fields
    const formattedInsights = insights.map((insight: any, idx: number) => ({
      id: `insight_${idx}_${Date.now()}`,
      type: insight.type,
      title: insight.title,
      message: insight.message,
      category: insight.category,
      date: new Date().toISOString().split('T')[0],
    }));

    await incrementAiUsage((req as any).userProfileId);
    res.json({ success: true, insights: formattedInsights });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

// 5. AI Advisor Multi-turn Financial Chat with Advanced Financial Brain
app.post('/api/ai/chat', verifyAiLimits, async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      expenses = [], 
      familyMembers = [], 
      monthlyBudget = 15000,
      reminders = []
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const reply = await aiService.chat(message, history, {
      expenses,
      familyMembers,
      monthlyBudget,
      reminders
    });

    await incrementAiUsage((req as any).userProfileId);
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ success: false, error: error.message || 'Chat assistance failed' });
  }
});

// --- BACKUP & RESTORE & EXPORT ENDPOINTS ---

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }
    (req as any).userId = session.userId;
    next();
  } catch (err) {
    res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
  }
}

// 1. List backups
app.get('/api/backup/list', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    
    // Auto-backup check for Premium users whenever they list their backups (seamless dynamic scheduling)
    await checkAndRunAutoBackups(userId);

    const backups = await prisma.backup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        size: true,
        version: true,
        type: true,
      }
    });
    res.json({ success: true, backups });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحميل قائمة النسخ الاحتياطية.' });
  }
});

// 2. Create backup manually
app.post('/api/backup/create', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const backup = await createBackup(userId, 'manual');
    res.json({ success: true, backup });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء إنشاء نسخة احتياطية جديدة.' });
  }
});

// 3. Restore backup
app.post('/api/backup/restore', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { backupId, mode } = req.body;

    if (!backupId || !mode) {
      return res.status(400).json({ success: false, error: 'المدخلات غير مكتملة.' });
    }

    if (mode !== 'replace' && mode !== 'merge') {
      return res.status(400).json({ success: false, error: 'طريقة الاستعادة غير صالحة.' });
    }

    await restoreBackup(backupId, userId, mode);
    res.json({ success: true, message: 'تم استعادة البيانات بنجاح.' });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء استعادة النسخة الاحتياطية.' });
  }
});

// 4. Delete backup
app.delete('/api/backup/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const backupId = req.params.id;

    const backup = await prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) {
      return res.status(404).json({ success: false, error: 'النسخة الاحتياطية غير موجودة.' });
    }

    if (backup.userId !== userId) {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذه النسخة الاحتياطية.' });
    }

    await prisma.backup.delete({ where: { id: backupId } });
    res.json({ success: true, message: 'تم حذف النسخة الاحتياطية بنجاح.' });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء حذف النسخة الاحتياطية.' });
  }
});

// 5. Upload backup file to restore directly
app.post('/api/backup/upload-restore', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { encryptedString, mode } = req.body;

    if (!encryptedString || !mode) {
      return res.status(400).json({ success: false, error: 'الرجاء توفير ملف النسخ الاحتياطي المشفر وطريقة الاستعادة.' });
    }

    // Decrypt and validate immediately before applying
    let decryptedStr;
    try {
      decryptedStr = decrypt(encryptedString);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'فشل فك تشفير الملف. قد يكون الملف تالفاً أو أن مفتاح التشفير غير متطابق.' });
    }

    const payload = JSON.parse(decryptedStr);
    if (!payload || payload.version !== '1.0') {
      return res.status(400).json({ success: false, error: 'إصدار ملف النسخ الاحتياطي غير مدعوم أو غير صالح.' });
    }

    // Temporary insert to call our robust restoreBackup logic
    const tempBackup = await prisma.backup.create({
      data: {
        userId,
        size: Buffer.byteLength(encryptedString),
        version: '1.0',
        type: 'manual',
        encryptedData: encryptedString,
      },
    });

    try {
      await restoreBackup(tempBackup.id, userId, mode);
    } finally {
      // Always cleanup temp backup
      await prisma.backup.delete({ where: { id: tempBackup.id } }).catch(() => {});
    }

    res.json({ success: true, message: 'تم استعادة البيانات المرفوعة بنجاح.' });
  } catch (error: any) {
    console.error('Error upload restoring backup:', error);
    res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء استعادة البيانات المرفوعة.' });
  }
});

// 6. Download raw backup file (Download encrypted hex string)
app.get('/api/backup/download/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const backupId = req.params.id;

    const backup = await prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) {
      return res.status(404).json({ success: false, error: 'النسخة الاحتياطية غير موجودة.' });
    }

    if (backup.userId !== userId) {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتحميل هذه النسخة الاحتياطية.' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="bayti_backup_${backup.type}_${backup.createdAt.toISOString().split('T')[0]}.bayti"`);
    res.send(backup.encryptedData);
  } catch (error: any) {
    console.error('Error downloading backup file:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحميل ملف النسخة الاحتياطية.' });
  }
});

// 7. Dynamic multi-format Export (JSON, Excel, CSV, PDF)
app.get('/api/export', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const format = (req.query.format as string || 'json').toLowerCase();
    const type = (req.query.type as any || 'all').toLowerCase();

    const data = await getExportData(userId, type);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `bayti_export_${type}_${dateStr}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json(data);
    }

    if (format === 'csv') {
      const csv = generateCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const excelBuffer = generateExcel(data);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(excelBuffer);
    }

    if (format === 'pdf') {
      const titleText = type === 'all' ? 'All Financial Data' : type.toUpperCase();
      const pdfBuffer = await generatePdf(data, titleText);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(pdfBuffer);
    }

    res.status(400).json({ success: false, error: 'صيغة التصدير غير مدعومة.' });
  } catch (error: any) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تصدير البيانات.' });
  }
});

// 8. Admin Backup Statistics
app.get('/api/admin/backup-stats', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    
    // Verify admin role in database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'غير مصرح: هذه الإحصائيات متاحة لمديري النظام فقط.' });
    }

    // Aggregate statistics from the Backup table
    const [totalBackups, backupTypes, sizeStats, backupsCountByUser] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { size: true },
      }),
      prisma.backup.aggregate({
        _sum: { size: true },
        _avg: { size: true },
        _max: { size: true },
      }),
      prisma.backup.groupBy({
        by: ['userId'],
        _count: { _all: true },
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalBackups,
        totalUsersWithBackups: backupsCountByUser.length,
        averageBackupsPerUser: backupsCountByUser.length ? (totalBackups / backupsCountByUser.length).toFixed(1) : 0,
        totalSizeKb: sizeStats._sum.size ? (sizeStats._sum.size / 1024).toFixed(2) : 0,
        averageSizeKb: sizeStats._avg.size ? (sizeStats._avg.size / 1024).toFixed(2) : 0,
        maxSizeKb: sizeStats._max.size ? (sizeStats._max.size / 1024).toFixed(2) : 0,
        types: backupTypes.map((t: any) => ({
          type: t.type,
          count: t._count._all,
          sizeKb: t._sum.size ? (t._sum.size / 1024).toFixed(2) : 0,
        })),
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin backup statistics:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحميل إحصائيات النسخ الاحتياطية لمدير النظام.' });
  }
});

// Secure signed-URL file retrieval endpoint
app.get('/api/storage/file/*', async (req, res) => {
  try {
    // Extract file key from wildcard parameter
    const key = req.params[0];
    if (!key) {
      return res.status(400).json({ success: false, error: 'الملف غير محدد.' });
    }

    // Verify JWT token for secure signed URL protection
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ success: false, error: 'غير مصرح: توقيع الأمان مفقود.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'BaytiAI_Storage_Secret_Key_2026';
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.key !== key) {
        return res.status(403).json({ success: false, error: 'غير مصرح: توقيع الأمان غير مطابق.' });
      }
    } catch (err) {
      return res.status(403).json({ success: false, error: 'غير مصرح: انتهت صلاحية رابط الأمان أو أنه غير صالح.' });
    }

    // Retrieve file binary from PostgreSQL
    const file = await prisma.cloudFile.findUnique({
      where: { key },
    });

    if (!file || !file.data) {
      return res.status(404).json({ success: false, error: 'الملف غير موجود.' });
    }

    // Send binary content with headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(file.data);
  } catch (error: any) {
    console.error('[Storage Endpoint] File delivery error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحميل الملف.' });
  }
});

// Fallback for all unmatched API routes to ensure they always return JSON and never HTML
app.all('/api/*', (req, res) => {
  console.warn(`[API 404] Unmatched API Route: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `المسار البرمجي غير موجود: ${req.method} ${req.url}`
  });
});

// Global API Error Handler to prevent any API crash from returning HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    console.error('[API Global Error Handler] Caught exception:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'حدث خطأ داخلي غير متوقع في خادم بيت AI.'
    });
  }
  next(err);
});

// Vite Dev Server / Production Static File setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in dev mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static assets from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bayti AI backend server running on http://localhost:${PORT}`);
  });
}

startServer();
