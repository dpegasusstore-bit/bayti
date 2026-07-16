/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  FileText,
  CreditCard,
  Users,
  Award,
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  Activity,
  Heart,
  TrendingUp,
  MapPin,
  CalendarDays,
  ListTodo,
  Check,
  RefreshCw,
  Archive,
  Eye,
  Percent,
  X
} from 'lucide-react';
import { SmartReminder, SmartNotification, Expense, FamilyMember } from '../types';
import { formatCurrency, CATEGORY_DETAILS } from '../utils';

interface RemindersTabProps {
  reminders: SmartReminder[];
  onAddReminder: (reminder: SmartReminder) => void;
  onUpdateReminderStatus: (id: string, status: 'completed' | 'missed' | 'upcoming') => void;
  onDeleteReminder: (id: string) => void;
  smartNotifications: SmartNotification[];
  onMarkNotificationRead: (id: string) => void;
  onArchiveNotification: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  expenses: Expense[];
  familyMembers: FamilyMember[];
  monthlyBudget: number;
  onboardingData?: any;
  onAddExpense?: (expense: Expense) => void;
}

export default function RemindersTab({
  reminders,
  onAddReminder,
  onUpdateReminderStatus,
  onDeleteReminder,
  smartNotifications,
  onMarkNotificationRead,
  onArchiveNotification,
  onMarkAllNotificationsRead,
  expenses,
  familyMembers,
  monthlyBudget,
  onboardingData,
  onAddExpense
}: RemindersTabProps) {
  // Navigation tabs within RemindersTab
  const [subTab, setSubTab] = useState<'reminders' | 'calendar' | 'notifications' | 'summaries' | 'settings'>('reminders');
  
  // State for adding a reminder
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [repeatType, setRepeatType] = useState<'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState('bill_electricity');
  const [notes, setNotes] = useState('');

  // Notifications filtering
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'all' | 'unread' | 'important' | 'financial' | 'family' | 'system' | 'ai_tip'>('all');

  // Summary selector state
  const [summaryType, setSummaryType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Calendar selected day state (default to current day)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(new Date().getDate());

  // Settings State
  const [notifChannels, setNotifChannels] = useState({
    push: true,
    email: false,
    sms: false,
    whatsapp: true
  });
  const [notifTime, setNotifTime] = useState<'morning' | 'afternoon' | 'evening' | 'custom'>('evening');
  const [customTime, setCustomTime] = useState('20:00');

  // AI suggestions for new reminders
  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: 'sug_1',
      title: 'شراء الدواء الشهري للأسرة 💊',
      reason: 'بناءً على مشتريات الصيدلية المتكررة كل شهر، يقترح بيت AI إنشاء تذكير دوري لضمان عدم نسيان الدواء.',
      suggestedReminder: {
        title: 'شراء الأدوية الشهرية للبيت 💊',
        amount: 450,
        repeatType: 'monthly' as const,
        priority: 'high' as const,
        category: 'buy_medicine',
        notes: 'تذكير ذكي مقترح من واقع الفواتير السابقة'
      }
    },
    {
      id: 'sug_2',
      title: 'موعد تجديد اشتراك الإنترنت WE 🌐',
      reason: 'نلاحظ دفع اشتراك الإنترنت في اليوم الخامس من كل شهر. هل تود جدولة تذكير دوري؟',
      suggestedReminder: {
        title: 'تجديد فاتورة الإنترنت المنزلي WE 🌐',
        amount: 450,
        repeatType: 'monthly' as const,
        priority: 'high' as const,
        category: 'bill_internet',
        notes: 'موعد تجديد خط الإنترنت الأرضي'
      }
    },
    {
      id: 'sug_3',
      title: 'تغيير زيت السيارة القادم 🚗',
      reason: 'بناءً على معدل استهلاك السيارة، يوصي بيت AI بجدولة موعد لتغيير الزيت والصيانة الدورية.',
      suggestedReminder: {
        title: 'تغيير زيت السيارة وصيانتها 🚗',
        amount: 2200,
        repeatType: 'one-time' as const,
        priority: 'medium' as const,
        category: 'car_maintenance',
        notes: 'صيانة دورية لحماية المحرك'
      }
    }
  ]);

  // Categories list
  const categoryGroups = {
    financial: [
      { id: 'salary', label: 'يوم الراتب', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      { id: 'bill_electricity', label: 'فاتورة الكهرباء', icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
      { id: 'bill_water', label: 'فاتورة المياه', icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
      { id: 'bill_gas', label: 'فاتورة الغاز', icon: FileText, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' },
      { id: 'bill_internet', label: 'فاتورة الإنترنت', icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
      { id: 'bill_phone', label: 'فاتورة الموبايل', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      { id: 'credit_card', label: 'مستحقات الفيزا', icon: CreditCard, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
      { id: 'loan_installment', label: 'قسط القرض البنكي', icon: CreditCard, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
      { id: 'car_installment', label: 'قسط السيارة', icon: CreditCard, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
      { id: 'home_installment', label: 'قسط شقة/منزل', icon: CreditCard, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
      { id: 'school_fees', label: 'المصاريف المدرسية', icon: Award, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' },
      { id: 'insurance', label: 'قسط التأمين', icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
      { id: 'subscription', label: 'الاشتراكات الدورية', icon: Activity, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
      { id: 'association', label: 'قسط الجمعية الدورية', icon: Users, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
      { id: 'savings_goal', label: 'هدف ادخار ذكي', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      { id: 'custom_bill', label: 'فاتورة خاصة أخرى', icon: FileText, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' }
    ],
    custom: [
      { id: 'buy_medicine', label: 'شراء دواء للأسرة', icon: Heart, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
      { id: 'renew_passport', label: 'تجديد جواز السفر', icon: Shield, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
      { id: 'renew_id', label: 'تجديد البطاقة الشخصية', icon: Shield, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
      { id: 'renew_driver_license', label: 'تجديد رخصة القيادة', icon: Shield, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      { id: 'doctor_appointment', label: 'كشف طبي/عيادة', icon: Heart, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
      { id: 'car_maintenance', label: 'صيانة السيارة', icon: Activity, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
      { id: 'oil_change', label: 'تغيير زيت وفلتر', icon: Activity, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
      { id: 'pay_rent', label: 'دفع إيجار البيت', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      { id: 'travel', label: 'حجز رحلة أو سفر', icon: MapPin, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
      { id: 'birthday', label: 'عيد ميلاد أحد أفراد البيت', icon: Award, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
      { id: 'anniversary', label: 'مناسبة زواج أو ذكرى تهمنا', icon: Award, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
      { id: 'shopping_list', label: 'شراء متطلبات هامة', icon: ListTodo, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
      { id: 'family_meeting', label: 'اجتماع أو غداء عائلي', icon: Users, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' }
    ]
  };

  // Map category ID to label/icon
  const getCategoryDetails = (catId: string) => {
    const all = [...categoryGroups.financial, ...categoryGroups.custom];
    const match = all.find(c => c.id === catId);
    return match || { label: 'تذكير ذكي', icon: Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' };
  };

  // Filtered Reminders lists
  const upcomingReminders = useMemo(() => {
    return reminders.filter(r => r.status === 'upcoming').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders]);

  const missedReminders = useMemo(() => {
    return reminders.filter(r => r.status === 'missed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders]);

  const completedReminders = useMemo(() => {
    return reminders.filter(r => r.status === 'completed').sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [reminders]);

  // Handle reminder submission
  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: SmartReminder = {
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
      title,
      amount: amount ? Number(amount) : 0,
      dueDate,
      repeatType,
      priority,
      status: new Date(dueDate) < new Date(new Date().toISOString().split('T')[0]) ? 'missed' : 'upcoming',
      category,
      notes
    };

    onAddReminder(newReminder);
    setTitle('');
    setAmount('');
    setNotes('');
    setShowAddForm(false);
  };

  // Handle adding an AI suggested reminder
  const handleAcceptSuggestion = (sug: typeof aiSuggestions[0]) => {
    const newRem: SmartReminder = {
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
      title: sug.suggestedReminder.title,
      amount: sug.suggestedReminder.amount,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Due in 3 days
      repeatType: sug.suggestedReminder.repeatType,
      priority: sug.suggestedReminder.priority,
      status: 'upcoming',
      category: sug.suggestedReminder.category,
      notes: sug.suggestedReminder.notes,
      isAiGenerated: true
    };
    onAddReminder(newRem);
    // Remove suggestion
    setAiSuggestions(aiSuggestions.filter(s => s.id !== sug.id));
  };

  // Notification center filtered list
  const filteredNotifications = useMemo(() => {
    return smartNotifications.filter(n => {
      if (n.isArchived) return false;
      if (notifCategoryFilter === 'all') return true;
      if (notifCategoryFilter === 'unread') return !n.isRead;
      if (notifCategoryFilter === 'important') return n.priority === 'high';
      return n.category === notifCategoryFilter;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [smartNotifications, notifCategoryFilter]);

  // Handle Mark as Completed (Automatically pays and creates an expense if it's financial)
  const handleMarkCompletedWithPayment = (rem: SmartReminder) => {
    onUpdateReminderStatus(rem.id, 'completed');
    
    // If there's an amount and onAddExpense is provided, offer to record it in transactions automatically!
    if (rem.amount > 0 && onAddExpense) {
      const isSalary = rem.category === 'salary';
      if (!isSalary) {
        // Record as expense
        onAddExpense({
          id: 'exp_' + Math.random().toString(36).substr(2, 9),
          title: `سداد: ${rem.title}`,
          amount: rem.amount,
          date: new Date().toISOString().split('T')[0],
          category: 'Bills',
          merchant: rem.notes || 'سداد فواتير عائلية',
          paymentMethod: 'Wallet',
          recordedBy: onboardingData?.name || 'أحمد',
          notes: `تم السداد والخصم التلقائي عبر قسم التذكيرات الذكية في بيت AI.`,
          tags: ['فواتير', 'سداد_ذكي']
        });
      }
    }
  };

  // SUMMARIES DYNAMIC CALCULATION
  const totalSpentToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return expenses.filter(e => e.date === todayStr).reduce((a, b) => a + b.amount, 0);
  }, [expenses]);

  const tomorrowReminders = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().split('T')[0];
    return reminders.filter(r => r.dueDate === tomStr && r.status === 'upcoming');
  }, [reminders]);

  // Calendar render days for July 2026 (Starts on Wednesday, starts at index 3, has 31 days)
  const totalCalendarDays = 31;
  const calendarStartOffset = 3; 

  const calendarCells = [];
  for (let i = 0; i < calendarStartOffset; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= totalCalendarDays; i++) {
    calendarCells.push(i);
  }

  // Get active events for a specific calendar day in July 2026
  const getDayEvents = (day: number) => {
    const results: Array<{ id: string; title: string; amount: number; type: string; color: string; isPaid?: boolean; origReminder?: SmartReminder }> = [];
    
    // Scan reminders
    reminders.forEach(r => {
      const d = new Date(r.dueDate);
      // Ensure month is July 2026 (or just match day if we ignore month for simplicity)
      if (d.getDate() === day) {
        const det = getCategoryDetails(r.category);
        results.push({
          id: r.id,
          title: r.title,
          amount: r.amount,
          type: r.category === 'salary' ? 'salary' : 'bill',
          color: r.category === 'salary' ? 'text-emerald-500' : 'text-blue-500',
          isPaid: r.status === 'completed',
          origReminder: r
        });
      }
    });

    return results;
  };

  const selectedDayEvents = getDayEvents(selectedCalendarDay);

  return (
    <div className="space-y-5 pb-24 select-none">
      
      {/* Title & Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">مركز التذكيرات الذكي</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">بيت AI ينظّم التزاماتك لراحتك الكاملة</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm shadow-blue-100 dark:shadow-none transition-colors"
          id="btn_add_new_reminder"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>تذكير جديد</span>
        </button>
      </div>

      {/* Reminder Summary Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">المستحقة قريباً</span>
          <span className="text-xl font-black text-blue-600 font-mono mt-0.5 block">{upcomingReminders.length}</span>
        </div>
        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/60 dark:border-red-900/30 p-3.5 rounded-2xl text-center shadow-2xs">
          <span className="text-[10px] font-bold text-red-500 uppercase block">متأخرة السداد</span>
          <span className="text-xl font-black text-red-600 font-mono mt-0.5 block animate-pulse">{missedReminders.length}</span>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 p-3.5 rounded-2xl text-center shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-500 block">تم سدادها</span>
          <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">{completedReminders.length}</span>
        </div>
      </div>

      {/* Sub-Navigation Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/40 overflow-x-auto scrollbar-none gap-0.5">
        {[
          { id: 'reminders', label: '⏰ التذكيرات' },
          { id: 'calendar', label: '📅 التقويم الذكي' },
          { id: 'notifications', label: '🔔 الإشعارات' },
          { id: 'summaries', label: '📊 الملخصات' },
          { id: 'settings', label: '⚙️ الإعدادات' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all shrink-0 text-center ${
              subTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------- ADD FORM DRAWER ------------------- */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmitReminder}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm animate-slide-down"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">إضافة تذكير ذكي جديد</h3>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black">خطط لالتزاماتك وعلاجاتك ومواعيدك</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">اسم التذكير / الالتزام *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: قسط السيارة، فاتورة الكهرباء، دواء الضغط..."
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">القيمة التقريبية (ج.م)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 500 (اختياري)"
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">تاريخ الاستحقاق *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">التكرار الدوري</label>
                <select
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none"
                >
                  <option value="one-time">لمرة واحدة فقط</option>
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">الأهمية والأولوية</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none"
                >
                  <option value="high">🔴 أولوية قصوى (حرج)</option>
                  <option value="medium">🟡 متوسطة الأهمية</option>
                  <option value="low">🟢 عادية (مفضلة)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">الفئة والتصنيف المالي أو الشخصي</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none"
                >
                  <optgroup label="التزامات مالية وفواتير">
                    {categoryGroups.financial.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="مواعيد وصيانة وتذكيرات منزلية">
                    {categoryGroups.custom.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="رقم الفاتورة، تفاصيل الصيانة، الصيدلية المعنية، إلخ..."
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-blue-600 outline-none text-right h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                حفظ التذكير وجدولته
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------- VIEW 1: REMINDERS LIST ------------------- */}
      {subTab === 'reminders' && (
        <div className="space-y-4">
          
          {/* AI Automated Suggestion Banner */}
          {aiSuggestions.length > 0 && (
            <div className="bg-[#2563EB]/5 border border-blue-100 dark:border-blue-900/50 rounded-[2rem] p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <Sparkles className="w-4 h-4 fill-[#2563EB] animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider">اقتراحات التذكير الذاتية من بيت AI</h3>
                </div>
                <span className="text-[8.5px] font-bold bg-white dark:bg-slate-800 border border-blue-200/50 px-2 py-0.5 rounded-md text-blue-600">ذكي تماماً</span>
              </div>
              <div className="space-y-3">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{sug.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{sug.reason}</p>
                    </div>
                    <div className="flex gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => setAiSuggestions(aiSuggestions.filter(s => s.id !== sug.id))}
                        className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                      >
                        تجاهل
                      </button>
                      <button
                        onClick={() => handleAcceptSuggestion(sug)}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>جدول التذكير</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed Overdue Section */}
          {missedReminders.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>متأخرات وتنبيهات مستعجلة (يرجى سدادها!)</span>
              </h3>
              
              <div className="space-y-2.5">
                {missedReminders.map((rem) => {
                  const det = getCategoryDetails(rem.category);
                  const Icon = det.icon;
                  return (
                    <div 
                      key={rem.id}
                      className="bg-red-50/40 dark:bg-red-950/5 border-2 border-red-200/80 dark:border-red-900/40 rounded-[2rem] p-4 flex justify-between items-center hover:border-red-300 dark:hover:border-red-900/80 transition-all shadow-xs relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${det.color}`}>
                          <Icon className="w-5.5 h-5.5 stroke-[1.8]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-red-900 dark:text-red-300">{rem.title}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-red-700 dark:text-red-400/80 font-bold mt-1">
                            <span>فوق موعد الاستحقاق:</span>
                            <span className="font-mono bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded font-black">{rem.dueDate}</span>
                            <span>•</span>
                            <span>{rem.repeatType === 'monthly' ? 'شهري' : rem.repeatType === 'one-time' ? 'لمرة واحدة' : 'دوري'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-left shrink-0 pl-1">
                          {rem.amount > 0 && (
                            <p className="text-xs font-mono font-black text-red-600 dark:text-red-400">
                              - {formatCurrency(rem.amount)}
                            </p>
                          )}
                          <span className="text-[8px] bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold block text-center mt-1">متأخر</span>
                        </div>
                        <button
                          onClick={() => handleMarkCompletedWithPayment(rem)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                          title="تم السداد والتسجيل"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>الالتزامات القادمة المجدولة</span>
            </h3>

            {upcomingReminders.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-xs text-slate-400">
                رائع! لا توجد التزامات مجدولة قريبة قادمة. ✨
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingReminders.map((rem) => {
                  const det = getCategoryDetails(rem.category);
                  const Icon = det.icon;
                  return (
                    <div 
                      key={rem.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100/70 dark:border-slate-800 rounded-[2rem] p-4 flex justify-between items-center hover:border-blue-200 dark:hover:border-slate-800 transition-all shadow-2xs relative"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${det.color}`}>
                          <Icon className="w-5.5 h-5.5 stroke-[1.8]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{rem.title}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                            <span>الاستحقاق:</span>
                            <span className="font-mono bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-black">{rem.dueDate}</span>
                            <span>•</span>
                            <span className={`font-black ${rem.priority === 'high' ? 'text-red-500' : 'text-slate-500'}`}>
                              {rem.priority === 'high' ? '🔴 أولوية عالية' : '🟡 متوسط'}
                            </span>
                          </div>
                          {rem.notes && <p className="text-[9px] text-slate-400 mt-0.5">📝 {rem.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-left shrink-0 pl-1">
                          {rem.amount > 0 ? (
                            <p className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                              - {formatCurrency(rem.amount)}
                            </p>
                          ) : (
                            <span className="text-[8px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">موعد فقط</span>
                          )}
                          <span className="text-[8px] bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold block text-center mt-1">قريباً</span>
                        </div>
                        <button
                          onClick={() => handleMarkCompletedWithPayment(rem)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                          title="تحديد كمكتمل"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-2 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Section */}
          {completedReminders.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>الالتزامات والمدفوعات المكتملة</span>
              </h3>

              <div className="space-y-2.5 opacity-75">
                {completedReminders.slice(0, 5).map((rem) => {
                  const det = getCategoryDetails(rem.category);
                  const Icon = det.icon;
                  return (
                    <div 
                      key={rem.id}
                      className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/40 dark:border-emerald-900/20 rounded-[2rem] p-4 flex justify-between items-center transition-all shadow-2xs relative"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-5.5 h-5.5 stroke-[1.8]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 line-through">{rem.title}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">تم السداد والتسجيل بنجاح في ميزانية الأسرة</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-left shrink-0 pl-1">
                          {rem.amount > 0 && (
                            <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(rem.amount)}
                            </p>
                          )}
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold block text-center mt-1">مكتمل</span>
                        </div>
                        <button
                          onClick={() => onUpdateReminderStatus(rem.id, 'upcoming')}
                          className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-50"
                          title="إعادة جدولة كغير مسدد"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------- VIEW 2: SMART CALENDAR ------------------- */}
      {subTab === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                <CalendarIcon className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-sm font-black">الجدول والتقويم الموحد للبيت</h3>
              </div>
              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">
                <Sparkles className="w-3 h-3 fill-blue-600 dark:fill-blue-400 animate-pulse" />
                <span>يوليو ٢٠٢٦</span>
              </div>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
              <span>أح</span>
              <span>اث</span>
              <span>ثل</span>
              <span>أر</span>
              <span>خم</span>
              <span>جم</span>
              <span>سب</span>
            </div>

            {/* Grid of days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty_${idx}`} className="h-9"></div>;
                }

                const dayEvents = getDayEvents(day);
                const isSelected = day === selectedCalendarDay;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={`day_${day}`}
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`h-10 flex flex-col items-center justify-between py-1 rounded-xl transition-all relative ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black scale-105 shadow-sm shadow-blue-100 dark:shadow-none'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs'
                    }`}
                  >
                    <span className="text-[11px] leading-none mt-1">{day}</span>
                    
                    {/* Event indicators */}
                    <div className="flex gap-0.5 justify-center pb-1">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <span 
                          key={i} 
                          className={`w-1 h-1 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : ev.isPaid 
                                ? 'bg-emerald-500' 
                                : 'bg-blue-500'
                          }`} 
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected day events panel */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                تفاصيل يوم {selectedCalendarDay} يوليو المجدولة:
              </span>

              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl text-[11px] text-slate-400">
                  اليوم فارغ من أي التزامات مسجلة. استمتع براحة البال! 🌴
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      className={`p-3.5 rounded-2xl border border-slate-100/60 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/10`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/30 text-blue-600`}>
                          {ev.type === 'salary' ? <DollarSign className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{ev.title}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {ev.isPaid ? '✅ تم السداد' : '⏳ مستحق السداد'}
                          </span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        {ev.amount > 0 ? (
                          <p className={`text-xs font-black font-mono ${ev.type === 'salary' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {ev.type === 'salary' ? '+' : '-'} {formatCurrency(ev.amount)}
                          </p>
                        ) : (
                          <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full dark:bg-slate-700">بدون ميزانية</span>
                        )}
                        {!ev.isPaid && ev.origReminder && (
                          <button
                            onClick={() => handleMarkCompletedWithPayment(ev.origReminder!)}
                            className="text-[9px] font-black bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg block mt-1 transition-colors"
                          >
                            سداد سريع
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------- VIEW 3: NOTIFICATION CENTER ------------------- */}
      {subTab === 'notifications' && (
        <div className="space-y-4">
          
          {/* Internal Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: '📭 الكل' },
              { id: 'unread', label: '🆕 غير مقروء' },
              { id: 'important', label: '🔥 هام جداً' },
              { id: 'financial', label: '💵 المالية' },
              { id: 'family', label: '👨‍👩‍👧 أفراد البيت' },
              { id: 'ai_tip', label: '💡 نصائح AI' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setNotifCategoryFilter(f.id as any)}
                className={`px-3.5 py-1.5 text-[10px] font-bold rounded-full transition-all shrink-0 ${
                  notifCategoryFilter === f.id
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10.5px] text-slate-400 px-1">
            <span>تحديث فوري وتلقائي</span>
            {smartNotifications.some(n => !n.isRead && !n.isArchived) && (
              <button 
                onClick={onMarkAllNotificationsRead}
                className="text-blue-600 hover:underline font-bold"
              >
                قراءة الكل
              </button>
            )}
          </div>

          {/* List of Notifications with Swipe simulator buttons */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-xs text-slate-400">
              علبة التنبيهات فارغة ومريحة. لا توجد تنبيهات جديدة! 🕊️
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`bg-white dark:bg-slate-900 border rounded-[2rem] p-4 shadow-3xs hover:border-blue-200 transition-all relative overflow-hidden group ${
                    !notif.isRead 
                      ? 'border-l-4 border-l-blue-600 border-slate-100/80 dark:border-slate-800' 
                      : 'border-slate-100/50 dark:border-slate-850 opacity-80'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.category === 'financial' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : notif.category === 'ai_tip' 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                            : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {notif.category === 'financial' ? <DollarSign className="w-4 h-4" /> : notif.category === 'ai_tip' ? <Sparkles className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{notif.title}</h4>
                          {notif.priority === 'high' && (
                            <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 text-[8px] font-black px-1.5 py-0.5 rounded">عاجل</span>
                          )}
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Mark Read / Archive */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="تمت القراءة"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onArchiveNotification(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="أرشفة"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ------------------- VIEW 4: SUMMARIES ------------------- */}
      {subTab === 'summaries' && (
        <div className="space-y-4">
          
          {/* Toggle Daily / Weekly / Monthly */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/40">
            <button
              onClick={() => setSummaryType('daily')}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                summaryType === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              🌌 الملخص اليومي
            </button>
            <button
              onClick={() => setSummaryType('weekly')}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                summaryType === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              📅 الملخص الأسبوعي
            </button>
            <button
              onClick={() => setSummaryType('monthly')}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                summaryType === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              📊 الملخص الشهري
            </button>
          </div>

          {/* DYNAMIC SUMMARIES */}
          {summaryType === 'daily' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌌</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">الملخص المالي اليومي للبيت</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString('ar-EG', { weekday: 'long' })}</span>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">الإنفاق المسجّل لليوم:</p>
                  <p className="text-2xl font-black text-rose-500 font-mono mt-1">{formatCurrency(totalSpentToday)}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase">مستجدات استحقاق الغد:</h4>
                  {tomorrowReminders.length === 0 ? (
                    <p className="text-xs text-emerald-600 font-medium">✨ لا توجد فواتير أو التزامات مالية مستحقة غداً.</p>
                  ) : (
                    tomorrowReminders.map(rem => (
                      <div key={rem.id} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl text-xs flex justify-between items-center text-red-950 dark:text-red-400">
                        <span className="font-bold">{rem.title}</span>
                        <span className="font-mono font-black">{formatCurrency(rem.amount)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl text-xs leading-relaxed text-blue-900 dark:text-blue-300 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600 animate-pulse" />
                    <span>رؤية بيت AI الفورية:</span>
                  </p>
                  <p>
                    {totalSpentToday > 1000 
                      ? 'إنفاق اليوم مرتفع نسبياً بسبب تلبية طلبات متكاملة. يوصى غداً بيوم توفير كامل للحفاظ على الرصيد الاحتياطي آمناً.' 
                      : 'أداء ممتاز اليوم! لقد حافظت على الميزانية قيد التحكم وتجنبت الشراء المندفع. استمر على هذا المنوال لتعزيز مدخرات العائلة لهذا الشهر.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {summaryType === 'weekly' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">التقرير المالي الأسبوعي (يوم الجمعة)</h3>
                </div>
                <span className="text-[10px] text-slate-400">يوليو ٢٠٢٦</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 font-bold block">إجمالي الصرف الأسبوعي</span>
                  <span className="text-base font-black text-slate-800 dark:text-white font-mono mt-0.5 block">
                    {formatCurrency(expenses.filter(e => {
                      const expDate = new Date(e.date);
                      const diffTime = Math.abs(new Date().getTime() - expDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }).reduce((acc, curr) => acc + curr.amount, 0))}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 font-bold block">معدل التوفير المحتمل</span>
                  <span className="text-base font-black text-emerald-600 font-mono mt-0.5 block">١٤٪ من الراتب</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الالتزامات والأقساط للأسبوع القادم:</h4>
                <div className="space-y-1.5">
                  {reminders.filter(r => r.status === 'upcoming').slice(0, 2).map(rem => (
                    <div key={rem.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{rem.title}</span>
                      <span className="font-mono text-slate-500 font-bold">{formatCurrency(rem.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs leading-relaxed text-emerald-900 dark:text-emerald-400 space-y-1.5">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>توصيات أسبوعية لتحسين الصرف:</span>
                </p>
                <p>نلاحظ أن نفقات بند كارفور ومستلزمات السوبرماركت مرتفعة. ينصح بشراء الطلبات دفعة واحدة أسبوعياً بدلاً من الشراء اليومي لتوفير ما يقارب من ٥٠٠ ج.م شهرياً.</p>
              </div>
            </div>
          )}

          {summaryType === 'monthly' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">كشف الملخص المالي الشهري</h3>
                </div>
                <span className="text-[10px] text-slate-400">قفل حسابات يوليو ٢٠٢٦</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">الدخل المعتمد</span>
                  <span className="text-base font-black text-emerald-600 font-mono">{formatCurrency(monthlyBudget)}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">إجمالي المصروفات</span>
                  <span className="text-base font-black text-rose-500 font-mono">
                    {formatCurrency(expenses.reduce((a, b) => a + b.amount, 0))}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">المدخرات المحققة</span>
                  <span className="text-base font-black text-blue-600 font-mono">
                    {formatCurrency(Math.max(0, monthlyBudget - expenses.reduce((a, b) => a + b.amount, 0)))}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">أعلى بند صرف</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white mt-1 block">البقالة والمنزل 🥬</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3 text-xs">
                <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 rounded-xl">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400">💡 أفضل قرار مالي هذا الشهر:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">الالتزام بسداد قسط الجمعية المجدولة فوراً وعدم سحب أي مبالغ إضافية من الفيزا.</p>
                </div>
                <div className="p-3 bg-red-50/40 dark:bg-red-950/10 border border-red-100 rounded-xl">
                  <span className="font-bold text-red-800 dark:text-red-400">⚠️ قرار يحتاج تحسين:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">الزيادة المفاجئة بنسبة ٢٤٪ في طلب الوجبات الجاهزة الخارجية والقهوة.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------- VIEW 5: SETTINGS ------------------- */}
      {subTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-sm text-xs font-semibold">
          
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1">
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span>إعدادات قنوات التنبيه والتذكير</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">اختر أين ترغب في استلام إشعارات التذكير بالفواتير والأقساط</p>
          </div>

          {/* Channels checklist */}
          <div className="space-y-3.5 border-t border-b border-slate-100 dark:border-slate-850 py-4">
            
            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">إشعارات الهاتف الفورية (Push)</span>
                  <span className="text-[9px] text-slate-400 block">تدعم PWA و Android و iOS تلقائياً</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifChannels.push}
                onChange={() => setNotifChannels({ ...notifChannels, push: !notifChannels.push })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">بريد إلكتروني تفصيلي (Email)</span>
                  <span className="text-[9px] text-slate-400 block">استلم كشفاً أسبوعياً كل جمعة</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifChannels.email}
                onChange={() => setNotifChannels({ ...notifChannels, email: !notifChannels.email })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">رسائل واتساب المباشرة (WhatsApp)</span>
                  <span className="text-[9px] text-slate-400 block">ربط ذكي مع مساعد واتساب التفاعلي لـ Bayti</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifChannels.whatsapp}
                onChange={() => setNotifChannels({ ...notifChannels, whatsapp: !notifChannels.whatsapp })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl opacity-65">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">الرسائل القصيرة (SMS)</span>
                  <span className="text-[9px] text-slate-400 block">قيد التطوير والربط مع شركات الاتصالات</span>
                </div>
              </div>
              <span className="text-[8px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">قريباً</span>
            </div>

          </div>

          {/* Time Picker */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase">توقيت إرسال التنبيه اليومي المفضل:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'morning', label: '🌅 الصباح الباكر (٩ ص)' },
                { id: 'afternoon', label: '☀️ بعد الظهر (٢ م)' },
                { id: 'evening', label: '🌌 المساء الهادئ (٨ م)' },
                { id: 'custom', label: '⚙️ اختيار وقت مخصص' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNotifTime(t.id as any)}
                  className={`p-3 text-[10.5px] font-bold rounded-xl border text-right transition-colors ${
                    notifTime === t.id
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                      : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {notifTime === 'custom' && (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">حدد الساعة والدقائق:</span>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono outline-none text-left"
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            🛡️ جميع التذكيرات والاشعارات الخاصة بـ Bayti AI متوافقة تماماً مع معايير الأمان وقواعد الـ PWA، وتعمل في الخلفية لضمان راحة عائلتك المطلقة.
          </div>

        </div>
      )}

    </div>
  );
}
