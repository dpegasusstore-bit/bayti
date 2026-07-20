import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { prisma } from './db-store.js';
import { registerAuthRoutes, getSessionFromRequest, requireSuperAdmin, ensureOnlyOneSuperAdmin } from './auth-routes.js';
import { aiService } from './server/ai-service.js';
import { uploadFile } from './server/storage-service.js';
import { localParseText, localParseReceiptOCR, cleanVoiceTranscript, learnCorrection } from './server/smart-dictionary.js';
import Tesseract from 'tesseract.js';
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


export const app = express();
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

// Timezone-aware validation & fallback date/time helpers
function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
}

function getFallbackDateTime(req: any) {
  let date = req.body.localDate;
  let time = req.body.localTime;
  
  if (!isValidDateString(date)) {
    date = new Date().toISOString().split('T')[0];
  }
  
  if (!time || typeof time !== 'string') {
    time = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  
  return { date, time };
}

// Helper to perform monthly reset of AI credits if needed
async function ensureAiCreditsReset(userId: string): Promise<any> {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
  
  // Try to find the AI usage
  let usage = await prisma.aIUsage.findUnique({
    where: { userId }
  });

  if (!usage) {
    // If not found, create a new one
    usage = await prisma.aIUsage.create({
      data: {
        userId,
        requestsCount: 0,
        tokensCount: 0,
        monthlyLimit: 20,
        monthlyAiCredits: 20,
        usedAiCredits: 0,
        remainingAiCredits: 20,
        lastResetMonth: currentMonthStr,
      }
    });
  } else if (usage.lastResetMonth !== currentMonthStr) {
    // Reset to 20 at the beginning of every new month
    usage = await prisma.aIUsage.update({
      where: { userId },
      data: {
        monthlyAiCredits: 20,
        usedAiCredits: 0,
        remainingAiCredits: 20,
        lastResetMonth: currentMonthStr,
        requestsCount: 0, // also sync the legacy fields
      }
    });
  }

  return usage;
}

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

    // Perform monthly credit reset if needed
    const usage = await ensureAiCreditsReset(session.userId);

    // If credits == 0, return friendly message
    if (usage.remainingAiCredits <= 0) {
      return res.status(429).json({
        success: false,
        limitReached: true,
        error: 'لقد استنفدت الحد الأقصى المجاني للذكاء الاصطناعي (20 عملية شهرياً).\n\nيرجى الترقية إلى الباقة الممتازة Premium للحصول على استخدام لانهائي، أو الانتظار حتى بداية الشهر الجديد لإعادة شحن رصيدك تلقائياً.'
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
      const usage = await ensureAiCreditsReset(userId);
      const newUsed = usage.usedAiCredits + 1;
      const newRemaining = Math.max(0, usage.monthlyAiCredits - newUsed);
      
      await prisma.aIUsage.update({
        where: { userId },
        data: {
          usedAiCredits: newUsed,
          remainingAiCredits: newRemaining,
          requestsCount: newUsed, // sync legacy requestsCount
        },
      });
      console.log(`[AI Limit] Incremented usage for user ${userId}. Remaining: ${newRemaining}`);
    }
  } catch (err) {
    console.error('Failed to increment AI usage count:', err);
  }
}

// Helper to check AI limit check manually without middleware block for local processing
async function checkUsageAndReturnIfAllowed(userId: string): Promise<{ allowed: boolean; error?: string; limitReached?: boolean }> {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { allowed: false, error: 'الملف الشخصي غير موجود.' };
    if (profile.subscription === 'Premium') return { allowed: true };

    const usage = await ensureAiCreditsReset(userId);

    if (usage.remainingAiCredits <= 0) {
      return {
        allowed: false,
        limitReached: true,
        error: 'لقد استنفدت الحد الأقصى المجاني للذكاء الاصطناعي (20 عملية شهرياً).\n\nيرجى الترقية إلى الباقة الممتازة Premium للحصول على استخدام لانهائي، أو الانتظار حتى بداية الشهر الجديد لإعادة شحن رصيدك تلقائياً.'
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Error checking AI limit allowed:', err);
    return { allowed: false, error: 'حدث خطأ أثناء التحقق من حدود الذكاء الاصطناعي.' };
  }
}

// 1. Parse Arabic Natural Text Input
app.post('/api/ai/parse-text', async (req, res) => {
  try {
    const { text, recordedBy } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }
    const userId = session.userId;

    // Step 1: Run Local Processing
    const localResult = await localParseText(text, userId);
    
    let finalResult;
    let confidence = localResult.confidence;
    let aiUsed = false;

    // Step 2: Confidence Score check
    if (confidence >= 90) {
      finalResult = localResult.expense;
      console.log(`[Local Parsing] High confidence (${confidence}%). Bypassing AI.`);
    } else {
      // Step 3: AI Fallback
      console.log(`[Local Parsing] Low confidence (${confidence}%). Falling back to AI.`);
      
      const checkLimit = await checkUsageAndReturnIfAllowed(userId);
      if (!checkLimit.allowed) {
        return res.status(checkLimit.limitReached ? 429 : 400).json({
          success: false,
          limitReached: checkLimit.limitReached,
          error: checkLimit.error
        });
      }

      const aiResult = await aiService.parseText(text, recordedBy);
      aiUsed = true;
      
      // Merge: Do not let AI overwrite fields confidently matched locally
      finalResult = {
        ...aiResult,
        amount: localResult.expense.amount || aiResult.amount,
        category: (localResult.confidence >= 60 && localResult.expense.category) ? localResult.expense.category : aiResult.category,
        merchant: (localResult.confidence >= 60 && localResult.expense.merchant && localResult.expense.merchant !== 'غير محدد') ? localResult.expense.merchant : aiResult.merchant,
      };
      
      await incrementAiUsage(userId);
    }

    const fallback = getFallbackDateTime(req);
    const finalDate = isValidDateString(finalResult.date) ? finalResult.date : fallback.date;
    const finalTime = fallback.time;

    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: finalResult.title,
      amount: finalResult.amount,
      date: finalDate,
      time: finalTime,
      category: finalResult.category,
      merchant: finalResult.merchant,
      paymentMethod: finalResult.paymentMethod,
      vat: finalResult.vat || 0,
      items: finalResult.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: finalResult.notes,
      tags: finalResult.tags || [],
      aiUsed,
      confidence
    };

    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-text:', error);
    res.status(500).json({ error: error.message || 'Failed to parse text' });
  }
});

// 2. Parse Receipt Photos (OCR + Structure)
app.post('/api/ai/parse-receipt', async (req, res) => {
  try {
    const { image, recordedBy } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Base64 image is required' });
    }

    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }
    const userId = session.userId;

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');

    // Optimize and upload receipt image to secure cloud object storage (so it's saved anyway)
    console.log(`[Receipt OCR] Uploading receipt image for user: ${userId}`);
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
      console.error('[Receipt OCR] Failed to upload receipt:', err);
    }

    // Step 1: Local OCR extraction using tesseract.js
    let ocrText = '';
    let localResult = null;
    let confidence = 0;
    
    try {
      console.log('[Receipt OCR] Starting local tesseract OCR...');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const ocrRes = await Tesseract.recognize(buffer, 'ara+eng');
      ocrText = ocrRes.data.text || '';
      console.log('[Receipt OCR] Local OCR Text Extracted:', ocrText.slice(0, 300));
      
      // Run local dictionary matching on OCR text
      localResult = localParseReceiptOCR(ocrText, userId);
      confidence = localResult.confidence;
    } catch (ocrErr: any) {
      console.error('[Receipt OCR] Local OCR failed or timed out:', ocrErr.message);
      confidence = 0;
    }

    let finalResult;
    let aiUsed = false;

    // Step 2: Confidence Check
    if (confidence >= 90 && localResult) {
      finalResult = localResult.expense;
      console.log(`[Receipt OCR] High confidence (${confidence}%). Bypassing AI OCR.`);
    } else {
      // Step 3: AI Fallback
      console.log(`[Receipt OCR] Low confidence (${confidence}%). Falling back to AI OCR.`);
      
      const checkLimit = await checkUsageAndReturnIfAllowed(userId);
      if (!checkLimit.allowed) {
        if (localResult && localResult.expense.amount > 0) {
          finalResult = localResult.expense;
          console.log('[Receipt OCR] Returning partial local OCR due to AI limit.');
        } else {
          return res.status(checkLimit.limitReached ? 429 : 400).json({
            success: false,
            limitReached: checkLimit.limitReached,
            error: checkLimit.error
          });
        }
      } else {
        const aiResult = await aiService.parseReceipt(cleanBase64, recordedBy);
        aiUsed = true;
        
        // Merge: keep confident local matches
        if (localResult) {
          finalResult = {
            ...aiResult,
            amount: localResult.expense.amount || aiResult.amount,
            category: (localResult.confidence >= 60 && localResult.expense.category) ? localResult.expense.category : aiResult.category,
            merchant: (localResult.confidence >= 60 && localResult.expense.merchant && localResult.expense.merchant !== 'غير محدد') ? localResult.expense.merchant : aiResult.merchant,
            vat: localResult.expense.vat || aiResult.vat,
          };
        } else {
          finalResult = aiResult;
        }
        
        await incrementAiUsage(userId);
      }
    }

    // Connect everything with PostgreSQL by storing the ReceiptOCR record
    if (userId) {
      try {
        await prisma.receiptOCR.create({
          data: {
            userId,
            imageUrl: secureUrl || null,
            extractedContent: JSON.stringify(finalResult),
            timestamp: new Date(),
          },
        });
        console.log(`[Receipt OCR] Stored ReceiptOCR metadata inside PostgreSQL successfully.`);
      } catch (dbErr) {
        console.error('[Receipt OCR] Failed to write ReceiptOCR metadata to PostgreSQL:', dbErr);
      }
    }

    const fallback = getFallbackDateTime(req);
    const finalDate = isValidDateString(finalResult.date) ? finalResult.date : fallback.date;
    const finalTime = fallback.time;

    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: finalResult.title || `فاتورة من ${finalResult.merchant || 'محل'}`,
      amount: finalResult.amount,
      date: finalDate,
      time: finalTime,
      category: finalResult.category || 'Home',
      merchant: finalResult.merchant,
      paymentMethod: finalResult.paymentMethod,
      vat: finalResult.vat || 0,
      items: finalResult.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: finalResult.notes || 'تم الاستخراج عبر مسح الفاتورة',
      tags: finalResult.tags || [],
      imageUrl: secureUrl,
      aiUsed,
      confidence
    };

    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-receipt:', error);
    res.status(500).json({ error: error.message || 'Failed to parse receipt photo' });
  }
});

// 3. Parse Natural Voice Input
app.post('/api/ai/parse-voice', async (req, res) => {
  try {
    const { audio, mimeType, recordedBy } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Base64 audio is required' });
    }

    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }
    const userId = session.userId;

    const cleanBase64 = audio.replace(/^data:audio\/\w+;base64,/, '');
    const cleanMimeType = mimeType || 'audio/webm';

    console.log('[Voice Registration] Requesting transcript from Gemini...');
    
    const checkLimit = await checkUsageAndReturnIfAllowed(userId);
    if (!checkLimit.allowed) {
      return res.status(checkLimit.limitReached ? 429 : 400).json({
        success: false,
        limitReached: checkLimit.limitReached,
        error: checkLimit.error
      });
    }

    const audioPart = {
      inlineData: { mimeType: cleanMimeType, data: cleanBase64 },
    };
    
    let transcript = '';
    try {
      const response = await (aiService as any).activeProvider.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          audioPart,
          { text: 'اكتب النص المنطوق في هذا التسجيل الصوتي المالي بدقة شديدة وباللغة العربية العامية أو الفصحى وبدون أي مقدمات أو شروحات.' },
        ],
      });
      transcript = response.text.trim();
      console.log('[Voice Registration] Extracted transcript:', transcript);
    } catch (transErr: any) {
      console.error('[Voice Registration] Failed to transcribe voice:', transErr);
      throw new Error('Failed to transcribe voice audio.');
    }

    const cleanedTranscript = cleanVoiceTranscript(transcript);
    console.log('[Voice Registration] Cleaned Transcript:', cleanedTranscript);

    // Run local parser on transcript
    const localResult = await localParseText(cleanedTranscript, userId);
    let finalResult;
    let confidence = localResult.confidence;
    let aiUsed = false;

    if (confidence >= 90) {
      finalResult = localResult.expense;
      console.log(`[Voice Registration] High confidence (${confidence}%). Bypassing structured AI parsing.`);
    } else {
      console.log(`[Voice Registration] Low confidence (${confidence}%). Falling back to structured AI parsing.`);
      
      const aiResult = await aiService.parseText(cleanedTranscript, recordedBy);
      aiUsed = true;
      
      // Merge
      finalResult = {
        ...aiResult,
        amount: localResult.expense.amount || aiResult.amount,
        category: (localResult.confidence >= 60 && localResult.expense.category) ? localResult.expense.category : aiResult.category,
        merchant: (localResult.confidence >= 60 && localResult.expense.merchant && localResult.expense.merchant !== 'غير محدد') ? localResult.expense.merchant : aiResult.merchant,
      };
    }

    // Increment AI usage once (since we did at least one AI transcription)
    await incrementAiUsage(userId);

    const fallback = getFallbackDateTime(req);
    const finalDate = isValidDateString(finalResult.date) ? finalResult.date : fallback.date;
    const finalTime = fallback.time;

    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: finalResult.title || 'تسجيل صوتي مالي',
      amount: finalResult.amount,
      date: finalDate,
      time: finalTime,
      category: finalResult.category || 'Home',
      merchant: finalResult.merchant,
      paymentMethod: finalResult.paymentMethod,
      vat: finalResult.vat || 0,
      items: finalResult.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: finalResult.notes || `نص التسجيل: "${transcript}"`,
      tags: finalResult.tags || [],
      aiUsed,
      confidence
    };

    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error in parse-voice:', error);
    res.status(500).json({ error: error.message || 'Failed to parse voice message' });
  }
});

// 4. Learn User Corrections dynamically for the Smart Dictionary
app.post('/api/ai/learn-correction', async (req, res) => {
  try {
    const { sentence, correctResult } = req.body;
    if (!sentence || !correctResult) {
      return res.status(400).json({ error: 'Sentence and correctResult are required' });
    }
    
    learnCorrection(sentence, correctResult);
    res.json({ success: true, message: 'Correction learned successfully' });
  } catch (error: any) {
    console.error('Error in learn-correction:', error);
    res.status(500).json({ error: error.message || 'Failed to learn correction' });
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
app.get('/api/admin/backup-stats', requireSuperAdmin, async (req, res) => {
  try {
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
  // Ensure we have exactly one Super Admin account created and any others downgraded
  await ensureOnlyOneSuperAdmin();

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

if (!process.env.VERCEL) {
  startServer();
}
