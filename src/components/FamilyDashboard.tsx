/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CreditCard, 
  PieChart, 
  Activity, 
  CheckCircle,
  HelpCircle,
  ArrowRightLeft,
  Users
} from 'lucide-react';
import { Expense, FamilyMember } from '../types';
import { CATEGORY_DETAILS, formatCurrency } from '../utils';

interface FamilyDashboardProps {
  expenses: Expense[];
  familyMembers: FamilyMember[];
  monthlyBudget: number;
  onboardingData?: any;
}

export default function FamilyDashboard({
  expenses,
  familyMembers,
  monthlyBudget,
  onboardingData
}: FamilyDashboardProps) {
  // Financial arithmetic
  const salary = onboardingData?.monthlySalary || monthlyBudget;
  const otherIncome = onboardingData?.otherIncome || 0;
  const totalIncome = salary + otherIncome;

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = Math.max(0, totalIncome - totalSpent);

  // Group fixed vs variable
  // Fixed items: Bills, installments, rent, etc.
  // Variable: Shopping, Restaurants, Transportation, Entertainment, Health, Education, Travel, Home (Variable groceries)
  let fixedSpent = 0;
  let variableSpent = 0;

  expenses.forEach(exp => {
    if (exp.category === 'Bills' || exp.category === 'Work') {
      fixedSpent += exp.amount;
    } else {
      variableSpent += exp.amount;
    }
  });

  // Calculate upcoming commitments based on onboarding
  const hasRent = onboardingData?.homeStatus === 'rent';
  const hasCar = onboardingData?.ownsCar;
  const hasInstallments = onboardingData?.paysInstallments;
  const hasGroup = onboardingData?.participatesInGroup;

  const upcomingBills = [
    { title: 'فاتورة الإنترنت المنزلي WE', amount: 450, due: '١٨ يوليو' },
    { title: 'فاتورة الغاز الطبيعي للمنزل', amount: 180, due: '٢٣ يوليو' }
  ];

  if (hasRent) upcomingBills.push({ title: 'قسط إيجار الشقة الشهري', amount: 3500, due: '١ أغسطس' });
  if (hasCar && hasInstallments) upcomingBills.push({ title: 'قسط السيارة البنكي', amount: 2350, due: '٢٨ يوليو' });
  if (hasGroup) upcomingBills.push({ title: 'دفع قسط الجمعية الدورية', amount: 1000, due: '٥ يوليو' });

  // Category summary for Top Spending chart
  const categorySummary: Record<string, number> = {};
  expenses.forEach(exp => {
    categorySummary[exp.category] = (categorySummary[exp.category] || 0) + exp.amount;
  });

  const sortedCategories = Object.entries(categorySummary)
    .map(([cat, amount]) => ({
      cat,
      amount,
      details: CATEGORY_DETAILS[cat as any] || { label: cat, color: 'text-slate-600', bgColor: 'bg-slate-50' }
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard Bento Grid - Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income Block */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-3xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">الدخل الكلي للبيت</span>
            <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{formatCurrency(totalIncome)}</p>
          <div className="text-[9px] text-slate-400 mt-1 flex flex-col gap-0.5">
            <span>الراتب: {formatCurrency(salary)}</span>
            {otherIncome > 0 && <span>مصادر أخرى: {formatCurrency(otherIncome)}</span>}
          </div>
        </div>

        {/* Remaining Block */}
        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 p-5 rounded-3xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">السيولة المتبقية</span>
            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{formatCurrency(remainingBudget)}</p>
          <div className="text-[9px] text-slate-400 mt-1">
            <span>المعدل المتبقي الآمن اليومي</span>
          </div>
        </div>
      </div>

      {/* 2. Fixed vs Variable Spending Meter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">تحليل طبيعة المصروفات للأسرة</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">مقارنة التكاليف الثابتة (الفواتير والأقساط) بالتكاليف المتغيرة</p>
        </div>

        <div className="space-y-2">
          {/* Progress gauge */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${totalSpent > 0 ? (fixedSpent / totalSpent) * 100 : 40}%` }}
              className="bg-blue-600 h-full transition-all duration-300"
              title="مصروفات ثابتة"
            ></div>
            <div 
              style={{ width: `${totalSpent > 0 ? (variableSpent / totalSpent) * 100 : 60}%` }}
              className="bg-orange-500 h-full transition-all duration-300"
              title="مصروفات متغيرة"
            ></div>
          </div>

          {/* Legend */}
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
              <span>مصاريف ثابتة: <span className="font-mono text-slate-800 dark:text-slate-300">{formatCurrency(fixedSpent)}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
              <span>مصاريف متغيرة: <span className="font-mono text-slate-800 dark:text-slate-300">{formatCurrency(variableSpent)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dynamic commitment tracker - Upcoming payments */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-xs space-y-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">الالتزامات والمدفوعات القادمة</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">مخطط الأقساط والالتزامات المستحقة في الأيام القادمة</p>
        </div>

        <div className="space-y-2.5">
          {upcomingBills.map((bill, index) => (
            <div 
              key={index} 
              className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between border border-slate-100/50 dark:border-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{bill.title}</h4>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">مستحق بحلول {bill.due}</span>
                </div>
              </div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(bill.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top Spending Categories progress lines */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">الفئات الأكثر استهلاكاً</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">تقسيم الميزانية المستهلكة حسب الفئة لضبط الصرف</p>
        </div>

        {sortedCategories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">سجل مصروفاً لتظهر لك تحليلات الاستهلاك التفصيلية هنا.</p>
        ) : (
          <div className="space-y-3.5">
            {sortedCategories.slice(0, 4).map(({ cat, amount, details }) => {
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{details.label}</span>
                    <span className="text-slate-400 font-normal font-mono">{formatCurrency(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-blue-600`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Month-over-Month Household Comparison */}
      <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">مقارنة الصرف الشهري للعائلة</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            معدل استهلاكك هذا الشهر يسجل <span className="text-emerald-500 font-bold">انخفاضاً بـ ١٢٪</span> عن ميزانية يونيو الماضي. أداء مالي واعي جداً!
          </p>
        </div>
        <div className="shrink-0 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-12 h-12 rounded-full flex items-center justify-center">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
}
