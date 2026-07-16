/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Home, 
  ShoppingBag, 
  Utensils, 
  Car, 
  FileText, 
  HeartPulse, 
  GraduationCap, 
  Plane, 
  Sparkles, 
  Briefcase 
} from 'lucide-react';
import { CategoryType, Expense, FamilyMember, BillReminder, AIInsight, SmartReminder, SmartNotification } from './types';

// Category details mapping
export const CATEGORY_DETAILS: Record<CategoryType, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  Home: {
    label: 'المنزل',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  Shopping: {
    label: 'التسوق',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
  },
  Restaurants: {
    label: 'المطاعم',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
  },
  Transportation: {
    label: 'المواصلات',
    icon: Car,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  Bills: {
    label: 'الفواتير',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  Health: {
    label: 'الصحة',
    icon: HeartPulse,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
  },
  Education: {
    label: 'التعليم',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
  },
  Travel: {
    label: 'السفر',
    icon: Plane,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
  },
  Entertainment: {
    label: 'الترفيه',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-100',
  },
  Work: {
    label: 'العمل',
    icon: Briefcase,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-100',
  }
};

// Payment methods in Arabic
export const PAYMENT_METHODS = {
  Cash: 'نقدي',
  Card: 'بطاقة مصرفية',
  Wallet: 'محفظة إلكترونية'
};

// Conversion rates with EGP as base
export const CURRENCY_RATES: Record<string, number> = {
  EGP: 1,
  SAR: 0.08,
  AED: 0.078,
  USD: 0.021,
  EUR: 0.019
};

export const CURRENCY_LABELS: Record<string, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$',
  EUR: '€'
};

// Format currency - Consistent financial premium layout with support for multiple currencies and masking
export function formatCurrency(amount: number, currency?: string, hideValues?: boolean): string {
  // Read from localStorage if not explicitly supplied (making it instantly work across all tabs!)
  const finalCurrency = currency || localStorage.getItem('bayti_active_currency') || 'EGP';
  const finalHideValues = hideValues !== undefined ? hideValues : localStorage.getItem('bayti_hide_values') === 'true';

  if (finalHideValues) {
    const label = CURRENCY_LABELS[finalCurrency] || finalCurrency;
    return `•••• ${label}`;
  }
  const rate = CURRENCY_RATES[finalCurrency] || 1;
  const converted = amount * rate;
  
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: converted < 100 && finalCurrency !== 'EGP' ? 2 : 0
  }).format(converted);
  
  const label = CURRENCY_LABELS[finalCurrency] || finalCurrency;
  return `${formatted} ${label}`;
}

// Initial Family Members
export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'أحمد', role: 'الأب', avatar: '👨🏻‍💼', monthlyBudget: 15000, spentThisMonth: 4350 },
  { id: 'm2', name: 'منى', role: 'الأم', avatar: '👩🏻‍⚕️', monthlyBudget: 8000, spentThisMonth: 2890 },
  { id: 'm3', name: 'يوسف', role: 'الابن', avatar: '👨🏻‍💻', monthlyBudget: 3000, spentThisMonth: 1120 },
  { id: 'm4', name: 'فاطمة', role: 'الابنة', avatar: '👧🏻', monthlyBudget: 2000, spentThisMonth: 950 }
];

// Initial Expenses
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    title: 'مشتريات بقالة كارفور المعادي',
    amount: 1250,
    date: new Date().toISOString().split('T')[0],
    category: 'Home',
    merchant: 'كارفور المعادي',
    paymentMethod: 'Card',
    vat: 150,
    recordedBy: 'أحمد',
    notes: 'بقالة الأسبوع متضمنة الخضروات واللحوم المعلبة والمستلزمات الأساسية للمنزل.',
    items: [
      { name: 'لحوم بلدية مجمدة', price: 450 },
      { name: 'أرز مصري فاخر 5 كجم', price: 180 },
      { name: 'زيت خليط قلية 2.5 لتر', price: 210 },
      { name: 'أجبان وألبان متنوعة', price: 260 },
      { name: 'منظفات منزلية متنوعة', price: 150 }
    ]
  },
  {
    id: 'exp_2',
    title: 'روشتة أدوية مكملات غذائية',
    amount: 350,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    category: 'Health',
    merchant: 'صيدلية العزبي',
    paymentMethod: 'Cash',
    vat: 0,
    recordedBy: 'منى',
    notes: 'أدوية الضغط ومقويات عامة للأولاد.'
  },
  {
    id: 'exp_3',
    title: 'توصيلة مشوار الكلية ذهاب وإياب',
    amount: 180,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    category: 'Transportation',
    merchant: 'أوبر مصر',
    paymentMethod: 'Wallet',
    recordedBy: 'يوسف',
    notes: 'أوبر للجامعة في التجمع الخامس بسبب الزحام.'
  },
  {
    id: 'exp_4',
    title: 'فاتورة الكهرباء لشهر يونيو',
    amount: 720,
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
    category: 'Bills',
    merchant: 'شركة كهرباء جنوب القاهرة',
    paymentMethod: 'Wallet',
    vat: 35,
    recordedBy: 'أحمد',
    notes: 'الدفع عبر كود فوري في تطبيق فودافون كاش.'
  },
  {
    id: 'exp_5',
    title: 'وجبات عائلية كشري التحرير سيتي ستارز',
    amount: 320,
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
    category: 'Restaurants',
    merchant: 'كشري التحرير',
    paymentMethod: 'Cash',
    recordedBy: 'فاطمة',
    notes: 'خروجة عائلية يوم الخميس.'
  },
  {
    id: 'exp_6',
    title: 'كتب وملازم الفصل الدراسي الأول',
    amount: 1200,
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 days ago
    category: 'Education',
    merchant: 'مكتبة سمير وعلي المعادي',
    paymentMethod: 'Card',
    vat: 120,
    recordedBy: 'منى',
    notes: 'كتب ومستلزمات المدارس والتحضيرات الدراسية.'
  }
];

// Initial Bill Reminders
export const INITIAL_BILLS: BillReminder[] = [
  {
    id: 'bill_1',
    title: 'فاتورة الغاز الطبيعي للمنزل',
    amount: 180,
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
    category: 'Bills',
    isPaid: false,
    merchant: 'شركة تاون جاز القاهرة'
  },
  {
    id: 'bill_2',
    title: 'فاتورة الإنترنت الأرضي المنزلي وي',
    amount: 450,
    dueDate: new Date(Date.now() + 518400000).toISOString().split('T')[0], // 6 days from now
    category: 'Bills',
    isPaid: false,
    merchant: 'الشركة المصرية للاتصالات WE'
  },
  {
    id: 'bill_3',
    title: 'قسط تجديد اشتراك نادي الصيد',
    amount: 2500,
    dueDate: new Date(Date.now() + 1036800000).toISOString().split('T')[0], // 12 days from now
    category: 'Entertainment',
    isPaid: false,
    merchant: 'نادي الصيد الرياضي بالدقي'
  }
];

// Initial Insights
export const INITIAL_INSIGHTS: AIInsight[] = [
  {
    id: 'ins_1',
    type: 'warning',
    title: 'ارتفاع مصروفات الدليفري',
    message: 'لقد ارتفع إنفاق العائلة على المطاعم بنسبة ٢٤٪ مقارنة بالأسبوع الماضي. نقترح تقليل طلبات الدليفري وتخصيص وجبة واحدة بالخارج أسبوعياً لتوفير ما يقارب ٨٠٠ ج.م هذا الشهر.',
    date: new Date().toISOString().split('T')[0],
    category: 'Restaurants'
  },
  {
    id: 'ins_2',
    type: 'success',
    title: 'أداء ميزانية المنزل ممتاز',
    message: 'أحسنتِ يا منى! إنفاق العائلة على مشتريات البقالة والمنزل يسير بكفاءة تامة، ويسجل انخفاضاً بنسبة ١٢٪ عن الميزانية المحددة حتى اليوم. أنتم توفرون بذكاء!',
    date: new Date().toISOString().split('T')[0],
    category: 'Home'
  },
  {
    id: 'ins_3',
    type: 'alert',
    title: 'ملاحظة مصروفات يوسف',
    message: 'تجاوز يوسف ٨٠٪ من ميزانيته الشهرية المخصصة للمواصلات (بسبب تكرار طلب أوبر). يُنصح يوسف بالاعتماد على المترو أو حافلات النقل التشاركي لتجنب نفاد المصروف قبل نهاية الشهر.',
    date: new Date().toISOString().split('T')[0],
    category: 'Transportation'
  }
];

// Initial Smart Reminders
export const INITIAL_REMINDERS: SmartReminder[] = [
  {
    id: 'rem_1',
    title: 'إيداع الراتب الشهري للعائلة 🏦',
    amount: 15000,
    dueDate: '2026-07-25',
    repeatType: 'monthly',
    priority: 'high',
    status: 'upcoming',
    category: 'salary',
    notes: 'تحويل الراتب الأساسي لحساب البنك الأهلي'
  },
  {
    id: 'rem_2',
    title: 'فاتورة الإنترنت المنزلي WE 🌐',
    amount: 450,
    dueDate: '2026-07-18',
    repeatType: 'monthly',
    priority: 'high',
    status: 'upcoming',
    category: 'bill_internet',
    notes: 'خط الإنترنت الأرضي فائق السرعة'
  },
  {
    id: 'rem_3',
    title: 'فاتورة الكهرباء لشركة جنوب القاهرة ⚡',
    amount: 720,
    dueDate: '2026-07-15',
    repeatType: 'monthly',
    priority: 'high',
    status: 'completed',
    category: 'bill_electricity',
    notes: 'سداد عداد الكارت الذكي'
  },
  {
    id: 'rem_4',
    title: 'اشتراك نتفليكس العائلي 🍿',
    amount: 320,
    dueDate: '2026-07-12',
    repeatType: 'monthly',
    priority: 'low',
    status: 'completed',
    category: 'subscription',
    notes: 'الباقة البريميوم 4K المشتركة'
  },
  {
    id: 'rem_5',
    title: 'فاتورة مياه الشرب والخدمات 💧',
    amount: 120,
    dueDate: '2026-07-10',
    repeatType: 'monthly',
    priority: 'medium',
    status: 'completed',
    category: 'bill_water',
    notes: 'فاتورة استهلاك مياه العمارة المشتركة'
  },
  {
    id: 'rem_6',
    title: 'تغيير زيت وفلتر السيارة 🚗',
    amount: 1800,
    dueDate: '2026-07-08',
    repeatType: 'one-time',
    priority: 'medium',
    status: 'completed',
    category: 'car_maintenance',
    notes: 'تغيير زيت مسافة ٥٠٠٠ كم بمركز الصيانة'
  },
  {
    id: 'rem_7',
    title: 'قسط الجمعية العائلية الدورية 👥',
    amount: 1000,
    dueDate: '2026-07-05',
    repeatType: 'monthly',
    priority: 'high',
    status: 'completed',
    category: 'association',
    notes: 'جمعية الزملاء الشهرية'
  },
  {
    id: 'rem_8',
    title: 'تجديد رخصة القيادة الشخصية 🪪',
    amount: 1500,
    dueDate: '2026-07-01',
    repeatType: 'yearly',
    priority: 'medium',
    status: 'completed',
    category: 'renew_driver_license',
    notes: 'تجديد الرخصة بوحدة مرور الدقي'
  },
  {
    id: 'rem_9',
    title: 'فاتورة الغاز الطبيعي للمنزل 🔥',
    amount: 180,
    dueDate: '2026-07-14',
    repeatType: 'monthly',
    priority: 'high',
    status: 'missed',
    category: 'bill_gas',
    notes: 'يرجى سدادها قبل انقطاع الخدمة'
  },
  {
    id: 'rem_10',
    title: 'شراء دواء الضغط للوالدة 💊',
    amount: 350,
    dueDate: '2026-07-16',
    repeatType: 'monthly',
    priority: 'high',
    status: 'upcoming',
    category: 'buy_medicine',
    notes: 'تكرار شهري من صيدليات العزبي'
  }
];

// Initial Smart Notifications
export const INITIAL_SMART_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'notif_1',
    title: 'فاتورة الغاز مستحقة 🔥',
    message: 'تنبيه: فاتورة الغاز الطبيعي للمنزل مستحقة الدفع بعد ٣ أيام (قيمة ١٨٠ ج.م).',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    isArchived: false,
    priority: 'high',
    category: 'financial'
  },
  {
    id: 'notif_2',
    title: 'مجهود متميز للتوفير 🎉',
    message: 'أحسنت: ميزانية المنزل توفر ١٢٪ حتى اليوم بمجهود متميز من العائلة!',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: false,
    isArchived: false,
    priority: 'medium',
    category: 'family'
  },
  {
    id: 'notif_3',
    title: 'فاتورة الكهرباء مستحقة غداً ⚡',
    message: 'فاتورة الكهرباء الخاصة بك بقيمة ٧٢٠ ج.م مستحقة غداً. يرجى سدادها لتجنب الغرامة.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: true,
    isArchived: false,
    priority: 'high',
    category: 'financial'
  },
  {
    id: 'notif_4',
    title: 'نصيحة بيت AI للمشتريات 💡',
    message: 'معدل صرف المطاعم والوجبات السريعة ارتفع بنسبة ٢٤٪ هذا الأسبوع مقارنة بالأسبوع الماضي. نقترح طهي وجبة منزلية دافئة اليوم! 🍲',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    isRead: false,
    isArchived: false,
    priority: 'medium',
    category: 'ai_tip'
  }
];

