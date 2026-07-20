/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Camera, 
  Mic, 
  PenTool, 
  TrendingUp, 
  ArrowLeftRight, 
  Calendar,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RefreshCw,
  Wallet,
  Search,
  MessageCircle,
  Award,
  ChevronDown,
  ChevronUp,
  CreditCard,
  User,
  ShoppingBag,
  Target
} from 'lucide-react';
import { Expense, AIInsight, FamilyMember } from '../types';
import { CATEGORY_DETAILS, formatCurrency, getLocalDateString } from '../utils';
import SmartCalendar from './SmartCalendar';
import FinancialGoals from './FinancialGoals';
import AIAdvisorChat from './AIAdvisorChat';

interface HomeTabProps {
  expenses: Expense[];
  insights: AIInsight[];
  familyMembers: FamilyMember[];
  monthlyBudget: number;
  onOpenQuickAction: (tab: 'scan' | 'voice' | 'text') => void;
  onRefreshInsights: () => void;
  loadingInsights: boolean;
  onViewAllExpenses?: () => void;
  onboardingData?: any;
}

export default function HomeTab({
  expenses,
  insights,
  familyMembers,
  monthlyBudget,
  onOpenQuickAction,
  onRefreshInsights,
  loadingInsights,
  onViewAllExpenses,
  onboardingData
}: HomeTabProps) {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Financial statistics
  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const percentageSpent = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));

  // Daily AI Score calculation (from 40 to 99)
  const aiScore = useMemo(() => {
    let score = 95;
    if (percentageSpent > 90) score -= 30;
    else if (percentageSpent > 70) score -= 15;
    else if (percentageSpent > 40) score -= 5;

    const warningCount = insights.filter(ins => ins.type === 'warning').length;
    score -= warningCount * 4;

    return Math.max(40, Math.min(99, score));
  }, [percentageSpent, insights]);

  // Daily AI advice string
  const aiScoreAdvice = useMemo(() => {
    if (aiScore >= 85) {
      return 'أداء العائلة المالي ممتاز اليوم! المصروفات تحت السيطرة وصندوق الطوارئ في تقدم مستقر. استمروا هكذا! 🌟';
    } else if (aiScore >= 70) {
      return 'الوضع المالي جيد ومستقر. ينصح بيت AI بمراجعة بند المطاعم والطلبات الإضافية لرفع المدخرات. 📈';
    } else {
      // < 70
      return 'تنبيه: معدل الصرف متسارع وقريب من تجاوز الميزانية. يفضل إيقاف المصاريف غير الضرورية فوراً. ⚠️';
    }
  }, [aiScore]);

  // Gamification achievements
  const achievements = [
    { id: 'ac1', title: 'درع الالتزام 🔥', desc: 'توفير مستمر لـ ٧ أيام متتالية دون كسر الميزانية', color: 'from-amber-400 to-orange-500' },
    { id: 'ac2', title: 'بطل الفواتير 🏆', desc: 'سداد جميع فواتير الكهرباء والإنترنت قبل موعد الاستحقاق', color: 'from-blue-400 to-indigo-600' },
    { id: 'ac3', title: 'حكيم البيت 💎', desc: 'أبقيتم المصروفات المتغيرة تحت سقف الـ ٢٠٪ حتى الآن', color: 'from-teal-400 to-emerald-600' }
  ];

  // Filtering the Timeline list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // 1. Intelligent Natural Language Search Query filter with Arabic synonym mapping
      const q = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      
      if (q) {
        // Arabic semantic synonyms and categorizations mapping
        const isCarQuery = q.includes('عربية') || q.includes('سيارة') || q.includes('سياره') || q.includes('العربية') || q.includes('السيارة');
        const isInternetQuery = q.includes('نت') || q.includes('النت') || q.includes('انترنت') || q.includes('إنترنت') || q.includes('we');
        const isElectricityQuery = q.includes('كهرباء') || q.includes('الكهرباء') || q.includes('كهربا');
        const isWaterQuery = q.includes('مياه') || q.includes('المياه') || q.includes('مايه') || q.includes('المايه');
        const isGasQuery = q.includes('غاز') || q.includes('الغاز');
        const isAssociationQuery = q.includes('جمعية') || q.includes('الجمعية') || q.includes('جمعيه') || q.includes('قسط');
        
        // Month synonym mapping to date strings
        const monthMap: Record<string, string> = {
          'يناير': '-01-', 'فبراير': '-02-', 'مارس': '-03-', 'أبريل': '-04-', 'ابريل': '-04-',
          'مايو': '-05-', 'يونيو': '-06-', 'يونيه': '-06-', 'يوليو': '-07-', 'يوليه': '-07-',
          'أغسطس': '-08-', 'اغسطس': '-08-', 'سبتمبر': '-09-', 'أكتوبر': '-10-', 'اكتوبر': '-10-',
          'نوفمبر': '-11-', 'ديسمبر': '-12-'
        };
        
        let matchingMonthKey = '';
        for (const key of Object.keys(monthMap)) {
          if (q.includes(key)) {
            matchingMonthKey = monthMap[key];
            break;
          }
        }

        const baseMatch = 
          exp.title.toLowerCase().includes(q) ||
          (exp.merchant && exp.merchant.toLowerCase().includes(q)) ||
          exp.category.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          exp.recordedBy.toLowerCase().includes(q);

        const synonymMatch =
          (isCarQuery && (exp.category === 'Transportation' || exp.title.includes('عربية') || exp.title.includes('سيارة') || exp.title.includes('مرور') || exp.title.includes('زيت') || exp.title.includes('صيانة') || exp.title.includes('بنزين'))) ||
          (isInternetQuery && (exp.category === 'Bills' && (exp.title.toLowerCase().includes('نت') || exp.title.toLowerCase().includes('we') || exp.title.toLowerCase().includes('شحن') || exp.title.toLowerCase().includes('اتصالات') || exp.title.toLowerCase().includes('فودافون')))) ||
          (isElectricityQuery && (exp.title.includes('كهرباء') || exp.title.includes('كارت') || exp.title.includes('عداد') || exp.title.includes('شحن'))) ||
          (isWaterQuery && (exp.title.includes('مياه') || exp.title.includes('ميه') || exp.title.includes('فاتورة مياه'))) ||
          (isGasQuery && (exp.title.includes('غاز') || exp.title.includes('الغاز') || exp.title.includes('تاون غاز'))) ||
          (isAssociationQuery && (exp.title.includes('جمعية') || exp.title.includes('جمعيه') || exp.title.includes('قسط') || exp.notes?.includes('جمعية'))) ||
          (matchingMonthKey && exp.date.includes(matchingMonthKey));

        matchesSearch = baseMatch || !!synonymMatch;
      }

      if (!matchesSearch) return false;

      // 2. Timeline date filters
      if (timelineFilter === 'all') return true;

      const expDate = new Date(exp.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (timelineFilter === 'today') {
        return expDate.toDateString() === today.toDateString();
      }

      if (timelineFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return expDate.toDateString() === yesterday.toDateString();
      }

      if (timelineFilter === 'week') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return expDate >= oneWeekAgo;
      }

      if (timelineFilter === 'month') {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setDate(today.getDate() - 30);
        return expDate >= oneMonthAgo;
      }

      return true;
    });
  }, [expenses, searchQuery, timelineFilter]);

  return (
    <div className="space-y-6 pb-24 select-none">
      
      {/* Dynamic Home Screen Widgets */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between shadow-xs col-span-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">المنفق اليوم</span>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1 font-mono">
            {formatCurrency(expenses.filter(e => e.date === getLocalDateString()).reduce((a, b) => a + b.amount, 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between shadow-xs col-span-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">المتبقي الآمن</span>
          <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">{formatCurrency(remainingBudget)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between shadow-xs col-span-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">الميزانية الكلية</span>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1 font-mono">{formatCurrency(monthlyBudget)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between shadow-xs col-span-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">الالتزامات قيد الانتظار</span>
          <p className="text-sm font-black text-orange-500 mt-1 font-mono">٣ التزامات</p>
        </div>
      </div>

      {/* 1. Monthly Spending Card (Premium Apple Wallet Look) */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-2 right-12 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <span className="text-blue-100 font-medium text-xs block mb-1">المجموع المنفق هذا الشهر</span>
            <span className="text-3xl font-black tracking-tight block mt-1 font-mono">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-center border border-white/10">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-blue-100">
            <span>{percentageSpent}% من الميزانية العائلية</span>
            <span>الراتب المعتمد: {formatCurrency(monthlyBudget)}</span>
          </div>
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${percentageSpent}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs font-semibold text-blue-100 relative z-10">
          <div>
            <span className="block text-[9px] text-blue-200">السيولة المتبقية</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(remainingBudget)}</span>
          </div>
          <div>
            <span className="block text-[9px] text-blue-200">البلد الحالي</span>
            <span className="text-sm font-bold text-emerald-300">
              {onboardingData?.country || 'مصر'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Daily AI Score (Intelligent Gamification Index) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-colors">
        {/* Dynamic circular dial */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="34" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
            <circle 
              cx="40" 
              cy="40" 
              r="34" 
              className="stroke-blue-600 fill-none transition-all duration-500" 
              strokeWidth="6" 
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - aiScore / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-lg font-black text-slate-800 dark:text-white font-mono">{aiScore}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase -mt-1">درجة AI</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
            <span>التقييم اليومي لصحة الصرف</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          </h3>
          <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
            {aiScoreAdvice}
          </p>
        </div>
      </div>

      {/* 3. Achievements & Gamified Badges */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <span>الأوسمة والإنجازات النشطة للبيت</span>
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {achievements.map((ac) => (
            <div 
              key={ac.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs shrink-0 w-48 flex gap-3 items-start hover:border-blue-200 transition-all"
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ac.color} flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs`}>
                ⭐
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">{ac.title}</h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug">{ac.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Magical Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">سجل مصروفاً بالذكاء الاصطناعي</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => onOpenQuickAction('scan')}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 transition-all group"
            id="btn_scan_receipt"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300">تصوير فاتورة</span>
          </button>

          <button 
            onClick={() => onOpenQuickAction('voice')}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 transition-all group"
            id="btn_voice_input"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300">تسجيل صوتي</span>
          </button>

          <button 
            onClick={() => onOpenQuickAction('text')}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 transition-all group"
            id="btn_text_input"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300">إضافة سريعة</span>
          </button>
        </div>
      </div>

      {/* 5. Financial Calendar Sleek Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl flex justify-between items-center shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-white">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-black">الجدول المالي والالتزامات</span>
          </div>
          {showCalendar ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showCalendar && (
          <div className="animate-slide-down">
            <SmartCalendar onboardingData={onboardingData} monthlySalary={monthlyBudget} />
          </div>
        )}
      </div>

      {/* 6. Financial Goals Sleek Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowGoals(!showGoals)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl flex justify-between items-center shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-white">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-black">أهداف الادخار الذكية</span>
          </div>
          {showGoals ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showGoals && (
          <div className="animate-slide-down">
            <FinancialGoals onboardingData={onboardingData} monthlyBudget={monthlyBudget} totalSpent={totalSpent} />
          </div>
        )}
      </div>

      {/* 7. Smart AI Insights (The Magic Core) */}
      <div className="bg-[#2563EB]/5 border border-blue-100 rounded-[2rem] p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Sparkles className="w-4 h-4 fill-[#2563EB] animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider">نصائح وتحليلات بيت AI</h3>
          </div>
          <button 
            onClick={onRefreshInsights}
            disabled={loadingInsights}
            className="text-[10px] font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 bg-white dark:bg-slate-800 border border-blue-200/50 px-2.5 py-1 rounded-full shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loadingInsights ? 'animate-spin' : ''}`} />
            <span>تحديث التحليل</span>
          </button>
        </div>

        {loadingInsights ? (
          <div className="py-4 text-center text-xs text-blue-500 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-blue-600/70">يقوم بيت AI بتحليل أحدث الحسابات والمصروفات...</p>
          </div>
        ) : insights.length === 0 ? (
          <p className="text-xs text-[#1E40AF] text-center py-2 font-medium">لا توجد تحليلات كافية حالياً، أضف بعض المصاريف أولاً.</p>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => {
              return (
                <div 
                  key={insight.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex gap-3 ${
                    insight.type === 'warning' || insight.type === 'alert'
                      ? 'bg-red-50/40 border-red-100 text-red-900 dark:bg-red-950/25 dark:border-red-900' 
                      : insight.type === 'success' 
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900 dark:bg-emerald-950/25 dark:border-emerald-900' 
                        : 'bg-white dark:bg-slate-800 border-blue-200 text-[#1E40AF] dark:text-blue-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {insight.type === 'warning' || insight.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : insight.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">{insight.title}</p>
                    <p className="text-slate-600 dark:text-slate-300">{insight.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Financial Timeline & Search Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">جدول المعاملات الذكية</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">تتبع المخطط المالي الزمني للأسرة بشكل فوري وتلقائي</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، المحل، الفئة، أو الطريقة..."
            className="w-full p-3 pr-10 text-xs border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all text-right"
          />
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3 top-3.5" />
        </div>

        {/* Timeline Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'أمس' },
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimelineFilter(f.id as any)}
              className={`px-4 py-2 text-[10px] font-bold rounded-full transition-all shrink-0 ${
                timelineFilter === f.id
                  ? 'bg-blue-600 text-white font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline Card List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-xs text-slate-400">
            لا توجد مصروفات تطابق اختيارات البحث الحالية. ✨
          </div>
        ) : (
          <div className="space-y-3.5 relative before:absolute before:right-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {filteredExpenses.map((exp) => {
              const cat = CATEGORY_DETAILS[exp.category];
              const IconComponent = cat?.icon || ArrowLeftRight;
              return (
                <div 
                  key={exp.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-100/70 dark:border-slate-800/80 rounded-[2rem] p-4 flex items-center justify-between hover:border-blue-200 transition-all shadow-xs relative z-10"
                >
                  <div className="flex items-center gap-3">
                    {/* Visual Category Icon wrapper */}
                    <div className={`w-11 h-11 rounded-2xl ${cat?.bgColor || 'bg-slate-50'} ${cat?.color || 'text-slate-600'} flex items-center justify-center shrink-0 shadow-xs`}>
                      <IconComponent className="w-5.5 h-5.5 stroke-[1.8]" />
                    </div>
                    
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{exp.title}</h4>
                      
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold flex-wrap">
                        <span className="text-slate-600 dark:text-slate-300">{cat?.label || exp.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-slate-500">
                          <User className="w-2.5 h-2.5" />
                          <span>{exp.recordedBy}</span>
                        </span>
                        {exp.merchant && exp.merchant !== 'غير محدد' && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">📍 {exp.merchant}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-black">{exp.paymentMethod}</span>
                      </div>

                      {/* Display Smart Tags if present */}
                      {exp.tags && exp.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {exp.tags.map((t, idx) => (
                            <span 
                              key={idx} 
                              className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-md"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Time and Date metadata */}
                      <p className="text-[9px] text-slate-400 font-medium">
                        {new Date(exp.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        {exp.time && ` - ${exp.time}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-black text-rose-500 text-xs font-mono shrink-0 pl-1">
                    - {formatCurrency(exp.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pulsing Floating AI Assistant Chat Bubble */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-20 left-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all group"
        id="btn_chat_floating"
      >
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-25 group-hover:hidden" />
        <MessageCircle className="w-7 h-7 animate-pulse" />
      </button>

      {/* AI Assistant Chat Panel */}
      <AIAdvisorChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        expenses={expenses}
        familyMembers={familyMembers}
        monthlyBudget={monthlyBudget}
      />

    </div>
  );
}
