/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Banned';
  plan: 'Free' | 'Premium';
  registeredAt: string;
  lastLogin: string;
  device: string;
  ipAddress: string;
  spentThisMonth: number;
  totalSpent: number;
  activityHistory: { date: string; action: string; details: string }[];
  role?: string;
}

export interface Subscription {
  id: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: 'Active' | 'Cancelled' | 'Refunded' | 'Expired';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  expiryDate: string;
}

export interface FeedbackTicket {
  id: string;
  userEmail: string;
  type: 'Bug Report' | 'Feature Request' | 'Support Message';
  subject: string;
  message: string;
  status: 'Open' | 'Solved';
  date: string;
  reply?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  ipAddress: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface ContentItem {
  id: string;
  type: 'banner' | 'announcement' | 'tip' | 'news' | 'daily_msg';
  title: string;
  content: string;
  target?: string;
  isActive: boolean;
  createdAt: string;
}

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_1',
    name: 'أحمد محمود',
    email: 'ahmed.m@gmail.com',
    status: 'Active',
    plan: 'Premium',
    registeredAt: '2026-01-10',
    lastLogin: '2026-07-15 10:32',
    device: 'iPhone 15 Pro Max',
    ipAddress: '197.34.120.45',
    spentThisMonth: 1250,
    totalSpent: 8900,
    activityHistory: [
      { date: '2026-07-15 10:34', action: 'مسح فاتورة', details: 'تم مسح فاتورة بقالة كارفور بقيمة 650 ج.م' },
      { date: '2026-07-15 08:20', action: 'محادثة ذكاء اصطناعي', details: 'سؤال المستشار المالي عن خطة التوفير لرمضان' },
      { date: '2026-07-14 21:10', action: 'إضافة تذكير', details: 'إضافة تذكير بفاتورة الغاز المستحقة يوم 14' }
    ]
  },
  {
    id: 'usr_2',
    name: 'منى الشافعي',
    email: 'mona.sh@hotmail.com',
    status: 'Active',
    plan: 'Free',
    registeredAt: '2026-02-15',
    lastLogin: '2026-07-15 09:12',
    device: 'Samsung Galaxy S24',
    ipAddress: '197.45.22.189',
    spentThisMonth: 450,
    totalSpent: 3200,
    activityHistory: [
      { date: '2026-07-15 09:15', action: 'تسجيل مصروف يدوي', details: 'تسجيل مصروف مواصلات 50 ج.م' },
      { date: '2026-07-13 18:40', action: 'عرض تقرير', details: 'استعراض تقارير الإنفاق النصف شهري' }
    ]
  },
  {
    id: 'usr_3',
    name: 'عمر الفاروق',
    email: 'omar.f@outlook.com',
    status: 'Active',
    plan: 'Premium',
    registeredAt: '2026-03-01',
    lastLogin: '2026-07-14 23:45',
    device: 'iPad Air (5th gen)',
    ipAddress: '196.221.8.99',
    spentThisMonth: 3400,
    totalSpent: 12100,
    activityHistory: [
      { date: '2026-07-14 23:50', action: 'تصدير تقرير مالي', details: 'تصدير تقرير المصروفات الشامل بصيغة Excel' },
      { date: '2026-07-14 11:30', action: 'مسح فاتورة', details: 'تم مسح فاتورة صيدلية العزبي بقيمة 420 ج.م' }
    ]
  },
  {
    id: 'usr_4',
    name: 'سارة عبدالرحمن',
    email: 'sara.ab@gmail.com',
    status: 'Suspended',
    plan: 'Free',
    registeredAt: '2026-04-12',
    lastLogin: '2026-07-08 14:22',
    device: 'Xiaomi Redmi Note 13',
    ipAddress: '102.43.155.67',
    spentThisMonth: 0,
    totalSpent: 1500,
    activityHistory: [
      { date: '2026-07-08 14:25', action: 'تسجيل دخول فاشل', details: 'محاولة تسجيل دخول برقم مرور خاطئ' }
    ]
  },
  {
    id: 'usr_5',
    name: 'خالد الصاوي',
    email: 'khaled.sawi@yahoo.com',
    status: 'Active',
    plan: 'Free',
    registeredAt: '2026-05-20',
    lastLogin: '2026-07-15 11:05',
    device: 'Google Pixel 8',
    ipAddress: '197.60.40.11',
    spentThisMonth: 820,
    totalSpent: 2100,
    activityHistory: [
      { date: '2026-07-15 11:06', action: 'محادثة صوتية ذكية', details: 'استخدام المساعد الصوتي لتسجيل فاتورة غاز 180 ج.م' }
    ]
  },
  {
    id: 'usr_6',
    name: 'نهى الجبالي',
    email: 'noha.geb@gmail.com',
    status: 'Banned',
    plan: 'Free',
    registeredAt: '2025-12-01',
    lastLogin: '2026-06-30 18:22',
    device: 'iPhone 13',
    ipAddress: '41.130.15.220',
    spentThisMonth: 0,
    totalSpent: 4300,
    activityHistory: [
      { date: '2026-06-30 18:22', action: 'إغلاق حساب', details: 'تم حظر المستخدم بقرار من الإدارة لمخالفة سياسات الاستخدام' }
    ]
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_1',
    userName: 'أحمد محمود',
    userEmail: 'ahmed.m@gmail.com',
    plan: 'باقة العائلة الممتازة (Premium)',
    status: 'Active',
    price: 599,
    currency: 'EGP',
    billingCycle: 'yearly',
    startDate: '2026-01-10',
    expiryDate: '2027-01-10'
  },
  {
    id: 'sub_2',
    userName: 'عمر الفاروق',
    userEmail: 'omar.f@outlook.com',
    plan: 'باقة العائلة الممتازة (Premium)',
    status: 'Active',
    price: 99,
    currency: 'EGP',
    billingCycle: 'monthly',
    startDate: '2026-07-01',
    expiryDate: '2026-08-01'
  },
  {
    id: 'sub_3',
    userName: 'سارة عبدالرحمن',
    userEmail: 'sara.ab@gmail.com',
    plan: 'باقة العائلة الممتازة (Premium)',
    status: 'Cancelled',
    price: 99,
    currency: 'EGP',
    billingCycle: 'monthly',
    startDate: '2026-04-12',
    expiryDate: '2026-05-12'
  }
];

export const INITIAL_FEEDBACK: FeedbackTicket[] = [
  {
    id: 'tkt_1',
    userEmail: 'ahmed.m@gmail.com',
    type: 'Bug Report',
    subject: 'فشل قراءة الفاتورة بالتصوير',
    message: 'عند تصوير فاتورة كارفور ذات الخط الضعيف جداً، لم يستطع الذكاء الاصطناعي استخراج الأسعار بشكل صحيح، بل دمج الأسعار ببعضها.',
    status: 'Open',
    date: '2026-07-14'
  },
  {
    id: 'tkt_2',
    userEmail: 'mona.sh@hotmail.com',
    type: 'Feature Request',
    subject: 'مزامنة حساب بنك مصر',
    message: 'أرجو إضافة خاصية الربط مع بنك مصر أو البنك الأهلي المصري بشكل آلي لقرائة الرسائل المصرفية وإدخال المصروف تلقائياً.',
    status: 'Solved',
    date: '2026-07-12',
    reply: 'نشكرك على هذا المقترح الرائع! نعمل حالياً بالفعل على ميزة قراءة الرسائل المصرفية القصيرة (SMS OCR) وبوابات الدفع المفتوحة لإطلاقها قريباً.'
  },
  {
    id: 'tkt_3',
    userEmail: 'khaled.sawi@yahoo.com',
    type: 'Support Message',
    subject: 'استفسار عن مشاركة الحساب مع زوجتي',
    message: 'كيف أقوم بربط هاتف زوجتي بنفس الميزانية؟ هل يحتاج كل منا لحساب منفصل أم نفس الإيميل؟',
    status: 'Open',
    date: '2026-07-15'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    timestamp: '2026-07-15 11:20:05',
    adminEmail: 'admin@bayti-ai.com',
    action: 'تسجيل دخول ناجح للوحة الإدارة',
    ipAddress: '197.34.40.112',
    severity: 'Info'
  },
  {
    id: 'log_2',
    timestamp: '2026-07-15 09:45:12',
    adminEmail: 'admin@bayti-ai.com',
    action: 'تحديث سعر الاشتراك السنوي إلى 599 ج.م',
    ipAddress: '197.34.40.112',
    severity: 'Warning'
  },
  {
    id: 'log_3',
    timestamp: '2026-07-14 22:15:33',
    adminEmail: 'admin@bayti-ai.com',
    action: 'إيقاف حساب المستخدم: s_abdelrahman@gmail.com',
    ipAddress: '197.34.40.112',
    severity: 'Critical'
  },
  {
    id: 'log_4',
    timestamp: '2026-07-14 10:12:00',
    adminEmail: 'admin@bayti-ai.com',
    action: 'فشل محاولة تسجيل دخول - رمز 2FA غير صحيح',
    ipAddress: '102.88.92.145',
    severity: 'Critical'
  }
];

export const INITIAL_CONTENT: ContentItem[] = [
  {
    id: 'cnt_1',
    type: 'banner',
    title: 'عرض الصيف المميز ☀️',
    content: 'اشترك الآن في باقة العائلة الممتازة السنوية ووفر 50% من الرسوم والحصول على مسح لا نهائي للفواتير!',
    target: 'All Users',
    isActive: true,
    createdAt: '2026-06-01'
  },
  {
    id: 'cnt_2',
    type: 'tip',
    title: 'نصيحة اليوم المالية 💡',
    content: 'تقليل الوجبات السريعة وطلب الدليفري بنسبة 20% فقط يوفر لبيتك متوسط 1200 جنيه شهرياً يمكن استثمارها.',
    isActive: true,
    createdAt: '2026-07-15'
  },
  {
    id: 'cnt_3',
    type: 'news',
    title: 'تحديث بيت AI الجديد v1.1',
    content: 'تم إطلاق محاكي الشراء "ماذا لو" الذكي وميزة تظليل الأرقام المالية لحماية الخصوصية في الأماكن العامة.',
    isActive: true,
    createdAt: '2026-07-10'
  }
];

export const INITIAL_FEATURE_FLAGS = {
  betaFeatures: true,
  maintenanceMode: false,
  forceUpdate: false,
  aiInsightsEngine: true,
  voiceInputPremium: true
};
