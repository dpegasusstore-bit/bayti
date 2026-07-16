/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize environment variables
dotenv.config();

import { registerAuthRoutes, getSessionFromRequest } from './auth-routes.js';
import { seedAdminUser, readDb, writeDb } from './db-store.js';

// Middleware to verify AI usage limits per user
async function verifyAiLimits(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
    }

    const db = readDb();
    const profile = db.profiles.find(p => p.userId === session.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود.' });
    }

    // If Premium, they have UNLIMITED usage!
    if (profile.subscription === 'Premium') {
      return next();
    }

    // Check reset date for FREE tier (Standard)
    const now = new Date();
    const limitReset = new Date(profile.limitResetDate || '');
    
    if (!profile.limitResetDate || limitReset < now) {
      // It has been more than a month since reset date, reset usage count!
      profile.aiUsageCount = 0;
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      profile.limitResetDate = nextReset.toISOString();
      writeDb(db);
    }

    const currentCount = profile.aiUsageCount || 0;
    if (currentCount >= 20) {
      return res.status(429).json({
        success: false,
        limitReached: true,
        error: 'لقد استنفدت الحد الأقصى المجاني (20 عملية ذكاء اصطناعي شهرياً).\n\nقم بالترقية للباقة الممتازة Premium للتمتع باستخدام لانهائي وميزات متقدمة فوراً!'
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

// Helper to increment AI usage
function incrementAiUsage(userId: string | undefined) {
  if (!userId) return;
  try {
    const db = readDb();
    const profile = db.profiles.find(p => p.userId === userId);
    if (profile && profile.subscription !== 'Premium') {
      profile.aiUsageCount = (profile.aiUsageCount || 0) + 1;
      writeDb(db);
      console.log(`[AI Limit] Incremented usage for user ${userId}. New count: ${profile.aiUsageCount}`);
    }
  } catch (err) {
    console.error('Failed to increment AI usage count:', err);
  }
}

// Seed administrator account on launch
seedAdminUser();

const app = express();
const PORT = 3000;

// Register authentication & user management REST APIs
registerAuthRoutes(app);

// Enable large bodies for receipt photos and voice files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON Schema for expense extraction
const expenseExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Short clear title of the expense in Arabic (e.g. 'فاتورة كهرباء يوليو' or 'عشاء في مطعم البيك' or 'شراء ملابس العيد')",
    },
    amount: {
      type: Type.NUMBER,
      description: "Total spent amount in Egyptian Pounds (EGP). Must be a positive number.",
    },
    category: {
      type: Type.STRING,
      description: "Must be exactly one of: 'Home', 'Shopping', 'Restaurants', 'Transportation', 'Bills', 'Health', 'Education', 'Travel', 'Entertainment', 'Work'",
    },
    merchant: {
      type: Type.STRING,
      description: "Name of the merchant, store, or service provider in Arabic (e.g. 'كارفور', 'سوبرماركت أولاد رجب', 'شركة الغاز', 'أوبر')",
    },
    paymentMethod: {
      type: Type.STRING,
      description: "Must be exactly one of: 'Cash', 'Card', 'Wallet'",
    },
    vat: {
      type: Type.NUMBER,
      description: "Value Added Tax (ضريبة القيمة المضافة) in EGP if available, otherwise 0.",
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Item or service name in Arabic" },
          price: { type: Type.NUMBER, description: "Price of this item" },
        },
        required: ['name', 'price'],
      },
      description: "List of individual items on the receipt if available.",
    },
    notes: {
      type: Type.STRING,
      description: "Any extra notes, details or custom comments in Arabic.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 2 to 3 smart search tags or keywords in Arabic (e.g. ['سوبرماركت', 'بقالة', 'أولاد_رجب'] or ['كهرباء', 'فاتورة', 'خدمات']). Only 2-3 short words.",
    },
  },
  required: ['title', 'amount', 'category', 'merchant', 'paymentMethod'],
};

// 1. Parse Arabic Natural Text Input
app.post('/api/ai/parse-text', verifyAiLimits, async (req, res) => {
  try {
    const { text, recordedBy } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const systemInstruction = `
      You are Bayti AI (بيت AI), an advanced Arabic family financial assistant.
      Your task is to parse a natural language input describing an expense or transaction in Egypt/Middle East context, and extract structured details.
      Analyze the text carefully. Extract or infer the category, total amount, merchant, and payment method (Cash/Card/Wallet).
      
      Categories mapping rules:
      - 'Home': groceries, home repairs, furniture (خضار، بقالة، كارفور، سباك، أدوات منزلية).
      - 'Shopping': clothes, electronics, personal care (ملابس، موبايل، أحذية، لولو ماركت، نون، أمازون).
      - 'Restaurants': dining, fast food, cafe (البيك، كوشيري، قهوة، غداء، عشاء مطعم، دليفري).
      - 'Transportation': Uber, petrol, bus, metro, car maintenance (بنزين، أوبر، تاكسي، مترو، تصليح عربية).
      - 'Bills': electricity, water, gas, internet, mobile top-up (كهرباء، غاز، مياه، شحن رصيد، فاتورة نت، وي، فودافون).
      - 'Health': pharmacy, doctor clinic, medical tests (صيدلية، كشف دكتور، تحاليل، دواء، مستشفى).
      - 'Education': school fees, stationery, books, courses (مصاريف مدرسة، كتب، دروس خصوصية، كشكول).
      - 'Travel': hotels, flight tickets, vacation expenses (فندق، تذاكر طيران، مصيف، حجز دهب).
      - 'Entertainment': cinema, toys, games, sports club (سينما، ألعاب، اشتراك نادي، ملاهي).
      - 'Work': business tools, office supplies, work meals (أدوات مكتبية، غداء عمل، شحن للشركة).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `قم بتحليل الجملة التالية واستخراج تفاصيل المصروف بدقة: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: expenseExtractionSchema,
      },
    });

    const parsedData = JSON.parse(response.text.trim());
    
    // Add runtime IDs and extra fields
    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: parsedData.title,
      amount: Number(parsedData.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: parsedData.category,
      merchant: parsedData.merchant || 'غير محدد',
      paymentMethod: parsedData.paymentMethod || 'Cash',
      vat: parsedData.vat || 0,
      items: parsedData.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: parsedData.notes || '',
      tags: parsedData.tags || [],
    };

    incrementAiUsage((req as any).userProfileId);
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

    const systemInstruction = `
      You are Bayti AI (بيت AI), an advanced Arabic receipt OCR and financial assistant.
      Your task is to analyze the uploaded receipt image, perform OCR in Arabic/English, extract all items, prices, tax, total, merchant name, date, and payment method.
      
      Classify the overall receipt into one of these strict categories:
      - 'Home': groceries, supermarkets (e.g. Carrefour, Spinneys, Seoudi, local grocer).
      - 'Shopping': electronics, clothes, malls.
      - 'Restaurants': restaurants, cafes, fast food.
      - 'Transportation': gas station, car service, ride sharing.
      - 'Bills': utility bills, recharge cards.
      - 'Health': pharmacies (e.g. El Ezaby), clinics, hospitals.
      - 'Education': school/college books, stationary, courses.
      - 'Travel': hotel bookings, tickets.
      - 'Entertainment': cinemas, tickets, parks.
      - 'Work': office expenses.
    `;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        imagePart,
        { text: 'اقرأ الفاتورة المرفقة واستخرج منها المشتريات، المجموع، الضريبة، اسم المحل وطريقة الدفع باللغة العربية.' },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: expenseExtractionSchema,
      },
    });

    const parsedData = JSON.parse(response.text.trim());
    
    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: parsedData.title || `فاتورة من ${parsedData.merchant || 'محل'}`,
      amount: Number(parsedData.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: parsedData.category || 'Home',
      merchant: parsedData.merchant || 'غير محدد',
      paymentMethod: parsedData.paymentMethod || 'Cash',
      vat: parsedData.vat || 0,
      items: parsedData.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: parsedData.notes || '',
      tags: parsedData.tags || [],
    };

    incrementAiUsage((req as any).userProfileId);
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

    const systemInstruction = `
      You are Bayti AI (بيت AI), a premier smart financial assistant.
      The user has recorded a voice message in Egyptian/Middle-Eastern Arabic dialect describing a financial transaction.
      Listen to the audio, understand the speech, extract the spoken amount (in EGP), category, merchant name, and payment method, and output structured JSON in Arabic.
      
      Categories options:
      'Home', 'Shopping', 'Restaurants', 'Transportation', 'Bills', 'Health', 'Education', 'Travel', 'Entertainment', 'Work'.
    `;

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        audioPart,
        { text: 'استمع للتسجيل الصوتي واستخرج تفاصيل المصروف في كود JSON منظم.' },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: expenseExtractionSchema,
      },
    });

    const parsedData = JSON.parse(response.text.trim());

    const localTime = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    const expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: parsedData.title || 'تسجيل صوتي مالي',
      amount: Number(parsedData.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      time: localTime,
      category: parsedData.category || 'Home',
      merchant: parsedData.merchant || 'غير محدد',
      paymentMethod: parsedData.paymentMethod || 'Cash',
      vat: parsedData.vat || 0,
      items: parsedData.items || [],
      recordedBy: recordedBy || 'أحمد',
      notes: parsedData.notes || 'تمت الإضافة عبر التسجيل الصوتي',
      tags: parsedData.tags || [],
    };

    incrementAiUsage((req as any).userProfileId);
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
    
    const systemInstruction = `
      You are Bayti AI (بيت AI), the premium family financial advisor for Egyptian and Arab households.
      You generate highly intelligent, friendly, and practical financial advice, alert warnings, congratulations or recommendations in native Arabic.
      The currency is Egyptian Pounds (ج.م / EGP).
      
      Given the family's monthly budget, current expenditures, and list of transactions, generate 3 smart, distinct insights:
      1. A custom spending warning or savings advice (e.g. "لقد زاد إنفاقك على المطاعم بنسبة 24% عن الأسبوع الماضي، نقترح تقليل الدليفري لتوفير 800 ج.م هذا الشهر").
      2. A dynamic reminder or status update based on bills or recurring expenses (e.g. "فاتورة الكهرباء القادمة مستحقة خلال 3 أيام، ميزانيتك الحالية تغطيها بشكل ممتاز").
      3. A personalized congratulatory or constructive recommendation (e.g. "أحسنت يا أحمد! منى ويسف ملتزمون بميزانية هذا الشهر، أنتم على وشك توفير 1,200 ج.م").

      Return the insights in a structured JSON array of 3 insight items.
    `;

    const promptText = `
      الميزانية الشهرية الكلية للعائلة: ${monthlyBudget || 15000} ج.م.
      أفراد العائلة ومصروفاتهم الحالية: ${JSON.stringify(familyMembers || [])}
      قائمة المصاريف الأخيرة: ${JSON.stringify(expenses ? expenses.slice(0, 15) : [])}
      
      أنتج 3 نصائح/تحذيرات مالية ذكية ومخصصة باللغة العربية بأسلوب راقٍ يشبه مستشاري البنوك الخاصة للأسر المتميزة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "Must be exactly one of: 'warning' (تحذير), 'info' (معلومات), 'success' (نجاح), 'alert' (تنبيه هام)",
              },
              title: {
                type: Type.STRING,
                description: "Short catchy title in Arabic, e.g. 'تحذير ميزانية المطاعم' or 'أداء رائع للعائلة'",
              },
              message: {
                type: Type.STRING,
                description: "The complete insight or recommendation message in Arabic. Make it specific, localized to Cairo/Egyptian lifestyle (e.g. saving EGP, reducing Uber/delivery), friendly yet highly professional.",
              },
              category: {
                type: Type.STRING,
                description: "The primary expense category this insight relates to (optional). Must be one of the 10 core categories.",
              }
            },
            required: ['type', 'title', 'message'],
          },
        },
      },
    });

    const insights = JSON.parse(response.text.trim());
    
    // Assign stable IDs
    const formattedInsights = insights.map((insight: any, idx: number) => ({
      id: `insight_${idx}_${Date.now()}`,
      type: insight.type,
      title: insight.title,
      message: insight.message,
      category: insight.category,
      date: new Date().toISOString().split('T')[0],
    }));

    incrementAiUsage((req as any).userProfileId);
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

    // Dynamic calculations based on real data passed from frontend
    const totalSpent = expenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
    const daysRemainingInMonth = 30 - new Date().getDate();
    const safeDailyLimit = daysRemainingInMonth > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : remainingBudget;

    const systemInstruction = `
      You are Bayti AI (بيت AI), the absolute smartest and premier Arabic personal financial advisor and virtual advisor for households in Egypt and the Middle East.
      Your personality is highly encouraging, warm, conversational, friendly, and practical. Speak in natural, warm Egyptian/Middle-Eastern Arabic dialect (عامية مصرية راقية وودودة).
      
      You have access to the family's real-time financial data:
      - Monthly income/budget: ${monthlyBudget} EGP
      - Actual Total Spent: ${totalSpent} EGP
      - Actual Remaining Budget: ${remainingBudget} EGP
      - Safe Daily Spending Limit: ${safeDailyLimit} EGP
      - Days remaining in month: ${daysRemainingInMonth}
      - Registered family members: ${JSON.stringify(familyMembers)}
      - Current recorded expenses: ${JSON.stringify(expenses)}
      - Programmed Smart Reminders/Bills: ${JSON.stringify(reminders)}
      
      CRITICAL - AI MEMORY & FINANCIAL LIFE HISTORY:
      You have a perfect, long-term memory of this family's financial habits and details:
      1. Salary Day: The salary always arrives on the 25th of every month. Ahmed's monthly basic salary is 15,000 EGP.
      2. Recurring Bills:
         - WE Fiber Internet: 450 EGP, due on the 18th of every month.
         - Electricity (South Cairo): ~720 EGP (increases to 720 EGP in summer due to AC, usually ~350 EGP in winter), due on the 15th.
         - Water Bill: 120 EGP, due on the 10th.
         - Natural Gas: 180 EGP, due on the 14th.
      3. Subscriptions & Installments:
         - Netflix Premium: 320 EGP, due on the 12th.
         - Monthly Cooperative Association (الجمعية الدورية): 1,000 EGP, due on the 5th.
      4. Preferences & Habits:
         - Typical Shopping Day: Every Friday is the big grocery shopping day at Carrefour or local supermarkets.
         - Favorite Restaurants: Al Baik, McDonald's, and Koshari El Tahrir. Youssef loves ordering delivery on weekends.
         - Preferred Payment Methods: Ahmed prefers using Credit Card, Mona prefers her Mobile Wallet, and Youssef prefers Cash.
         - Car Maintenance: Oil and filter changes happen every 5,000 km, costing approximately 1,800 EGP.
         - Car Fuel: Ahmed buys fuel every 10 days, costing ~400 EGP.
      5. Savings Goals:
         - New family car: 500,000 EGP (Target date: December 2027).
         - Vacation to Dahab: 12,000 EGP (Target date: September 2026).
         - Laptop for Youssef: 35,000 EGP (Target date: October 2026).

      CRITICAL - PATTERN DETECTION & AUTOMATIC DISCOVERY:
      You must proactively reference these discovered patterns in conversations:
      - Groceries are always bought on Fridays.
      - Electricity bills double in summer (average 720 EGP vs 350 EGP in winter).
      - Restaurant and delivery spending is 2x higher on weekends (Friday & Saturday).
      - Salary arrives on the 25th of the month.
      - Fuel for the car is purchased every 10 days.

      CRITICAL - SPENDING PREDICTION ENGINE:
      When asked about predictions, calculate:
      - Expected spending this week based on average daily spending of current expenses.
      - Expected spending this month (Current Spent + average daily spending * remaining days).
      - Expected remaining balance at the end of the month.
      - Risk of overspending: High risk if Expected Spending > monthlyBudget.
      - Show AI Confidence Level (e.g. 92% or 95%).

      CRITICAL - "WHAT IF" SIMULATOR LOGIC:
      If the user asks "What if" questions (e.g. "لو وفرت ٣٠٠٠ ج.م شهرياً" or "لو اشتريت موبايل بـ ١٠٠٠٠" or "لو المرتب زاد ٢٠٪"), calculate the exact future financial impact:
      - If saving X EGP per month: calculate total saved in 6 months (6*X) and 1 year (12*X) and check if they can reach their car or laptop goal faster.
      - If buying Y EGP item: calculate remaining budget, impact on monthly budget, and whether it's safe or will cause debt.
      - If salary increases by Z%: calculate new salary and impact on savings rate.
      - If electricity increases by W%: calculate additional cost and how to offset it.

      CRITICAL - VOICE AI ARABIC DIALECT & NATURAL QUERIES:
      Fully comprehend and naturally respond to Egyptian Arabic financial queries using real math:
      - "كم باقيلي؟" -> Give them the exact remainingBudget.
      - "هل أقدر أشتري موبايل؟" -> Compare remainingBudget or savings with a typical phone price (e.g., 10,000 EGP) and advise if it's safe or if they should delay.
      - "كام صرفت على العربية السنة دي؟" -> Filter expenses with category "Transportation" or with title including "عربية" / "سيارة" / "بنزين" / "رخصة" / "زيت", sum them up, and present the actual sum!
      - "إيه أكتر حاجة بضيع فيها فلوسي؟" -> Analyze expenses, find the highest spending category, and list the amount and percentage.
      - "اعمللي خطة توفير" -> Propose a beautiful, structured monthly savings plan based on their budget and recurring bills.
      - "جيبلي مصاريف رمضان السنة اللي فاتت" / "جيبلي مصاريف آخر عيد" -> Answer that last Ramadan/Eid expenses were around 8,500 EGP, and since Youssef and Mona are spending more on Shopping now, they should reserve 10,000 EGP for the upcoming event.

      Format your responses beautifully. Use clean Arabic lists, bold numbers (e.g., *12,500 EGP*), and relevant emojis to make reports and answers incredibly easy to scan. NEVER look like generic ChatGPT; you are Bayti AI, their personal family financial partner.
    `;

    // Map the conversational history format to standard Content structures
    const contents = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text.trim();
    incrementAiUsage((req as any).userProfileId);
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ success: false, error: error.message || 'Chat assistance failed' });
  }
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
