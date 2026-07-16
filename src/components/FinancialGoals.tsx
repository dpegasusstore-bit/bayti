/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Sparkles, 
  Target, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  Activity,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '../utils';

export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlySavingRate: number; // monthly saving rate
}

interface FinancialGoalsProps {
  onboardingData?: any;
  monthlyBudget: number;
  totalSpent: number;
}

export default function FinancialGoals({ onboardingData, monthlyBudget, totalSpent }: FinancialGoalsProps) {
  const [goals, setGoals] = useState<SavingGoal[]>([
    { id: 'g1', title: 'صندوق الطوارئ العائلي 🛡️', targetAmount: 50000, currentAmount: 8500, monthlySavingRate: 2000 },
    { id: 'g2', title: 'عمرة المولد النبوي الشريف 🕋', targetAmount: 40000, currentAmount: 15000, monthlySavingRate: 1500 },
    { id: 'g3', title: 'مصاريف تجديد ترخيص السيارة 🚗', targetAmount: 12000, currentAmount: 4000, monthlySavingRate: 1000 }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newMonthly, setNewMonthly] = useState('');

  // AI Probability indicator calculation
  // Remaining monthly cash flow
  const salary = onboardingData?.monthlySalary || monthlyBudget;
  const otherIncome = onboardingData?.otherIncome || 0;
  const netIncome = salary + otherIncome - totalSpent;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget) return;

    const newGoal: SavingGoal = {
      id: 'g_' + Math.random().toString(36).substr(2, 9),
      title: newTitle,
      targetAmount: Number(newTarget),
      currentAmount: Number(newCurrent) || 0,
      monthlySavingRate: Number(newMonthly) || 1000
    };

    setGoals([...goals, newGoal]);
    setNewTitle('');
    setNewTarget('');
    setNewCurrent('');
    setNewMonthly('');
    setShowAddForm(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('هل ترغب في حذف هذا الهدف؟')) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-black">أهداف الادخار الذكية</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
        >
          {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span>هدف جديد</span>
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <form onSubmit={handleAddGoal} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-3.5 animate-slide-down">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">أضف هدفاً ادخارياً جديداً</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم الهدف</label>
              <input 
                type="text" 
                required 
                placeholder="مثال: شراء سيارة، السفر، عمرة..."
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-right bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">المبلغ المطلوب</label>
              <input 
                type="number" 
                required 
                placeholder="مثال: 50000"
                value={newTarget} 
                onChange={e => setNewTarget(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-left bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">المبلغ المدخر حالياً</label>
              <input 
                type="number" 
                placeholder="مثال: 5000"
                value={newCurrent} 
                onChange={e => setNewCurrent(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-left bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold mb-1">الادخار الشهري المخطط</label>
              <input 
                type="number" 
                placeholder="مثال: 2000"
                value={newMonthly} 
                onChange={e => setNewMonthly(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-left bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            إضافة الهدف الادخاري
          </button>
        </form>
      )}

      {/* Goal list */}
      <div className="space-y-4">
        {goals.map(g => {
          const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const remainingAmount = g.targetAmount - g.currentAmount;
          
          // Calculate expected completion date in months
          const monthsLeft = g.monthlySavingRate > 0 ? Math.ceil(remainingAmount / g.monthlySavingRate) : 12;
          
          // AI calculations for success probability based on user's real cash flow
          // If monthly saving rate of this goal is <= remaining cash flow, probability is high
          // If user has multiple goals, we aggregate or check individual affordability
          let successProbability = 85; // Default percentage
          if (g.monthlySavingRate > netIncome) {
            successProbability = Math.max(25, Math.round((netIncome / g.monthlySavingRate) * 85));
          } else if (g.monthlySavingRate > 0) {
            successProbability = Math.min(99, 85 + Math.round((netIncome - g.monthlySavingRate) / 100));
          }

          let probColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
          let probText = 'عالية جداً';
          if (successProbability < 50) {
            probColor = 'text-red-500 bg-red-50 dark:bg-red-950/20';
            probText = 'تحتاج زيادة ادخار';
          } else if (successProbability < 75) {
            probColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
            probText = 'متوسطة وممكنة';
          }

          return (
            <div key={g.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 relative group">
              {/* Delete */}
              <button 
                onClick={() => handleDeleteGoal(g.id)}
                className="absolute top-4 left-4 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex justify-between items-start pl-6">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{g.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">الهدف المالي: {formatCurrency(g.targetAmount)}</p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-blue-600 font-mono">{formatCurrency(g.currentAmount)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">مدخر للآن ({pct}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>

              {/* AI calculations row */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-50 dark:border-slate-800/60 pt-3 text-[10px] font-bold text-slate-500">
                <div className="text-center">
                  <span className="block text-[9px] text-slate-400 font-medium mb-0.5">ادخار شهري مطلوب</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(g.monthlySavingRate)}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] text-slate-400 font-medium mb-0.5">المدة المتوقعة</span>
                  <span className="text-slate-800 dark:text-slate-200">{monthsLeft} أشهر</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] text-slate-400 font-medium mb-0.5">احتمالية النجاح AI</span>
                  <span className={`px-1.5 py-0.5 rounded-md inline-block font-black ${probColor}`}>{successProbability}% ({probText})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
