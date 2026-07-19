/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  TrendingUp, 
  Percent, 
  User, 
  Briefcase, 
  Coins, 
  Trash2,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { FamilyMember, Expense } from '../types';
import { formatCurrency, CATEGORY_DETAILS } from '../utils';
import FamilyDashboard from './FamilyDashboard';

interface FamilyTabProps {
  familyMembers: FamilyMember[];
  expenses: Expense[];
  onAddMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  onboardingData?: any;
}

export default function FamilyTab({
  familyMembers,
  expenses,
  onAddMember,
  onDeleteMember,
  onboardingData
}: FamilyTabProps) {
  const [viewMode, setViewMode] = useState<'members' | 'dashboard'>('members');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('الأب');
  const [newBudget, setNewBudget] = useState('');
  const [newAvatar, setNewAvatar] = useState('👨🏻‍💼');
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  const avatars = ['👨🏻‍💼', '👩🏻‍⚕️', '👨🏻‍💻', '👧🏻', '👨🏻‍🔧', '👩🏻‍🏫', '👶🏻', '👵🏻', '👴🏻'];

  // Calculate real spending from expenses list per family member
  const getMemberSpent = (memberName: string) => {
    return expenses
      .filter((exp) => exp.recordedBy === memberName)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBudget) return;

    const member: FamilyMember = {
      id: 'member_' + Math.random().toString(36).substr(2, 9),
      name: newName,
      role: newRole,
      monthlyBudget: Number(newBudget),
      spentThisMonth: 0,
      avatar: newAvatar
    };

    onAddMember(member);
    setNewName('');
    setNewBudget('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5 pb-24 select-none">
      {/* Welcome & Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">إدارة ميزانية العائلة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تابع حدود إنفاق ومصروفات كل فرد من أفراد الأسرة</p>
        </div>
        {viewMode === 'members' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm shadow-blue-100 dark:shadow-none transition-colors"
            id="btn_toggle_add_member"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>إضافة فرد</span>
          </button>
        )}
      </div>

      {/* Toggle selector */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/40">
        <button
          onClick={() => setViewMode('members')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
            viewMode === 'members'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          👥 أفراد الأسرة وميزانياتهم
        </button>
        <button
          onClick={() => setViewMode('dashboard')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
            viewMode === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          📊 لوحة البيانات الشاملة للبيت
        </button>
      </div>

      {viewMode === 'dashboard' ? (
        <FamilyDashboard
          expenses={expenses}
          familyMembers={familyMembers}
          monthlyBudget={onboardingData?.monthlySalary || 15000}
          onboardingData={onboardingData}
        />
      ) : (
        <>
          {/* Add Member Form Drawer */}
          {showAddForm && (
            <form 
              onSubmit={handleAddMember}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm animate-slide-down"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">بيانات عضو العائلة الجديد</h3>
                <span className="text-[10px] text-slate-400">خصص ميزانيته الشهرية</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">الاسم الأول *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: يوسف"
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-[#2563EB] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">الميزانية الشهرية (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="مثال: 3000"
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-[#2563EB] outline-none text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">الدور في العائلة</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:border-[#2563EB] outline-none"
                  >
                    <option value="الأب">الأب</option>
                    <option value="الأم">الأم</option>
                    <option value="الابن">الابن</option>
                    <option value="الابنة">الابنة</option>
                    <option value="الجد">الجد</option>
                    <option value="الجدة">الجدة</option>
                  </select>
                </div>
                
                {/* Avatar Select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">اختر الرمز التعبيري</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {avatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setNewAvatar(av)}
                        className={`w-9 h-9 text-base rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          newAvatar === av
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  حفظ وإضافة العضو
                </button>
              </div>
            </form>
          )}

          {/* Grid of Family Members Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {familyMembers.map((member) => {
              const spent = getMemberSpent(member.name);
              const limit = member.monthlyBudget;
              const ratio = Math.min(100, Math.round((spent / limit) * 100));

              return (
                <div 
                  key={member.id}
                  onClick={() => setSelectedMemberName(selectedMemberName === member.name ? null : member.name)}
                  className={`bg-white dark:bg-slate-900 border rounded-[2rem] p-6 hover:border-blue-200 transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden ${
                    selectedMemberName === member.name ? 'ring-2 ring-blue-500/20 border-blue-400' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-slate-850 flex items-center justify-center text-2xl shrink-0">
                        {member.avatar}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</h3>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40 font-semibold mt-1 inline-block">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Delete button (Protect onboarding or primary members from accidental deletions) */}
                      {['أحمد', 'منى', onboardingData?.name].includes(member.name) ? null : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت متأكد من إزالة العضو ${member.name} ومسح ميزانيته؟`)) {
                              onDeleteMember(member.id);
                              if (selectedMemberName === member.name) setSelectedMemberName(null);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="إزالة عضو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar and metrics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>منفق: {formatCurrency(spent)}</span>
                      <span>الميزانية: {formatCurrency(limit)}</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          ratio > 90 
                            ? 'bg-red-500' 
                            : ratio > 75 
                              ? 'bg-amber-500' 
                              : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>نسبة الاستهلاك</span>
                      <span className={`font-bold ${ratio > 90 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{ratio}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Member Details Card */}
          {selectedMemberName && (
            <div className="bg-[#2563EB]/5 border border-blue-100 rounded-[2rem] p-6 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  تفاصيل مصروفات العضو ( {selectedMemberName} ) المكتشفة تلقائياً
                </h3>
                <span className="text-[10px] text-slate-400">انقر على العضو مرة أخرى لإغلاق التفاصيل</span>
              </div>

              <div className="space-y-2.5">
                {expenses.filter(e => e.recordedBy === selectedMemberName).length === 0 ? (
                  <p className="text-center text-xs text-[#1E40AF] dark:text-blue-400 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    لا توجد أي مصروفات مسجلة باسم {selectedMemberName} حتى الآن.
                  </p>
                ) : (
                  expenses
                    .filter(e => e.recordedBy === selectedMemberName)
                    .map(exp => {
                      const catDetails = CATEGORY_DETAILS[exp.category];
                      return (
                        <div key={exp.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${catDetails?.color ? 'bg-blue-500' : 'bg-slate-400'}`} />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{exp.title}</p>
                              <span className="text-[10px] text-slate-400">{exp.merchant} • {exp.date}</span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(exp.amount)}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
