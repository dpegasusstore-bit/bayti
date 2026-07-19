/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AdminUser, Subscription } from '../seedData';
import { 
  TrendingUp, TrendingDown, Brain, Activity, BarChart3, PieChart, 
  Calendar, Users, DollarSign, Sparkles, AlertCircle, RefreshCw,
  Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';

interface AnalyticsViewProps {
  users: AdminUser[];
  subscriptions: Subscription[];
  onAddAuditLog: (action: string, severity: 'Info' | 'Warning' | 'Critical') => void;
}

export default function AnalyticsView({ users, subscriptions, onAddAuditLog }: AnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);

  // Total metrics
  const totalUsersCount = users.length + 14810;
  const premiumUsersCount = subscriptions.filter(s => s.status === 'Active').length + 1430;
  const conversionRate = ((premiumUsersCount / totalUsersCount) * 100).toFixed(1);
  const activeTodayCount = 2415;

  // Platform AI requests breakdown
  const textAIUsage = 18450;
  const voiceAIUsage = 17070;
  const receiptOCRUsage = 28140;
  const totalAIUsage = textAIUsage + voiceAIUsage + receiptOCRUsage + 42100;

  // Category distributions across all platform families
  const categoryStats = [
    { name: 'المنزل والبقالة', value: 45200, percentage: 32, color: 'bg-blue-500', stroke: '#3b82f6' },
    { name: 'الفواتير والخدمات', value: 29600, percentage: 21, color: 'bg-purple-500', stroke: '#a855f7' },
    { name: 'المطاعم والكافيهات', value: 22500, percentage: 16, color: 'bg-amber-500', stroke: '#f59e0b' },
    { name: 'التسوق والملابس', value: 16900, percentage: 12, color: 'bg-pink-500', stroke: '#ec4899' },
    { name: 'المواصلات والبنزين', value: 14100, percentage: 10, color: 'bg-cyan-500', stroke: '#06b6d4' },
    { name: 'أخرى (صحة/تعليم)', value: 12600, percentage: 9, color: 'bg-emerald-500', stroke: '#10b981' },
  ];

  const handleRefresh = () => {
    onAddAuditLog('تحديث لوحة التحليلات والإحصائيات المتقدمة', 'Info');
  };

  return (
    <div className="space-y-8 text-right font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white">التحليلات المالية المتقدمة</h2>
          <p className="text-xs text-slate-400 mt-1">تقارير الذكاء الاصطناعي، سلوكيات الإنفاق العامة، توزيع الاشتراكات وأداء السيرفر</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex gap-1 text-xs">
            {(['7d', '30d', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  timeframe === t 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === '7d' ? 'آخر ٧ أيام' : t === '30d' ? 'آخر ٣٠ يوم' : 'الكل'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-xl transition-all hover:scale-105"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold mb-1">العمليات الحية المكتملة</div>
          <div className="text-2xl font-black text-white font-mono">1,824,400</div>
          <p className="text-[10px] text-slate-500 mt-2">معدل نجاح طلبات الـ API: <span className="text-emerald-400 font-bold">99.98%</span></p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              +28.5% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold mb-1">إجمالي طلبات Gemini AI</div>
          <div className="text-2xl font-black text-white font-mono">{totalAIUsage.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-2">متوسط وقت الاستجابة: <span className="text-indigo-400 font-bold">1.2 ثانية</span></p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              +1.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold mb-1">معدل تحويل العملاء (CR)</div>
          <div className="text-2xl font-black text-white font-mono">{conversionRate}%</div>
          <p className="text-[10px] text-slate-500 mt-2">أعلى معدل تحويل: <span className="text-amber-400 font-bold">القاهرة والإسكندرية</span></p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              -0.15% <ArrowDownRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold mb-1">معدل الحفاظ على الخوادم (Ping)</div>
          <div className="text-2xl font-black text-white font-mono">15 ms</div>
          <p className="text-[10px] text-slate-500 mt-2">خوادم الإنتاج: <span className="text-emerald-400 font-bold">نشطة 100%</span></p>
        </div>

      </div>

      {/* Main Charts & Categories Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: AI Feature Usage Breakdown */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-7">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Brain className="w-4.5 h-4.5 text-indigo-400" />
            <span>تحليلات استخدام ميزات الذكاء الاصطناعي</span>
          </h3>
          <p className="text-[10px] text-slate-400 mb-6">مراقبة تفصيلية لاستخدام العائلات لخاصية قراءة الفواتير وتلقين الأوامر الصوتية والشات المالي المالي</p>

          <div className="space-y-5">
            {/* Feature 1 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white">قراءة فواتير المشتريات بالصور (OCR AI)</span>
                <span className="text-slate-400 font-mono">28,140 حركة (44%)</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                <div className="bg-gradient-to-l from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: '44%' }} />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white">التلقين وإضافة المصاريف بالصوت (Voice AI)</span>
                <span className="text-slate-400 font-mono">17,070 حركة (27%)</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                <div className="bg-gradient-to-l from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000" style={{ width: '27%' }} />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white">المساعد المالي وشات "ماذا لو" (Financial Chat Brain)</span>
                <span className="text-slate-400 font-mono">18,450 حركة (29%)</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                <div className="bg-gradient-to-l from-purple-500 to-purple-600 h-full rounded-full transition-all duration-1000" style={{ width: '29%' }} />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/60 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 block mb-1">دقة الـ OCR</span>
              <span className="text-xs font-black text-indigo-400">97.8%</span>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 block mb-1">معدل فهم الصوت</span>
              <span className="text-xs font-black text-emerald-400">96.5%</span>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 block mb-1">نسبة التفاعل بالشات</span>
              <span className="text-xs font-black text-purple-400">84.2%</span>
            </div>
          </div>
        </div>

        {/* Right: Spent Categories Breakdown */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-emerald-400" />
              <span>أبواب ومجالات الإنفاق العامة للبيوت</span>
            </h3>
            <p className="text-[10px] text-slate-400 mb-6">متوسط مجالات الصرف المالي لجميع عائلات المنصة هذا الشهر</p>

            <div className="space-y-3">
              {categoryStats.map((cat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/20 border border-slate-800/40 hover:border-slate-700/60 transition-all cursor-pointer"
                  onMouseEnter={() => setHoverCategory(cat.name)}
                  onMouseLeave={() => setHoverCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span className="font-bold text-slate-300">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">{cat.value.toLocaleString()} ج.م</span>
                    <span className="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl text-[11px] text-slate-400 leading-relaxed mt-4">
            <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>ملاحظة المستشار المالي للمنصة:</span>
            </span>
            هناك زيادة طفيفة (3%) في مصاريف "الفواتير والخدمات" بسبب زيادة درجات الحرارة والاعتماد الأكبر على أجهزة التكييف بالمنطقة.
          </div>
        </div>

      </div>

      {/* Subscription Breakdown & Server Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subscription Analysis */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-indigo-400" />
            <span>مبيعات باقات Premium شهرياً</span>
          </h3>
          
          <div className="h-48 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
              <path
                d="M 0,130 L 100,110 L 200,95 L 300,75 L 400,60 L 500,40"
                fill="none"
                stroke="#818cf8"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Overlay points */}
              {[130, 110, 95, 75, 60, 40].map((y, idx) => (
                <circle 
                  key={idx}
                  cx={idx * 100} 
                  cy={y} 
                  r="5" 
                  fill="#6366f1" 
                  stroke="#0f172a" 
                  strokeWidth="2" 
                />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-3 px-1">
            <span>فبراير</span>
            <span>مارس</span>
            <span>أبريل</span>
            <span>مايو</span>
            <span>يونيو</span>
            <span>يوليو</span>
          </div>
        </div>

        {/* Server Performance */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-400" />
            <span>حالة السيرفر والذاكرة العشوائية (CPU/RAM)</span>
          </h3>
          
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-semibold">استهلاك الذاكرة (RAM)</span>
                <span className="text-white font-mono font-bold">2.4 GB / 4.0 GB (60%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/50">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-semibold">استهلاك المعالج (CPU Core)</span>
                <span className="text-white font-mono font-bold">14%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/50">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '14%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-semibold">استجابة قواعد البيانات</span>
                <span className="text-white font-mono font-bold">3.8 ms</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/50">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
