/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from 'recharts';
import { Expense, FamilyMember } from '../types';
import { CATEGORY_DETAILS, formatCurrency, getLocalDateString } from '../utils';
import { PieChart as PieIcon, BarChart3, TrendingUp, DollarSign, Wallet, Award } from 'lucide-react';

interface ReportsTabProps {
  expenses: Expense[];
  familyMembers: FamilyMember[];
}

export default function ReportsTab({ expenses, familyMembers }: ReportsTabProps) {
  
  // 1. Category Data preparation
  const categoryMap: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });

  const pieData = Object.entries(categoryMap).map(([cat, val]) => {
    const details = CATEGORY_DETAILS[cat as any];
    return {
      name: details?.label || cat,
      value: val,
      color: details?.bgColor || '#f1f5f9',
      textColor: details?.color ? details.color.replace('text-', '') : '#111827',
      rawColor: cat === 'Home' ? '#2563EB' :
                cat === 'Shopping' ? '#A855F7' :
                cat === 'Restaurants' ? '#EA580C' :
                cat === 'Transportation' ? '#10B981' :
                cat === 'Bills' ? '#F59E0B' :
                cat === 'Health' ? '#F43F5E' :
                cat === 'Education' ? '#6366F1' :
                cat === 'Travel' ? '#06B6D4' :
                cat === 'Entertainment' ? '#EC4899' : '#475569'
    };
  }).sort((a, b) => b.value - a.value);

  // 2. Family Member Data preparation
  const memberMap: Record<string, number> = {};
  familyMembers.forEach(m => {
    memberMap[m.name] = 0; // initialize
  });
  expenses.forEach(exp => {
    if (memberMap[exp.recordedBy] !== undefined) {
      memberMap[exp.recordedBy] += exp.amount;
    }
  });

  const barData = Object.entries(memberMap).map(([name, val]) => {
    const member = familyMembers.find(m => m.name === name);
    return {
      name,
      amount: val,
      budget: member?.monthlyBudget || 0,
      role: member?.role || 'عضو'
    };
  });

  // 3. Time Trend Data preparation (Last 7 days of expenses)
  const last7DaysMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    last7DaysMap[dateStr] = 0;
  }

  expenses.forEach(exp => {
    if (last7DaysMap[exp.date] !== undefined) {
      last7DaysMap[exp.date] += exp.amount;
    }
  });

  const areaData = Object.entries(last7DaysMap).map(([date, val]) => {
    const parsedDate = new Date(date);
    const dayLabel = parsedDate.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' });
    return {
      day: dayLabel,
      amount: val
    };
  });

  // Calculate highest spending member
  let highestMemberName = 'لا يوجد';
  let highestMemberAmt = 0;
  Object.entries(memberMap).forEach(([name, val]) => {
    if (val > highestMemberAmt) {
      highestMemberAmt = val;
      highestMemberName = name;
    }
  });

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-bold border border-slate-800 shadow-lg font-sans">
          <p className="mb-1">{payload[0].name}</p>
          <p className="text-blue-300">{formatCurrency(payload[0].value || payload[0].value === 0 ? payload[0].value : payload[0].payload.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">التقارير والمؤشرات المالية</h2>
        <p className="text-xs text-slate-500 mt-1">مخططات بيانية دقيقة تلخص سلوك إنفاق العائلة</p>
      </div>

      {/* Mini Stats Grid (Premium Widget style) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">أعلى فئة صرفاً</span>
            <span className="text-sm font-bold text-slate-800">
              {pieData[0] ? pieData[0].name : 'لا يوجد'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-semibold bg-slate-50 px-2 py-1 rounded-md self-start border border-slate-100">
            قيمة: {pieData[0] ? formatCurrency(pieData[0].value) : '٠ ج.م'}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">الأكثر تسجيلاً للمصاريف</span>
            <span className="text-sm font-bold text-slate-800">
              {highestMemberName}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-semibold bg-slate-50 px-2 py-1 rounded-md self-start border border-slate-100">
            مجموع: {formatCurrency(highestMemberAmt)}
          </p>
        </div>
      </div>

      {/* 1. Category Distribution Pie (Pie Chart) */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 h-auto">
        <div className="flex items-center gap-2 text-slate-800">
          <PieIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold">توزيع المصاريف حسب الفئة</h3>
        </div>

        {pieData.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400">أدخل مصروفات لعرض التوزيع البياني للفئات.</p>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Centered Donut with Total Expenses inside */}
            <div className="relative w-full max-w-[280px] h-56 flex items-center justify-center shrink-0">
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none z-10 select-none">
                <span className="text-[10px] font-black text-slate-400 tracking-wider">إجمالي المصاريف</span>
                <span className="text-lg font-black text-slate-900 mt-1 font-mono">
                  {formatCurrency(pieData.reduce((sum, item) => sum + item.value, 0))}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rawColor} style={{ outline: 'none' }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Premium Legend Layout: Vertical on mobile, responsive multi-column grid on larger screens */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
              {pieData.map((item, idx) => {
                const totalExpenses = pieData.reduce((sum, i) => sum + i.value, 0);
                const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) + '%' : '0%';
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-slate-50/70 hover:bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                        style={{ backgroundColor: item.rawColor }} 
                      />
                      <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left shrink-0">
                      <span className="text-xs font-black text-slate-950 font-mono">{formatCurrency(item.value)}</span>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-mono">
                        {pct}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Last 7 Days Trend (Area Chart) */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold">مؤشر الإنفاق في آخر ٧ أيام</h3>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b' }} 
              />
              <YAxis 
                width={40}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b' }} 
                tickFormatter={(val) => {
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return `${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                name="المنفق اليومي"
                stroke="#2563EB" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Family Comparison (Bar Chart) */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold">مقارنة الإنفاق مقابل ميزانية الفرد</h3>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b' }} 
              />
              <YAxis 
                width={40}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b' }} 
                tickFormatter={(val) => {
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return `${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                name="المجموع المنفق" 
                fill="#2563EB" 
                radius={[4, 4, 0, 0]} 
                barSize={18}
              />
              <Bar 
                dataKey="budget" 
                name="الميزانية المقررة" 
                fill="#e2e8f0" 
                radius={[4, 4, 0, 0]} 
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
