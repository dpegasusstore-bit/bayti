import { GoogleGenAI, Type } from '@google/genai';

export interface AIExpenseResult {
  title: string;
  amount: number;
  category: string;
  merchant: string;
  paymentMethod: string;
  vat: number;
  items: Array<{ name: string; price: number }>;
  notes: string;
  tags: string[];
}

export interface AIInsightItem {
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  message: string;
  category?: string;
}

export interface AIProvider {
  name: string;
  parseText(text: string, recordedBy?: string): Promise<AIExpenseResult>;
  parseReceipt(base64Image: string, recordedBy?: string): Promise<AIExpenseResult>;
  parseVoice(base64Audio: string, mimeType: string, recordedBy?: string): Promise<AIExpenseResult>;
  generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]>;
  chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string>;
}

function cleanJsonText(text: string | undefined | null): string {
  if (!text) return '[]';
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim() || '[]';
}

function getArabicCategoryName(cat: string): string {
  switch (cat) {
    case 'Home': return 'المنزل والبقالة';
    case 'Shopping': return 'التسوق والملابس';
    case 'Restaurants': return 'المطاعم والمقاهي';
    case 'Transportation': return 'المواصلات والبنزين';
    case 'Bills': return 'الفواتير والالتزامات';
    case 'Health': return 'الصحة والأدوية';
    case 'Education': return 'التعليم والمدارس';
    case 'Travel': return 'السفر والرحلات';
    case 'Entertainment': return 'الترفيه والألعاب';
    case 'Work': return 'العمل والوظيفة';
    default: return cat;
  }
}

export function getLocalBackupInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): AIInsightItem[] {
  const totalSpent = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const percent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  
  const insights: AIInsightItem[] = [];

  // Insight 1: General Budget Status
  if (totalSpent > monthlyBudget) {
    insights.push({
      type: 'warning',
      title: 'تجاوز الميزانية الكلية',
      message: `تنبيه هام! لقد تجاوزت العائلة الميزانية المحددة للشهر الحالي بمقدار ${(totalSpent - monthlyBudget).toLocaleString('ar-EG')} ج.م (إجمالي الصرف: ${totalSpent.toLocaleString('ar-EG')} ج.م من أصل ${monthlyBudget.toLocaleString('ar-EG')} ج.م). يُنصح بتقييد المصاريف غير الضرورية فوراً.`,
      category: 'Home'
    });
  } else if (percent > 80) {
    insights.push({
      type: 'alert',
      title: 'ميزانيتك تقترب من النفاد',
      message: `تحذير: لقد استهلكت العائلة ${percent.toFixed(0)}% من الميزانية الشهرية المخصصة. المتبقي لكم هو ${(monthlyBudget - totalSpent).toLocaleString('ar-EG')} ج.م فقط حتى نهاية الشهر. يُرجى مراجعة وتأجيل المشتريات غير العاجلة.`,
      category: 'Home'
    });
  } else if (percent > 50) {
    insights.push({
      type: 'info',
      title: 'معدل صرف متوسط ومتوازن',
      message: `معدل صرفك متوسط ومستقر. تم استهلاك ${percent.toFixed(0)}% من الميزانية الكلية (${totalSpent.toLocaleString('ar-EG')} ج.م). متبقي لديك ${(monthlyBudget - totalSpent).toLocaleString('ar-EG')} ج.م لتغطية باقي أيام الشهر بأمان.`,
      category: 'Home'
    });
  } else {
    insights.push({
      type: 'success',
      title: 'أداء مالي متميز وتوفير ذكي',
      message: `رائع جداً! معدل صرف العائلة منخفض وممتاز حتى الآن. تم صرف ${percent.toFixed(0)}% فقط من الميزانية الكلية. أنتم توفرون بذكاء ويسير الحساب بمرونة فائقة للمستقبل.`,
      category: 'Home'
    });
  }

  // Insight 2: Category Analysis
  const catSums: Record<string, number> = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'أخرى';
    catSums[cat] = (catSums[cat] || 0) + (Number(exp.amount) || 0);
  });

  const sortedCats = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCat, topAmount] = sortedCats[0];
    const topCatAr = getArabicCategoryName(topCat);
    const catPercent = totalSpent > 0 ? (topAmount / totalSpent) * 100 : 0;
    
    if (topCat === 'Restaurants' || topCat === 'Shopping' || topCat === 'Entertainment') {
      insights.push({
        type: 'warning',
        title: `ارتفاع مصروفات الـ ${topCatAr}`,
        message: `نلاحظ أن فئة (${topCatAr}) هي الأكثر استهلاكاً للشهر الحالي بقيمة ${topAmount.toLocaleString('ar-EG')} ج.م، وهو ما يمثل ${catPercent.toFixed(0)}% من إجمالي مصاريفك الكلية. تقليل الإنفاق في هذه الفئة سيوفر لك مبالغ إضافية هامة للادخار.`,
        category: topCat
      });
    } else {
      insights.push({
        type: 'info',
        title: `تحليل مصروفات الـ ${topCatAr}`,
        message: `تمثل فئة (${topCatAr}) الحجم الأكبر من مصروفاتك هذا الشهر بقيمة ${topAmount.toLocaleString('ar-EG')} ج.م (${catPercent.toFixed(0)}% من المصاريف الكلية). ننصح بجدولة هذه الفئة دائماً في ميزانيتك الشهرية.`,
        category: topCat
      });
    }
  } else {
    insights.push({
      type: 'info',
      title: 'نصيحة لبدء التتبع المالي',
      message: 'ابدأ بتسجيل كافة المصروفات اليومية والفواتير لتتمكن خوارزميات الذكاء الاصطناعي من تحليل أنماط الصرف بدقة وعرض تقارير دورية مخصصة لعائلتك.',
      category: 'Home'
    });
  }

  // Insight 3: Member/Saving advice
  if (familyMembers && familyMembers.length > 0) {
    const sortedMembers = [...familyMembers].sort((a, b) => (Number(b.spentThisMonth) || 0) - (Number(a.spentThisMonth) || 0));
    const topMember = sortedMembers[0];
    if (topMember && Number(topMember.spentThisMonth) > 0) {
      insights.push({
        type: 'alert',
        title: `متابعة ميزانية ${topMember.name}`,
        message: `سجل ${topMember.name} أعلى معدل صرف فردي بين أفراد العائلة هذا الشهر بقيمة ${(Number(topMember.spentThisMonth)).toLocaleString('ar-EG')} ج.م. يُفضل مناقشة بنود المشتريات المحددة معه لضمان التوافق مع خطة ميزانية العائلة الكلية.`,
        category: 'Home'
      });
    } else {
      insights.push({
        type: 'success',
        title: 'تنظيم مالي جماعي مميز',
        message: `جميع أفراد العائلة المسجلين (${familyMembers.length} أفراد) يشاركون بمسؤولية في إدارة وتتبع الحسابات بشكل جماعي رائع، مما يحافظ على الشفافية المالية داخل البيت.`,
        category: 'Home'
      });
    }
  } else {
    insights.push({
      type: 'success',
      title: 'تخصيص ميزانيات الأفراد',
      message: 'نقترح تسجيل أفراد عائلتك وتحديد ميزانية مصروف شخصي لكل فرد عبر شاشة إدارة العائلة لتتمكن من تتبع ومراقبة إنفاق كل عضو بسهولة وكفاءة.',
      category: 'Home'
    });
  }

  while (insights.length < 3) {
    insights.push({
      type: 'info',
      title: 'نصيحة مالية ذكية',
      message: 'تذكر دائماً قاعدة 50/30/20 للتقسيم المالي: 50% للاحتياجات الأساسية، 30% للرغبات والترفيه، و 20% للادخار والاستثمار لضمان مستقبل مالي مستقر وآمن.',
      category: 'Home'
    });
  }

  return insights.slice(0, 3);
}

const expenseExtractionSystemInstruction = `
  You are Bayti AI (بيت AI), an advanced Arabic family financial assistant.
  Your task is to parse/analyze natural language input, voice transcript or receipt OCR describing an expense or transaction in Egypt/Middle East context, and extract structured details.
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

  You must output exactly a JSON object conforming to the following structure:
  {
    "title": "Short title in Arabic",
    "amount": positive number,
    "category": "Home" | "Shopping" | "Restaurants" | "Transportation" | "Bills" | "Health" | "Education" | "Travel" | "Entertainment" | "Work",
    "merchant": "Merchant name in Arabic or 'غير محدد'",
    "paymentMethod": "Cash" | "Card" | "Wallet",
    "vat": number (defaults to 0),
    "items": [{"name": "Item name in Arabic", "price": number}],
    "notes": "Any extra notes in Arabic",
    "tags": ["tag1", "tag2"] (2-3 short keywords in Arabic)
  }

  CRITICAL SAFETY REQUIREMENT FOR JSON FORMATTING:
  - Under no circumstances should you output unescaped double quotes inside your JSON string values (like in the "title", "merchant", or "notes" values).
  - If you need to write quotation marks inside the Arabic text, ALWAYS use single quotes (') or Arabic quotation marks (« ») instead of standard double quotes. Standard double quotes inside values will corrupt the JSON and cause parsing to crash.
`;

// 1. Gemini Provider Implementation
export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined. Gemini Provider might fail.');
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }

  private getExpenseSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        merchant: { type: Type.STRING },
        paymentMethod: { type: Type.STRING },
        vat: { type: Type.NUMBER },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
            },
            required: ['name', 'price'],
          },
        },
        notes: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'amount', 'category', 'merchant', 'paymentMethod'],
    };
  }

  async parseText(text: string, recordedBy?: string): Promise<AIExpenseResult> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `قم بتحليل الجملة التالية واستخراج تفاصيل المصروف بدقة: "${text}"`,
      config: {
        systemInstruction: expenseExtractionSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: this.getExpenseSchema(),
      },
    });
    return JSON.parse(cleanJsonText(response.text));
  }

  async parseReceipt(base64Image: string, recordedBy?: string): Promise<AIExpenseResult> {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imagePart = {
      inlineData: { mimeType: 'image/jpeg', data: cleanBase64 },
    };
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        imagePart,
        { text: 'اقرأ الفاتورة المرفقة واستخرج منها المشتريات، المجموع، الضريبة، اسم المحل وطريقة الدفع باللغة العربية.' },
      ],
      config: {
        systemInstruction: expenseExtractionSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: this.getExpenseSchema(),
      },
    });
    return JSON.parse(cleanJsonText(response.text));
  }

  async parseVoice(base64Audio: string, mimeType: string, recordedBy?: string): Promise<AIExpenseResult> {
    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');
    const cleanMimeType = mimeType || 'audio/webm';
    const audioPart = {
      inlineData: { mimeType: cleanMimeType, data: cleanBase64 },
    };
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        audioPart,
        { text: 'استمع للتسجيل الصوتي واستخرج تفاصيل المصروف في كود JSON منظم.' },
      ],
      config: {
        systemInstruction: expenseExtractionSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: this.getExpenseSchema(),
      },
    });
    return JSON.parse(cleanJsonText(response.text));
  }

  async generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]> {
    const systemInstruction = `
      You are Bayti AI (بيت AI), the premium family financial advisor for Egyptian and Arab households.
      You generate highly intelligent, friendly, and practical financial advice, alert warnings, congratulations or recommendations in native Arabic.
      The currency is Egyptian Pounds (ج.م / EGP).
      
      Given the family's monthly budget, current expenditures, and list of transactions, generate exactly 3 smart, distinct, and highly practical insights.
      Your insights MUST proactively analyze the spending behavior and include:
      - Comparison of spending versus last month (e.g. "لقد زاد إنفاقك الكلي بنسبة 18% هذا الشهر مقارنة بالشهر الماضي" or "لقد وفرت هذا الشهر مبالغ ممتازة مقارنة بالشهر السابق").
      - Category-specific average spending alerts (e.g. "مصاريف المطاعم وتناول الطعام بالخارج تفوق معدلك المعتاد بنسبة 15%").
      - Budget run-out prediction (e.g. "بناءً على معدل الصرف الحالي، قد تتجاوز ميزانيتك الكلية خلال 9 أيام").
      - Actionable saving recommendation (e.g. "نقترح توفير 600 ج.م عبر تقليص اشتراكات الترفيه غير المستخدمة").
      - Unusual spending detection (e.g. "رصد معاملة شراء غير معتادة بمبلغ مرتفع").
      - End-of-month balance prediction (e.g. "رصيدك المتوقع بنهاية الشهر الجاري هو 4,200 ج.م").
      - Weekly financial health score (e.g. "تقييم صحتك المالية لهذا الأسبوع هو 8.2/10").

      Select the 3 most relevant analyses for this user's current data and return them in a structured JSON array of exactly 3 insight items.

      CRITICAL SAFETY REQUIREMENT FOR JSON FORMATTING:
      - Under no circumstances should you output unescaped double quotes inside your JSON string values (like in the "title" or "message" values).
      - If you need to write quotation marks inside the Arabic text, ALWAYS use single quotes (') or Arabic quotation marks (« ») instead of standard double quotes. Standard double quotes inside values will corrupt the JSON and cause parsing to crash.
    `;

    const promptText = `
      الميزانية الشهرية الكلية للعائلة: ${monthlyBudget || 15000} ج.م.
      أفراد العائلة ومصروفاتهم الحالية: ${JSON.stringify(familyMembers || [])}
      قائمة المصاريف الأخيرة: ${JSON.stringify(expenses ? expenses.slice(0, 15) : [])}
      
      أنتج 3 نصائح/تحذيرات مالية ذكية ومخصصة باللغة العربية بأسلوب راقٍ يشبه مستشاري البنوك الخاصة للأسر المتميزة.
    `;

    const response = await this.ai.models.generateContent({
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
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ['type', 'title', 'message'],
          },
        },
      },
    });

    return JSON.parse(cleanJsonText(response.text));
  }

  async chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string> {
    const totalSpent = context.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBudget = Math.max(0, context.monthlyBudget - totalSpent);
    const daysRemainingInMonth = 30 - new Date().getDate();
    const safeDailyLimit = daysRemainingInMonth > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : remainingBudget;

    const systemInstruction = `
      You are Bayti AI (بيت AI), the absolute smartest and premier Arabic personal financial advisor and virtual advisor for households in Egypt and the Middle East.
      Your personality is highly encouraging, warm, conversational, friendly, and practical. Speak in natural, warm Egyptian/Middle-Eastern Arabic dialect (عامية مصرية راقية وودودة).
      
      You have access to the family's real-time financial data:
      - Monthly income/budget: ${context.monthlyBudget} EGP
      - Actual Total Spent: ${totalSpent} EGP
      - Actual Remaining Budget: ${remainingBudget} EGP
      - Safe Daily Spending Limit: ${safeDailyLimit} EGP
      - Days remaining in month: ${daysRemainingInMonth}
      - Registered family members: ${JSON.stringify(context.familyMembers)}
      - Current recorded expenses: ${JSON.stringify(context.expenses)}
      - Programmed Smart Reminders/Bills: ${JSON.stringify(context.reminders)}
      
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

    const contents = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: { systemInstruction },
    });

    return response.text.trim();
  }
}

// Helper for Fetch-based LLM requests (OpenAI & DeepSeek)
async function fetchLlm(url: string, headers: Record<string, string>, body: any): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM Fetch failed with status ${res.status}: ${errText}`);
  }
  return res.json();
}

// 2. OpenAI Provider Implementation
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  private checkKey() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is missing. Please define it in Secrets or env.');
    }
  }

  async parseText(text: string): Promise<AIExpenseResult> {
    this.checkKey();
    const res = await fetchLlm(
      'https://api.openai.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: expenseExtractionSystemInstruction },
          { role: 'user', content: `قم بتحليل الجملة التالية واستخراج تفاصيل المصروف بدقة: "${text}"` }
        ]
      }
    );
    const content = res.choices[0].message.content;
    return JSON.parse(content);
  }

  async parseReceipt(base64Image: string): Promise<AIExpenseResult> {
    this.checkKey();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const res = await fetchLlm(
      'https://api.openai.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: expenseExtractionSystemInstruction },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'اقرأ الفاتورة المرفقة واستخرج منها المشتريات، المجموع، الضريبة، اسم المحل وطريقة الدفع باللغة العربية.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
            ]
          }
        ]
      }
    );
    return JSON.parse(res.choices[0].message.content);
  }

  async parseVoice(base64Audio: string, mimeType: string): Promise<AIExpenseResult> {
    this.checkKey();
    // OpenAI Whisper or fallback - we can fall back to textual mock extraction or voice transcription
    // For a robust Whisper API call, we need form-data. Let's send transcription request if Whisper API key available, 
    // or parse via text-based fallback by prompting GPT model with transcript if we transcribe it.
    // To keep it simple and robust, let's fall back to Gemini for voice since Gemini natively supports audio in models.generateContent!
    console.log('[OpenAI Provider] Fallback to Gemini for multimodal voice parsing');
    const gemini = new GeminiProvider();
    return gemini.parseVoice(base64Audio, mimeType);
  }

  async generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]> {
    this.checkKey();
    const system = `
      You are Bayti AI (بيت AI), the premium family financial advisor for Egyptian and Arab households.
      You generate highly intelligent, friendly, and practical financial advice, alert warnings, congratulations or recommendations in native Arabic.
      The currency is Egyptian Pounds (ج.م / EGP).
      
      Given the family's monthly budget, current expenditures, and list of transactions, generate exactly 3 smart, distinct, and highly practical insights.
      Your insights MUST proactively analyze the spending behavior and include:
      - Comparison of spending versus last month (e.g. "لقد زاد إنفاقك الكلي بنسبة 18% هذا الشهر مقارنة بالشهر الماضي" or "لقد وفرت هذا الشهر مبالغ ممتازة مقارنة بالشهر السابق").
      - Category-specific average spending alerts (e.g. "مصاريف المطاعم وتناول الطعام بالخارج تفوق معدلك المعتاد بنسبة 15%").
      - Budget run-out prediction (e.g. "بناءً على معدل الصرف الحالي، قد تتجاوز ميزانيتك الكلية خلال 9 أيام").
      - Actionable saving recommendation (e.g. "نقترح توفير 600 ج.م عبر تقليص اشتراكات الترفيه غير المستخدمة").
      - Unusual spending detection (e.g. "رصد معاملة شراء غير معتادة بمبلغ مرتفع").
      - End-of-month balance prediction (e.g. "رصيدك المتوقع بنهاية الشهر الجاري هو 4,200 ج.م").
      - Weekly financial health score (e.g. "تقييم صحتك المالية لهذا الأسبوع هو 8.2/10").

      Return exactly 3 insights as a JSON array matching the structure:
      [
        { "type": "warning" | "info" | "success" | "alert", "title": "catchy title", "message": "Arabic message", "category": "category" }
      ]
    `;
    const prompt = `
      الميزانية الشهرية الكلية للعائلة: ${monthlyBudget || 15000} ج.م.
      أفراد العائلة ومصروفاتهم الحالية: ${JSON.stringify(familyMembers || [])}
      قائمة المصاريف الأخيرة: ${JSON.stringify(expenses ? expenses.slice(0, 15) : [])}
      أنتج 3 نصائح/تحذيرات مالية ذكية ومخصصة باللغة العربية.
    `;
    const res = await fetchLlm(
      'https://api.openai.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ]
      }
    );
    const parsed = JSON.parse(res.choices[0].message.content);
    return parsed.insights || parsed;
  }

  async chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string> {
    this.checkKey();
    const totalSpent = context.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBudget = Math.max(0, context.monthlyBudget - totalSpent);
    const daysRemainingInMonth = 30 - new Date().getDate();
    const safeDailyLimit = daysRemainingInMonth > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : remainingBudget;

    const system = `
      You are Bayti AI (بيت AI), the absolute smartest and premier Arabic personal financial advisor and virtual advisor for households in Egypt and the Middle East.
      Your personality is highly encouraging, warm, conversational, friendly, and practical. Speak in natural, warm Egyptian/Middle-Eastern Arabic dialect (عامية مصرية راقية وودودة).
      Real-time financial data:
      - Monthly income/budget: ${context.monthlyBudget} EGP
      - Actual Total Spent: ${totalSpent} EGP
      - Actual Remaining Budget: ${remainingBudget} EGP
      - Safe Daily Spending Limit: ${safeDailyLimit} EGP
      - Days remaining in month: ${daysRemainingInMonth}
      - Registered family members: ${JSON.stringify(context.familyMembers)}
      - Current recorded expenses: ${JSON.stringify(context.expenses)}
      - Programmed Smart Reminders/Bills: ${JSON.stringify(context.reminders)}
      
      Provide helpful math and predictions with confidence levels, future plans, patterns, and "what-if" calculators. Speak in native warm Egyptian.
    `;

    const messages = [
      { role: 'system', content: system },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const res = await fetchLlm(
      'https://api.openai.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'gpt-4o-mini',
        messages
      }
    );
    return res.choices[0].message.content;
  }
}

// 3. Claude Provider Implementation
export class ClaudeProvider implements AIProvider {
  name = 'Claude';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  private checkKey() {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is missing. Please define it in Secrets or env.');
    }
  }

  async parseText(text: string): Promise<AIExpenseResult> {
    this.checkKey();
    const res = await fetchLlm(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        system: expenseExtractionSystemInstruction + '\nCRITICAL: Return ONLY raw JSON code. Do not output markdown code blocks or conversational prefixes.',
        messages: [{ role: 'user', content: `قم بتحليل الجملة التالية واستخراج تفاصيل المصروف بدقة: "${text}"` }]
      }
    );
    const content = res.content[0].text.trim();
    return JSON.parse(content);
  }

  async parseReceipt(base64Image: string): Promise<AIExpenseResult> {
    this.checkKey();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const res = await fetchLlm(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: expenseExtractionSystemInstruction + '\nCRITICAL: Return ONLY raw JSON code. Do not output markdown code blocks or conversational prefixes.',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: cleanBase64
              }
            },
            { type: 'text', text: 'اقرأ الفاتورة المرفقة واستخرج منها المشتريات، المجموع، الضريبة، اسم المحل وطريقة الدفع باللغة العربية.' }
          ]
        }]
      }
    );
    return JSON.parse(res.content[0].text.trim());
  }

  async parseVoice(base64Audio: string, mimeType: string): Promise<AIExpenseResult> {
    this.checkKey();
    console.log('[Claude Provider] Fallback to Gemini for voice parsing');
    const gemini = new GeminiProvider();
    return gemini.parseVoice(base64Audio, mimeType);
  }

  async generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]> {
    this.checkKey();
    const system = `
      You are Bayti AI (بيت AI), the premium family financial advisor for Egyptian and Arab households.
      You generate highly intelligent, friendly, and practical financial advice, alert warnings, congratulations or recommendations in native Arabic.
      The currency is Egyptian Pounds (ج.م / EGP).
      
      Given the family's monthly budget, current expenditures, and list of transactions, generate exactly 3 smart, distinct, and highly practical insights.
      Your insights MUST proactively analyze the spending behavior and include:
      - Comparison of spending versus last month (e.g. "لقد زاد إنفاقك الكلي بنسبة 18% هذا الشهر مقارنة بالشهر الماضي" or "لقد وفرت هذا الشهر مبالغ ممتازة مقارنة بالشهر السابق").
      - Category-specific average spending alerts (e.g. "مصاريف المطاعم وتناول الطعام بالخارج تفوق معدلك المعتاد بنسبة 15%").
      - Budget run-out prediction (e.g. "بناءً على معدل الصرف الحالي، قد تتجاوز ميزانيتك الكلية خلال 9 أيام").
      - Actionable saving recommendation (e.g. "نقترح توفير 600 ج.م عبر تقليص اشتراكات الترفيه غير المستخدمة").
      - Unusual spending detection (e.g. "رصد معاملة شراء غير معتادة بمبلغ مرتفع").
      - End-of-month balance prediction (e.g. "رصيدك المتوقع بنهاية الشهر الجاري هو 4,200 ج.م").
      - Weekly financial health score (e.g. "تقييم صحتك المالية لهذا الأسبوع هو 8.2/10").

      Return exactly 3 insights as a JSON array matching the structure:
      [
        { "type": "warning" | "info" | "success" | "alert", "title": "catchy title", "message": "Arabic message", "category": "category" }
      ]
      Return ONLY raw JSON. No markdown wrappers.
    `;
    const prompt = `
      الميزانية الشهرية الكلية للعائلة: ${monthlyBudget || 15000} ج.م.
      أفراد العائلة ومصروفاتهم الحالية: ${JSON.stringify(familyMembers || [])}
      قائمة المصاريف الأخيرة: ${JSON.stringify(expenses ? expenses.slice(0, 15) : [])}
      أنتج 3 نصائح/تحذيرات مالية ذكية ومخصصة باللغة العربية.
    `;
    const res = await fetchLlm(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: prompt }]
      }
    );
    const content = res.content[0].text.trim();
    return JSON.parse(content);
  }

  async chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string> {
    this.checkKey();
    const totalSpent = context.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBudget = Math.max(0, context.monthlyBudget - totalSpent);
    const daysRemainingInMonth = 30 - new Date().getDate();
    const safeDailyLimit = daysRemainingInMonth > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : remainingBudget;

    const system = `
      You are Bayti AI (بيت AI), the absolute smartest and premier Arabic personal financial advisor and virtual advisor for households in Egypt and the Middle East.
      Your personality is highly encouraging, warm, conversational, friendly, and practical. Speak in natural, warm Egyptian/Middle-Eastern Arabic dialect (عامية مصرية راقية وودودة).
      Real-time financial data:
      - Monthly income/budget: ${context.monthlyBudget} EGP
      - Actual Total Spent: ${totalSpent} EGP
      - Actual Remaining Budget: ${remainingBudget} EGP
      - Safe Daily Spending Limit: ${safeDailyLimit} EGP
      - Days remaining in month: ${daysRemainingInMonth}
      - Registered family members: ${JSON.stringify(context.familyMembers)}
      - Current recorded expenses: ${JSON.stringify(context.expenses)}
      - Programmed Smart Reminders/Bills: ${JSON.stringify(context.reminders)}
      
      Provide helpful math and predictions with confidence levels, future plans, patterns, and "what-if" calculators. Speak in native warm Egyptian.
    `;

    const messages = [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const res = await fetchLlm(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system,
        messages
      }
    );
    return res.content[0].text.trim();
  }
}

// 4. DeepSeek Provider Implementation
export class DeepSeekProvider implements AIProvider {
  name = 'DeepSeek';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
  }

  private checkKey() {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is missing. Please define it in Secrets or env.');
    }
  }

  async parseText(text: string): Promise<AIExpenseResult> {
    this.checkKey();
    const res = await fetchLlm(
      'https://api.deepseek.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'deepseek-chat',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: expenseExtractionSystemInstruction },
          { role: 'user', content: `قم بتحليل الجملة التالية واستخراج تفاصيل المصروف بدقة: "${text}"` }
        ]
      }
    );
    return JSON.parse(res.choices[0].message.content);
  }

  async parseReceipt(base64Image: string): Promise<AIExpenseResult> {
    this.checkKey();
    // DeepSeek is text-only or doesn't support multimodal base64 image input direct in standard API easily without Vision model,
    // so we fall back to Gemini for receipt OCR.
    console.log('[DeepSeek Provider] Fallback to Gemini for receipt OCR');
    const gemini = new GeminiProvider();
    return gemini.parseReceipt(base64Image);
  }

  async parseVoice(base64Audio: string, mimeType: string): Promise<AIExpenseResult> {
    this.checkKey();
    console.log('[DeepSeek Provider] Fallback to Gemini for voice parsing');
    const gemini = new GeminiProvider();
    return gemini.parseVoice(base64Audio, mimeType);
  }

  async generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]> {
    this.checkKey();
    const system = `
      You are Bayti AI (بيت AI), the premium family financial advisor for Egyptian and Arab households.
      You generate highly intelligent, friendly, and practical financial advice, alert warnings, congratulations or recommendations in native Arabic.
      The currency is Egyptian Pounds (ج.م / EGP).
      
      Given the family's monthly budget, current expenditures, and list of transactions, generate exactly 3 smart, distinct, and highly practical insights.
      Your insights MUST proactively analyze the spending behavior and include:
      - Comparison of spending versus last month (e.g. "لقد زاد إنفاقك الكلي بنسبة 18% هذا الشهر مقارنة بالشهر الماضي" or "لقد وفرت هذا الشهر مبالغ ممتازة مقارنة بالشهر السابق").
      - Category-specific average spending alerts (e.g. "مصاريف المطاعم وتناول الطعام بالخارج تفوق معدلك المعتاد بنسبة 15%").
      - Budget run-out prediction (e.g. "بناءً على معدل الصرف الحالي، قد تتجاوز ميزانيتك الكلية خلال 9 أيام").
      - Actionable saving recommendation (e.g. "نقترح توفير 600 ج.م عبر تقليص اشتراكات الترفيه غير المستخدمة").
      - Unusual spending detection (e.g. "رصد معاملة شراء غير معتادة بمبلغ مرتفع").
      - End-of-month balance prediction (e.g. "رصيدك المتوقع بنهاية الشهر الجاري هو 4,200 ج.م").
      - Weekly financial health score (e.g. "تقييم صحتك المالية لهذا الأسبوع هو 8.2/10").

      Return exactly 3 insights as a JSON array matching the structure:
      [
        { "type": "warning" | "info" | "success" | "alert", "title": "catchy title", "message": "Arabic message", "category": "category" }
      ]
    `;
    const prompt = `
      الميزانية الشهرية الكلية للعائلة: ${monthlyBudget || 15000} ج.م.
      أفراد العائلة ومصروفاتهم الحالية: ${JSON.stringify(familyMembers || [])}
      قائمة المصاريف الأخيرة: ${JSON.stringify(expenses ? expenses.slice(0, 15) : [])}
      أنتج 3 نصائح/تحذيرات مالية ذكية ومخصصة باللغة العربية.
    `;
    const res = await fetchLlm(
      'https://api.deepseek.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'deepseek-chat',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ]
      }
    );
    return JSON.parse(res.choices[0].message.content);
  }

  async chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string> {
    this.checkKey();
    const totalSpent = context.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBudget = Math.max(0, context.monthlyBudget - totalSpent);
    const daysRemainingInMonth = 30 - new Date().getDate();
    const safeDailyLimit = daysRemainingInMonth > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : remainingBudget;

    const system = `
      You are Bayti AI (بيت AI), the absolute smartest and premier Arabic personal financial advisor and virtual advisor for households in Egypt and the Middle East.
      Your personality is highly encouraging, warm, conversational, friendly, and practical. Speak in natural, warm Egyptian/Middle-Eastern Arabic dialect (عامية مصرية راقية وودودة).
      Real-time financial data:
      - Monthly income/budget: ${context.monthlyBudget} EGP
      - Actual Total Spent: ${totalSpent} EGP
      - Actual Remaining Budget: ${remainingBudget} EGP
      - Safe Daily Spending Limit: ${safeDailyLimit} EGP
      - Days remaining in month: ${daysRemainingInMonth}
      - Registered family members: ${JSON.stringify(context.familyMembers)}
      - Current recorded expenses: ${JSON.stringify(context.expenses)}
      - Programmed Smart Reminders/Bills: ${JSON.stringify(context.reminders)}
      
      Provide helpful math and predictions with confidence levels, future plans, patterns, and "what-if" calculators. Speak in native warm Egyptian.
    `;

    const messages = [
      { role: 'system', content: system },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const res = await fetchLlm(
      'https://api.deepseek.com/v1/chat/completions',
      { 'Authorization': `Bearer ${this.apiKey}` },
      {
        model: 'deepseek-chat',
        messages
      }
    );
    return res.choices[0].message.content;
  }
}

// Unified Factory to get the active AI Provider
export class AIService implements AIProvider {
  private activeProvider: AIProvider;

  constructor() {
    const providerEnv = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    console.log(`[AI Abstraction] Loading active provider specified in AI_PROVIDER env var: ${providerEnv}`);
    
    try {
      if (providerEnv === 'openai') {
        this.activeProvider = new OpenAIProvider();
      } else if (providerEnv === 'claude') {
        this.activeProvider = new ClaudeProvider();
      } else if (providerEnv === 'deepseek') {
        this.activeProvider = new DeepSeekProvider();
      } else {
        this.activeProvider = new GeminiProvider();
      }
    } catch (e: any) {
      console.error(`[AI Abstraction] Failed to load provider "${providerEnv}". Falling back to default Gemini. Error:`, e.message);
      this.activeProvider = new GeminiProvider();
    }
  }

  get name() {
    return this.activeProvider.name;
  }

  async parseText(text: string, recordedBy?: string): Promise<AIExpenseResult> {
    try {
      return await this.activeProvider.parseText(text, recordedBy);
    } catch (e: any) {
      console.warn(`[AI Service] Active provider "${this.activeProvider.name}" failed: ${e.message}. Falling back to Gemini.`);
      const backup = new GeminiProvider();
      return await backup.parseText(text, recordedBy);
    }
  }

  async parseReceipt(base64Image: string, recordedBy?: string): Promise<AIExpenseResult> {
    try {
      return await this.activeProvider.parseReceipt(base64Image, recordedBy);
    } catch (e: any) {
      console.warn(`[AI Service] Active provider "${this.activeProvider.name}" failed: ${e.message}. Falling back to Gemini.`);
      const backup = new GeminiProvider();
      return await backup.parseReceipt(base64Image, recordedBy);
    }
  }

  async parseVoice(base64Audio: string, mimeType: string, recordedBy?: string): Promise<AIExpenseResult> {
    try {
      return await this.activeProvider.parseVoice(base64Audio, mimeType, recordedBy);
    } catch (e: any) {
      console.warn(`[AI Service] Active provider "${this.activeProvider.name}" failed: ${e.message}. Falling back to Gemini.`);
      const backup = new GeminiProvider();
      return await backup.parseVoice(base64Audio, mimeType, recordedBy);
    }
  }

  async generateInsights(expenses: any[], familyMembers: any[], monthlyBudget: number): Promise<AIInsightItem[]> {
    try {
      return await this.activeProvider.generateInsights(expenses, familyMembers, monthlyBudget);
    } catch (e: any) {
      console.warn(`[AI Service] Active provider "${this.activeProvider.name}" failed: ${e.message}. Falling back to Gemini.`);
      try {
        const backup = new GeminiProvider();
        return await backup.generateInsights(expenses, familyMembers, monthlyBudget);
      } catch (backupErr: any) {
        console.error(`[AI Service] Gemini backup provider also failed: ${backupErr.message}. Utilizing dynamic local rule-based insights.`);
        return getLocalBackupInsights(expenses, familyMembers, monthlyBudget);
      }
    }
  }

  async chat(message: string, history: any[], context: {
    expenses: any[];
    familyMembers: any[];
    monthlyBudget: number;
    reminders: any[];
  }): Promise<string> {
    try {
      return await this.activeProvider.chat(message, history, context);
    } catch (e: any) {
      console.warn(`[AI Service] Active provider "${this.activeProvider.name}" failed: ${e.message}. Falling back to Gemini.`);
      const backup = new GeminiProvider();
      return await backup.chat(message, history, context);
    }
  }
}

export const aiService = new AIService();
