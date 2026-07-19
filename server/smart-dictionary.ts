import fs from 'fs';
import path from 'path';
import { prisma } from '../db-store.js';

export interface LocalParsedResult {
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

export const DEFAULT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Home: [
    'لبن', 'بيض', 'جبن', 'جبنة', 'عيش', 'خبز', 'خضار', 'فاكهه', 'فاكهة', 'لحم', 'لحمة', 'فراخ', 'دجاج', 'زيت', 'سكر', 'شاي', 'بقاله', 'بقالة', 'منظفات', 'صابون', 'شامبو', 'حفاضات', 'بامبرز', 'ارز', 'رز', 'مكرونه', 'مكرونة', 'زينه', 'مناديل', 'سوبرماركت', 'سوبر ماركت', 'بقال', 'كارفور', 'لولو', 'فتح الله', 'سباك', 'كهربائي', 'نجار', 'منزل', 'بيت', 'شقه', 'شقة', 'ادوات منزليه', 'أدوات منزلية'
  ],
  Shopping: [
    'هدوم', 'ملابس', 'قميص', 'بنطلون', 'جوز', 'جزمة', 'حذاء', 'موبايل', 'تليفون', 'شاحن', 'سماعه', 'سماعة', 'لاب توب', 'كمبيوتر', 'شاشه', 'شاشة', 'اليكترونيات', 'إلكترونيات', 'برفان', 'عطر', 'مكياج', 'امازون', 'أمازون', 'نون', 'شي ان', 'زارا', 'براند', 'ساعه', 'ساعة', 'نظاره', 'نظارة'
  ],
  Restaurants: [
    'غدا', 'غداء', 'عشا', 'عشاء', 'فطور', 'فطار', 'مطعم', 'اكل', 'أكل', 'طعام', 'كافيه', 'مقهي', 'مقهى', 'قهوه', 'قهوة', 'شاي', 'نسكافيه', 'عصير', 'دليفري', 'تيك اواي', 'ماك', 'ماكدونالدز', 'كنتاكي', 'البيك', 'كشري', 'بيتزا', 'برجر', 'شاورما', 'حلويات', 'كريب', 'فلافل', 'فول'
  ],
  Transportation: [
    'بنزين', 'سولار', 'غاز عربيه', 'غاز عربية', 'بنزينه', 'بنزينة', 'اوبر', 'أوبر', 'تاكسي', 'مترو', 'اتوبيس', 'باص', 'ميكروباص', 'تذكره', 'تذكرة', 'شل', 'موبيل', 'توتوك', 'توكتوك', 'بنزين', 'صيانه', 'صيانة', 'تصليح', 'كاوتش', 'اطار', 'إطار', 'ميكانيكي', 'زيت عربيه', 'كارته', 'رخصه', 'رخصة', 'مرور'
  ],
  Bills: [
    'كهرباء', 'كهربا', 'مياه', 'ميه', 'غاز', 'نت', 'انترنت', 'رصيد', 'شحن', 'فاتوره', 'فاتورة', 'تليفون', 'وي', 'فودافون', 'اتصالات', 'اورنج', 'أورنج', 'شحن رصيد', 'قسط', 'مصاريف', 'ايجار', 'إيجار'
  ],
  Health: [
    'دواء', 'دوا', 'صيدليه', 'صيدلية', 'روشته', 'روشتة', 'دكتور', 'طبيب', 'عياده', 'عيادة', 'مستشفي', 'مستشفى', 'تحليل', 'اشعه', 'أشعة', 'كشف', 'علاج', 'العزبي', 'مسكن', 'مرهم', 'طوارئ'
  ],
  Education: [
    'مدرسه', 'مدرسة', 'مدارس', 'كليه', 'كلية', 'جامعه', 'جامعة', 'كتب', 'كشكول', 'كراسه', 'كراسة', 'اقلام', 'أقلام', 'قلم', 'دروس', 'درس', 'كورس', 'دوره', 'دورة', 'مصاريف مدرسه', 'شنطه مدرسه', 'شنطة مدرسة', 'حضانه', 'حضانة', 'ملزمه', 'ملزمة', 'شيت'
  ],
  Travel: [
    'فندق', 'اوتيل', 'تذكره طيران', 'تذكرة طيران', 'طيران', 'سفر', 'رحله', 'رحلة', 'مصيف', 'دهب', 'شرم', 'الغردقه', 'الغردقة', 'حجز', 'جواز سفر', 'بحر'
  ],
  Entertainment: [
    'سينما', 'فيلم', 'العاب', 'ألعاب', 'لعبه', 'لعبة', 'بلايستيشن', 'اشتراك نادي', 'اشتراك نادي', 'نادي', 'ملاهي', 'ملاهى', 'ماتش', 'مباراه', 'مباراة', 'تسليه', 'تسلية', 'سيرك', 'مسرح'
  ],
  Work: [
    'مكتب', 'مكتبه', 'مكتبية', 'ادوات مكتبيه', 'أدوات مكتبية', 'شحن للشركه', 'غداء عمل', 'شغل', 'عمل', 'اجتماع', 'شركه', 'شركة', 'طباعه', 'طباعة', 'اوراق', 'أوراق'
  ]
};

export const PREDEFINED_MERCHANTS: Record<string, string> = {
  'كارفور': 'Home',
  'لولو': 'Home',
  'فتح الله': 'Home',
  'بيم': 'Home',
  'سبينيس': 'Home',
  'مترو ماركت': 'Home',
  'خير زمان': 'Home',
  'امازون': 'Shopping',
  'أمازون': 'Shopping',
  'نون': 'Shopping',
  'شي ان': 'Shopping',
  'زارا': 'Shopping',
  'ماك': 'Restaurants',
  'ماكدونالدز': 'Restaurants',
  'كنتاكي': 'Restaurants',
  'البيك': 'Restaurants',
  'كشري التحرير': 'Restaurants',
  'بيتزا هت': 'Restaurants',
  'ستاربكس': 'Restaurants',
  'شل': 'Transportation',
  'موبيل': 'Transportation',
  'امارات مصر': 'Transportation',
  'أوبر': 'Transportation',
  'اوبر': 'Transportation',
  'فودافون': 'Bills',
  'اتصالات': 'Bills',
  'اورنج': 'Bills',
  'أورنج': 'Bills',
  'العزبي': 'Health',
  'صيدليات مصر': 'Health',
  'تسهيل': 'Bills',
  'امان': 'Bills',
  'أمان': 'Bills',
  'فوري': 'Bills',
  'فوري بلس': 'Bills'
};

const ARABIC_NUMBERS_MAP: Record<string, number> = {
  'صفر': 0, 'واحد': 1, 'اتنين': 2, 'اثنين': 2, 'تلاته': 3, 'ثلاثة': 3, 'اربعه': 4, 'أربعة': 4,
  'خمسه': 5, 'خمسة': 5, 'سته': 6, 'ستة': 6, 'سبعه': 7, 'سبعة': 7, 'ثمانيه': 8, 'تمانيه': 8, 'ثمانية': 8,
  'تسعه': 9, 'تسعة': 9, 'عشره': 10, 'عشرة': 10, 'عشرين': 20, 'تلاتين': 30, 'ثلاثين': 30, 'اربعين': 40, 'أربعين': 40,
  'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90, 'ميه': 100, 'مائة': 100, 'مية': 100,
  'ميتين': 200, 'مائتان': 200, 'الف': 1000, 'ألف': 1000
};

// Normalization utilities
export function normalizeArabic(text: string): string {
  if (!text) return '';
  let normalized = text.trim().toLowerCase();
  
  // Remove diacritics
  normalized = normalized.replace(/[\u064B-\u0652]/g, '');
  
  // Normalize variations of Alef, Teh Marbuta, Yeh
  normalized = normalized.replace(/[أإآ]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  
  // Remove Tatweel/Kashida
  normalized = normalized.replace(/ـ/g, '');
  
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

export function convertArabicDigits(text: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

// Convert common spoken Arabic number words to digits (Egyptian/Gulf dialect)
export function parseArabicNumberWords(text: string): number | null {
  const normalized = normalizeArabic(text);
  const words = normalized.split(/\s+/);
  
  // Simple check for numbers
  let total = 0;
  let hasNumber = false;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (ARABIC_NUMBERS_MAP[word] !== undefined) {
      hasNumber = true;
      const value = ARABIC_NUMBERS_MAP[word];
      
      if (word === 'الف' || word === 'ألف') {
        if (total === 0) total = 1000;
        else total *= 1000;
      } else if (word === 'ميه' || word === 'مائة' || word === 'مية') {
        if (total === 0) total = 100;
        else total *= 100;
      } else {
        total += value;
      }
    }
  }
  
  return hasNumber && total > 0 ? total : null;
}

// Extraction logic
export function extractAmount(text: string): number | null {
  // Convert any Arabic numerals like ٨٥ to 85 first
  const cleanText = convertArabicDigits(text);
  
  // Regular expression to match integers and floating numbers
  const numericRegex = /(?:^|\s|بـ|ب|جنيه|جم|EGP|egp)(\d{1,5}(?:\.\d+)?)(?:\s|$|جنيه|جم|EGP|egp)/gi;
  let match;
  const numbers: number[] = [];
  
  while ((match = numericRegex.exec(cleanText)) !== null) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      numbers.push(val);
    }
  }
  
  // Fallback to simpler digit-grabbing if regex prefix/suffix is restrictive
  if (numbers.length === 0) {
    const simpleRegex = /\b\d+(?:\.\d+)?\b/g;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(cleanText)) !== null) {
      const val = parseFloat(simpleMatch[0]);
      if (!isNaN(val) && val > 0) {
        numbers.push(val);
      }
    }
  }
  
  // If we found numbers, prefer the one that is likely the price
  if (numbers.length > 0) {
    return numbers[numbers.length - 1]; // Return the last parsed digit sequence as the amount
  }
  
  // If no digits, try word-based numbers
  return parseArabicNumberWords(text);
}

// Storing and Loading Learned Dictionary
const DICTIONARY_FILE_PATH = path.join(process.cwd(), 'server', 'smart-dictionary.json');

export interface LearnedDictionary {
  merchants: Record<string, string>; // merchantName -> Category
  userCorrections: Record<string, LocalParsedResult>; // rawSentence -> correctResult
  categories: Record<string, string>; // vocabularyWord -> Category
  frequentPhrases: Record<string, string>; // phrase -> Category
}

export function loadSmartDictionary(): LearnedDictionary {
  const defaultDict: LearnedDictionary = {
    merchants: {},
    userCorrections: {},
    categories: {},
    frequentPhrases: {}
  };
  
  try {
    if (fs.existsSync(DICTIONARY_FILE_PATH)) {
      const data = fs.readFileSync(DICTIONARY_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[SmartDictionary] Failed to load learned dictionary:', err);
  }
  
  return defaultDict;
}

export function saveSmartDictionary(dict: LearnedDictionary) {
  try {
    const dir = path.dirname(DICTIONARY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DICTIONARY_FILE_PATH, JSON.stringify(dict, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SmartDictionary] Failed to save learned dictionary:', err);
  }
}

// Add a learned entry to smart dictionary
export function learnNewMerchant(merchant: string, category: string) {
  const dict = loadSmartDictionary();
  const normalizedMerchant = normalizeArabic(merchant);
  if (normalizedMerchant && !dict.merchants[normalizedMerchant]) {
    dict.merchants[normalizedMerchant] = category;
    saveSmartDictionary(dict);
    console.log(`[SmartDictionary] Learned new merchant: "${merchant}" as "${category}"`);
  }
}

export function learnCorrection(sentence: string, result: LocalParsedResult) {
  const dict = loadSmartDictionary();
  const normalizedSentence = normalizeArabic(sentence);
  dict.userCorrections[normalizedSentence] = result;
  
  // Also learn the merchant mapping if present
  if (result.merchant && result.merchant !== 'غير محدد') {
    dict.merchants[normalizeArabic(result.merchant)] = result.category;
  }
  
  saveSmartDictionary(dict);
  console.log(`[SmartDictionary] Learned sentence correction for: "${sentence}"`);
}

// 90% Deterministic Local Engine Parser
export async function localParseText(text: string, userId?: string): Promise<{
  success: boolean;
  confidence: number;
  expense: LocalParsedResult;
}> {
  const normalizedInput = normalizeArabic(text);
  const dict = loadSmartDictionary();
  
  // Default values
  const result: LocalParsedResult = {
    title: 'مصروف غير محدد',
    amount: 0,
    category: 'Home',
    merchant: 'غير محدد',
    paymentMethod: 'Cash',
    vat: 0,
    items: [],
    notes: 'تمت الإضافة تلقائياً عبر المحرك المحلي المحسن',
    tags: []
  };
  
  // Check exact/near exact previous corrections
  if (dict.userCorrections[normalizedInput]) {
    const saved = dict.userCorrections[normalizedInput];
    // Keep amount matching dynamic if the sentence has a different digit but same structure
    const amount = extractAmount(text);
    return {
      success: true,
      confidence: 100,
      expense: {
        ...saved,
        amount: amount || saved.amount
      }
    };
  }
  
  // 1. Detect Amount
  const detectedAmount = extractAmount(text);
  let confidence = 0;
  
  if (detectedAmount !== null) {
    result.amount = detectedAmount;
    confidence += 40; // Base points for having a valid price
  }
  
  // 2. Detect Merchant & Category
  let detectedCategory: string | null = null;
  let detectedMerchant: string | null = null;
  
  // Check predefined merchants first
  for (const [merch, cat] of Object.entries(PREDEFINED_MERCHANTS)) {
    const normalizedMerch = normalizeArabic(merch);
    if (normalizedInput.includes(normalizedMerch)) {
      detectedMerchant = merch;
      detectedCategory = cat;
      break;
    }
  }
  
  // Check learned merchants next
  if (!detectedMerchant) {
    for (const [merch, cat] of Object.entries(dict.merchants)) {
      if (normalizedInput.includes(merch)) {
        detectedMerchant = merch;
        detectedCategory = cat;
        break;
      }
    }
  }
  
  // Check previous user history for personalized matching
  if (userId) {
    try {
      const history = await prisma.expense.findMany({
        where: { userId, isDeleted: false },
        orderBy: { date: 'desc' },
        take: 100
      });
      
      for (const exp of history) {
        if (exp.merchant && exp.merchant !== 'غير محدد') {
          const normMerch = normalizeArabic(exp.merchant);
          if (normalizedInput.includes(normMerch)) {
            detectedMerchant = exp.merchant;
            detectedCategory = exp.category;
            result.paymentMethod = exp.paymentMethod;
            break;
          }
        }
        const normTitle = normalizeArabic(exp.title);
        if (normalizedInput.includes(normTitle)) {
          detectedMerchant = exp.merchant || 'غير محدد';
          detectedCategory = exp.category;
          result.paymentMethod = exp.paymentMethod;
          result.title = exp.title;
          break;
        }
      }
    } catch (e) {
      console.error('[SmartDictionary] Error querying user expense history:', e);
    }
  }
  
  // Check category keywords if category is still not found
  if (!detectedCategory) {
    let bestCat: string | null = null;
    let maxMatches = 0;
    
    for (const [cat, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
      let catMatches = 0;
      for (const keyword of keywords) {
        const normKw = normalizeArabic(keyword);
        if (normalizedInput.split(/\s+/).includes(normKw) || normalizedInput.includes(' ' + normKw) || normalizedInput.includes(normKw + ' ')) {
          catMatches++;
        }
      }
      if (catMatches > maxMatches) {
        maxMatches = catMatches;
        bestCat = cat;
      }
    }
    
    if (bestCat) {
      detectedCategory = bestCat;
    }
  }
  
  // Set parsed results
  if (detectedCategory) {
    result.category = detectedCategory;
    confidence += 30;
  }
  
  if (detectedMerchant) {
    result.merchant = detectedMerchant;
    result.title = `مصروف من ${detectedMerchant}`;
    confidence += 30;
  } else {
    // Attempt to extract a short title (excluding verbs and numbers)
    const words = text.split(/\s+/);
    const stopWords = [
      'اشتريت', 'شريت', 'جبت', 'دفعت', 'شرينا', 'اشترينا', 'بـ', 'من', 'في', 'ب', 'جنيه', 'جنيها', 'جم', 'egp', 'لي', 'عندي', 'مع', 'على'
    ].map(w => normalizeArabic(w));
    
    const potentialTitleWords = words.filter(word => {
      const nw = normalizeArabic(word);
      return !stopWords.includes(nw) && isNaN(Number(convertArabicDigits(word))) && ARABIC_NUMBERS_MAP[nw] === undefined;
    });
    
    if (potentialTitleWords.length > 0) {
      result.title = potentialTitleWords.slice(0, 3).join(' ');
      confidence += 20;
    } else {
      result.title = 'مصروف جديد';
      confidence += 10;
    }
  }
  
  // Payment method inference
  if (normalizedInput.includes('كارت') || normalizedInput.includes('فيزا') || normalizedInput.includes('بطاقة') || normalizedInput.includes('كريديت')) {
    result.paymentMethod = 'Card';
  } else if (normalizedInput.includes('محفظة') || normalizedInput.includes('فودافون كاش') || normalizedInput.includes('انستاباي')) {
    result.paymentMethod = 'Wallet';
  } else if (normalizedInput.includes('كاش') || normalizedInput.includes('نقدي')) {
    result.paymentMethod = 'Cash';
  }
  
  // Tags & details
  if (result.category) {
    result.tags = [result.category, 'محلي'];
  }
  
  return {
    success: confidence >= 90,
    confidence,
    expense: result
  };
}

// Local OCR receipt parsing logic
export function localParseReceiptOCR(ocrText: string, userId?: string): {
  success: boolean;
  confidence: number;
  expense: LocalParsedResult;
} {
  const normalized = normalizeArabic(ocrText);
  const cleanText = convertArabicDigits(ocrText);
  const dict = loadSmartDictionary();
  
  const result: LocalParsedResult = {
    title: 'فاتورة محلية',
    amount: 0,
    category: 'Home',
    merchant: 'غير محدد',
    paymentMethod: 'Cash',
    vat: 0,
    items: [],
    notes: 'تم الاستخراج محلياً عبر ماسح الفواتير الذكي',
    tags: []
  };
  
  let confidence = 0;
  
  // 1. Detect Merchant
  let matchedMerchant = '';
  let matchedCategory = '';
  
  for (const [merch, cat] of Object.entries(PREDEFINED_MERCHANTS)) {
    const normMerch = normalizeArabic(merch);
    if (normalized.includes(normMerch)) {
      matchedMerchant = merch;
      matchedCategory = cat;
      break;
    }
  }
  
  if (!matchedMerchant) {
    for (const [merch, cat] of Object.entries(dict.merchants)) {
      if (normalized.includes(merch)) {
        matchedMerchant = merch;
        matchedCategory = cat;
        break;
      }
    }
  }
  
  if (matchedMerchant) {
    result.merchant = matchedMerchant;
    result.category = matchedCategory;
    result.title = `فاتورة من ${matchedMerchant}`;
    confidence += 30;
  }
  
  // 2. Extract VAT (Tax)
  const taxRegex = /(?:ضريبه|ضريبة|tax|vat|الخدمه|الخدمة|service)[\s:#]*(\d+(?:\.\d+)?)/gi;
  let taxMatch = taxRegex.exec(cleanText);
  if (taxMatch) {
    const taxVal = parseFloat(taxMatch[1]);
    if (taxVal > 0 && taxVal < 500) {
      result.vat = taxVal;
    }
  }
  
  // 3. Extract Amount / Total
  const totalKeywords = ['المجموع', 'الاجمالي', 'الإجمالي', 'الصافي', 'الصافى', 'total', 'net', 'sum', 'amount', 'المبلغ', 'الحساب'];
  let detectedAmount = 0;
  
  // Line-by-line total detection
  const lines = cleanText.split('\n');
  for (const line of lines) {
    const normLine = normalizeArabic(line);
    let hasTotalKeyword = false;
    for (const kw of totalKeywords) {
      if (normLine.includes(normalizeArabic(kw))) {
        hasTotalKeyword = true;
        break;
      }
    }
    
    if (hasTotalKeyword) {
      const nums = line.match(/\b\d+(?:\.\d+)?\b/g);
      if (nums && nums.length > 0) {
        const parsedVals = nums.map(parseFloat).filter(v => v > 0);
        if (parsedVals.length > 0) {
          detectedAmount = Math.max(...parsedVals);
          break;
        }
      }
    }
  }
  
  // Fallback to highest number on invoice excluding dates & mobile numbers
  if (detectedAmount === 0) {
    const allNums = cleanText.match(/\b\d+(?:\.\d+)?\b/g);
    if (allNums && allNums.length > 0) {
      const candidates = allNums.map(parseFloat).filter(v => {
        if (isNaN(v) || v <= 0) return false;
        if (v === 2026 || v === 2025 || v === 2024 || (v >= 1 && v <= 31 && cleanText.includes('/'))) return false;
        const strVal = v.toString();
        if (strVal.startsWith('01') && strVal.length >= 10) return false;
        if (v > 100000) return false;
        return true;
      });
      
      if (candidates.length > 0) {
        detectedAmount = Math.max(...candidates);
      }
    }
  }
  
  if (detectedAmount > 0) {
    result.amount = detectedAmount;
    confidence += 40;
  }
  
  // 4. Category detection (if not set by merchant)
  if (!result.category) {
    let bestCat = 'Home';
    let maxMatches = 0;
    for (const [cat, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
      let matches = 0;
      for (const kw of keywords) {
        if (normalized.includes(normalizeArabic(kw))) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCat = cat;
      }
    }
    result.category = bestCat;
    if (maxMatches > 0) {
      confidence += 20;
    }
  } else {
    confidence += 20;
  }
  
  // Payment method
  if (normalized.includes('كاش') || normalized.includes('نقدي') || normalized.includes('نقدى')) {
    result.paymentMethod = 'Cash';
  } else if (normalized.includes('فيزا') || normalized.includes('بطاقه') || normalized.includes('بطاقة') || normalized.includes('ماستر') || normalized.includes('مدى') || normalized.includes('visa') || normalized.includes('master')) {
    result.paymentMethod = 'Card';
  } else if (normalized.includes('محفظه') || normalized.includes('محفظة') || normalized.includes('كاش')) {
    result.paymentMethod = 'Wallet';
  }
  
  result.tags = [result.category, 'فاتورة'];
  
  return {
    success: confidence >= 90,
    confidence,
    expense: result
  };
}

// Arabic voice preprocessing pipeline
export function cleanVoiceTranscript(transcript: string): string {
  let text = normalizeArabic(transcript);
  
  // Arabic speech filler words
  const fillers = [
    'يعني', 'اممم', 'امم', 'اه', 'هاا', 'طيب', 'اصلا', 'بقي', 'بقى', 'تمام', 'خلاص', 'يا سيدي', 'بص', 'شوف'
  ].map(w => normalizeArabic(w));
  
  let words = text.split(/\s+/);
  words = words.filter(w => !fillers.includes(normalizeArabic(w)));
  
  return words.join(' ');
}
