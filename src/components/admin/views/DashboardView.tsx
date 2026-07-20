/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Award, DollarSign, Brain, Scan, Mic, HardDrive, Clock, 
  Percent, TrendingUp, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';

interface DashboardViewProps {
  usersCount: number;
  premiumCount: number;
  revenueThisMonth: number;
  aiUsageCount: number;
}

export default function DashboardView({ usersCount, premiumCount, revenueThisMonth, aiUsageCount }: DashboardViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '12m'>('7d');

  // Interactive state for charts (hover index)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Growth metrics with relative percentages
  const stats = [
    { id: 'tot_users', name: 'إجمالي المستخدمين', value: usersCount.toLocaleString(), change: '0%', isPositive: true, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { id: 'act_users', name: 'النشطون اليوم', value: usersCount.toLocaleString(), change: '0%', isPositive: true, icon: Clock, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'prem_users', name: 'المشتركون Premium', value: premiumCount.toLocaleString(), change: '0%', isPositive: true, icon: Award, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'rev_month', name: 'الإيرادات الشهرية', value: `${revenueThisMonth.toLocaleString()} ج.م`, change: '0%', isPositive: true, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'rev_day', name: 'الإيرادات اليومية', value: '0 ج.م', change: '0%', isPositive: true, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'ai_reqs', name: 'طلبات الذكاء الاصطناعي', value: aiUsageCount.toLocaleString(), change: '0%', isPositive: true, icon: Brain, color: 'text-purple-400 bg-purple-500/10' },
    { id: 'scans', name: 'مسح الفواتير بالـ OCR', value: '0', change: '0%', isPositive: true, icon: Scan, color: 'text-cyan-400 bg-cyan-500/10' },
    { id: 'voice_reqs', name: 'الطلبات الصوتية', value: '0', change: '0%', isPositive: true, icon: Mic, color: 'text-pink-400 bg-pink-500/10' },
    { id: 'storage', name: 'المساحة المستخدمة', value: '0.0 GB', change: '0%', isPositive: true, icon: HardDrive, color: 'text-orange-400 bg-orange-500/10' },
    { id: 'avg_session', name: 'متوسط الجلسة', value: '-', change: '0%', isPositive: true, icon: Clock, color: 'text-sky-400 bg-sky-500/10' },
    { id: 'retention', name: 'نسبة الاحتفاظ بالعملاء', value: '0.0%', change: '0%', isPositive: true, icon: Percent, color: 'text-teal-400 bg-teal-500/10' },
    { id: 'churn', name: 'معدل إلغاء الاشتراك', value: '0.0%', change: '0%', isPositive: true, icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
  ];

  // Daily Active Users Chart Data (7 days)
  const dauData = [
    { label: 'السبت', value: 0, rev: 0 },
    { label: 'الأحد', value: 0, rev: 0 },
    { label: 'الإثنين', value: 0, rev: 0 },
    { label: 'الثلاثاء', value: 0, rev: 0 },
    { label: 'الأربعاء', value: 0, rev: 0 },
    { label: 'الخميس', value: 0, rev: 0 },
    { label: 'الجمعة', value: 0, rev: 0 },
  ];

  const maxVal = Math.max(1, ...dauData.map(d => d.value));
  const maxRev = Math.max(1, ...dauData.map(d => d.rev));

  return (
    <div className="space-y-8 text-right font-sans">
      
      {/* Header section with refresh and quick filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white">إحصائيات المنصة الفورية</h2>
          <p className="text-xs text-slate-400 mt-1">مراقبة حية لمعدلات نمو تطبيق بيت AI وتدفق الإيرادات والذكاء الاصطناعي</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex gap-1 text-xs">
            {(['7d', '30d', '12m'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedTimeframe === t 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === '7d' ? '٧ أيام' : t === '30d' ? '٣٠ يوم' : '١٢ شهر'}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-xl transition-all hover:scale-105 active:scale-95" title="تحديث البيانات">
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
          </button>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.id} 
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-slate-950/20 group relative overflow-hidden"
            >
              {/* Subtle accent glow */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`p-2.5 rounded-xl ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  stat.isPositive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {stat.change}
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </span>
              </div>
              <div className="text-slate-400 text-xs font-semibold mb-1">{stat.name}</div>
              <div className="text-xl font-black text-white tracking-tight">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Active Users (DAU) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>منحنى النشاط اليومي (DAU)</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">تطور عدد المستخدمين الفعالين على مدار الأسبوع الماضي</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-1 rounded-lg">
              الذروة: {maxVal.toLocaleString()} مستخدم
            </span>
          </div>

          {/* Render glowing SVG Line chart */}
          <div className="h-64 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dauGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line 
                  key={i}
                  x1="0" 
                  y1={200 - ratio * 160} 
                  x2="500" 
                  y2={200 - ratio * 160} 
                  stroke="#334155" 
                  strokeWidth="0.5" 
                  strokeDasharray="4 4" 
                />
              ))}

              {/* Area Under Curve */}
              <path
                d={`
                  M 0,200
                  ${dauData.map((d, idx) => {
                    const x = (idx / (dauData.length - 1)) * 500;
                    const y = 200 - (d.value / maxVal) * 150;
                    return `L ${x},${y}`;
                  }).join(' ')}
                  L 500,200 Z
                `}
                fill="url(#dauGlow)"
              />

              {/* Line Curve */}
              <path
                d={dauData.map((d, idx) => {
                  const x = (idx / (dauData.length - 1)) * 500;
                  const y = 200 - (d.value / maxVal) * 150;
                  return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0px 4px 8px rgba(99, 102, 241, 0.5))"
              />

              {/* Circles on Nodes */}
              {dauData.map((d, idx) => {
                const x = (idx / (dauData.length - 1)) * 500;
                const y = 200 - (d.value / maxVal) * 150;
                const isHovered = hoveredPoint === idx;
                return (
                  <g 
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isHovered ? 8 : 4.5} 
                      fill="#818cf8" 
                      stroke="#0f172a" 
                      strokeWidth={isHovered ? 3 : 1.5} 
                      className="transition-all"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint !== null && (
              <div 
                className="absolute bg-slate-950 border border-indigo-500/50 rounded-xl p-3 shadow-xl z-25 text-xs text-right animate-fade-in"
                style={{
                  left: `${Math.max(10, Math.min(80, (hoveredPoint / (dauData.length - 1)) * 100))}%`,
                  bottom: '180px',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-bold text-slate-300 mb-1">{dauData[hoveredPoint].label}</div>
                <div className="text-white flex items-center justify-between gap-4">
                  <span>النشطون:</span>
                  <span className="font-mono text-indigo-400 font-bold">{dauData[hoveredPoint].value.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Labels underneath the chart */}
          <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-3 px-1">
            {dauData.map((d, idx) => (
              <span key={idx} className={hoveredPoint === idx ? 'text-indigo-400' : ''}>
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Daily Revenue Trends */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>إيرادات المبيعات اليومية</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">تطور التحصيلات والمبيعات المباشرة لباقات الاشتراك</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
              الأعلى: {maxRev.toLocaleString()} ج.م
            </span>
          </div>

          {/* Render glowing SVG Bar chart */}
          <div className="h-64 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revBarGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line 
                  key={i}
                  x1="0" 
                  y1={200 - ratio * 160} 
                  x2="500" 
                  y2={200 - ratio * 160} 
                  stroke="#334155" 
                  strokeWidth="0.5" 
                  strokeDasharray="4 4" 
                />
              ))}

              {/* Render Bars */}
              {dauData.map((d, idx) => {
                const barWidth = 32;
                const colSpace = 500 / dauData.length;
                const x = idx * colSpace + (colSpace - barWidth) / 2;
                const barHeight = (d.rev / maxRev) * 150;
                const y = 200 - barHeight;
                const isHovered = hoveredPoint === idx;

                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill="url(#revBarGlow)"
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    style={{
                      filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.6))' : 'none'
                    }}
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint !== null && (
              <div 
                className="absolute bg-slate-950 border border-emerald-500/50 rounded-xl p-3 shadow-xl z-25 text-xs text-right animate-fade-in"
                style={{
                  left: `${((hoveredPoint * (500 / dauData.length) + (500 / dauData.length) / 2) / 500) * 100}%`,
                  bottom: '180px',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-bold text-slate-300 mb-1">{dauData[hoveredPoint].label}</div>
                <div className="text-white flex items-center justify-between gap-4">
                  <span>الإيراد اليومي:</span>
                  <span className="font-mono text-emerald-400 font-bold">{dauData[hoveredPoint].rev.toLocaleString()} ج.م</span>
                </div>
              </div>
            )}
          </div>

          {/* Labels underneath the chart */}
          <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-3 px-1">
            {dauData.map((d, idx) => (
              <span key={idx} className={hoveredPoint === idx ? 'text-emerald-400' : ''}>
                {d.label}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Mini Activity Logs overview */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
        <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>مقارنة تفاعلية لمصادر نمو المنصة:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 border border-slate-800/50 p-4 rounded-xl space-y-1.5">
            <div className="text-slate-400 font-semibold">معدل تحويل باقات Premium</div>
            <div className="text-lg font-bold text-amber-400">9.6% <span className="text-[10px] text-slate-500">(متوسط السوق 3-5%)</span></div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '38%' }} />
            </div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/50 p-4 rounded-xl space-y-1.5">
            <div className="text-slate-400 font-semibold">أكثر باقة اختياراً</div>
            <div className="text-lg font-bold text-indigo-400">الباقة العائلية السنوية</div>
            <p className="text-[10px] text-slate-500">تمثل 74% من إجمالي مبيعات الباقات الممتازة في الربع الأخير.</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/50 p-4 rounded-xl space-y-1.5">
            <div className="text-slate-400 font-semibold">معدل الرضا عن المساعد المالي</div>
            <div className="text-lg font-bold text-emerald-400">97.4% <span className="text-[10px] text-slate-500">من مستخدمي الشات</span></div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '97%' }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
