/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowLeftRight, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  User, 
  CreditCard, 
  Trash2,
  Calendar
} from 'lucide-react';
import { Expense, CategoryType } from '../types';
import { CATEGORY_DETAILS, PAYMENT_METHODS, formatCurrency } from '../utils';

interface ExpensesTabProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  familyMembers: string[];
}

export default function ExpensesTab({
  expenses,
  onAddExpense,
  onDeleteExpense,
  familyMembers
}: ExpensesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeMemberFilter, setActiveMemberFilter] = useState<string>('All');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manual creation states (Fallback)
  const [showManualForm, setShowManualForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Home');
  const [newMerchant, setNewMerchant] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Cash' | 'Card' | 'Wallet'>('Cash');
  const [newRecordedBy, setNewRecordedBy] = useState(familyMembers[0] || 'أحمد');
  const [newNotes, setNewNotes] = useState('');

  // Submit manual expense
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const expense: Expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      title: newTitle,
      amount: Number(newAmount),
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      merchant: newMerchant || 'غير محدد',
      paymentMethod: newPaymentMethod,
      recordedBy: newRecordedBy,
      notes: newNotes,
      items: []
    };

    onAddExpense(expense);
    
    // Reset Form
    setNewTitle('');
    setNewAmount('');
    setNewMerchant('');
    setNewNotes('');
    setShowManualForm(false);
  };

  // Filter logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = 
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategoryFilter === 'All' || exp.category === activeCategoryFilter;
    const matchesMember = activeMemberFilter === 'All' || exp.recordedBy === activeMemberFilter;

    return matchesSearch && matchesCategory && matchesMember;
  });

  return (
    <div className="space-y-5 pb-24">
      {/* Welcome & Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">سجل المصاريف الكامل</h2>
          <p className="text-xs text-slate-500 mt-1">تصفح المصروفات المفصلة المصنفة تلقائياً</p>
        </div>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm shadow-blue-100 transition-colors"
          id="btn_toggle_manual_form"
        >
          {showManualForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>إضافة يدوية</span>
        </button>
      </div>

      {/* Expandable Manual Form Fallback */}
      {showManualForm && (
        <form 
          onSubmit={handleAddManual}
          className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4 shadow-sm animate-slide-down"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">تفاصيل المصروف اليدوي</h3>
            <span className="text-[10px] text-slate-400">يرجى ملء الحقول الأساسية</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم المصروف *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: فاتورة الغاز لشهر يوليو"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">القيمة المالية (ج.م) *</label>
              <input
                type="number"
                required
                min="1"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="مثال: 120"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none text-left"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الفئة</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none bg-white"
              >
                {Object.entries(CATEGORY_DETAILS).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم المتجر / التاجر</label>
              <input
                type="text"
                value={newMerchant}
                onChange={(e) => setNewMerchant(e.target.value)}
                placeholder="مثال: شركة الغاز الطبيعي"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">طريقة الدفع</label>
              <select
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none bg-white"
              >
                <option value="Cash">💵 نقدي</option>
                <option value="Card">💳 بطاقة مصرفية</option>
                <option value="Wallet">📱 محفظة ذكية</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">أضيف بواسطة</label>
              <select
                value={newRecordedBy}
                onChange={(e) => setNewRecordedBy(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none bg-white"
              >
                {familyMembers.map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ملاحظات إضافية</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات اختيارية هنا..."
              className="w-full h-16 p-2.5 text-xs border border-slate-200 rounded-xl focus:border-[#2563EB] outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              حفظ المصروف
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters Bento layout */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، المتجر أو الملاحظات..."
            className="w-full p-3 pr-10 pl-4 text-xs border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:border-[#2563EB] outline-none transition-all text-right"
            style={{ direction: 'rtl' }}
          />
        </div>

        {/* Categories horizontal scroll filter */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">تصفية حسب الفئة</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setActiveCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeCategoryFilter === 'All'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-100'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              الكل
            </button>
            {Object.entries(CATEGORY_DETAILS).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveCategoryFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                  activeCategoryFilter === key
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-100'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Member filter */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">سجل العضو:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveMemberFilter('All')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                activeMemberFilter === 'All'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              الكل
            </button>
            {familyMembers.map((member) => (
              <button
                key={member}
                onClick={() => setActiveMemberFilter(member)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeMemberFilter === member
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {member}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable list & expandable itemized bills */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl text-xs text-slate-400">
            لم نعثر على أي مصروفات تطابق اختياراتك الحالية.
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const cat = CATEGORY_DETAILS[exp.category];
            const IconComponent = cat?.icon || ArrowLeftRight;
            const isExpanded = expandedExpenseId === exp.id;
            const hasItems = exp.items && exp.items.length > 0;

            return (
              <div 
                key={exp.id}
                className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all duration-200"
              >
                {/* Main Row */}
                <div 
                  onClick={() => hasItems && setExpandedExpenseId(isExpanded ? null : exp.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer ${
                    isExpanded ? 'bg-slate-100/50 border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cat?.bgColor || 'bg-slate-100'} ${cat?.color || 'text-slate-600'} flex items-center justify-center shrink-0`}>
                      <IconComponent className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{exp.title}</h4>
                        {hasItems && (
                          <span className="bg-blue-50 text-[#2563EB] text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            فاتورة مفصلة
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-medium">
                        <span className="font-semibold text-slate-500">{exp.merchant}</span>
                        <span>•</span>
                        <span>بواسطة {exp.recordedBy}</span>
                        <span>•</span>
                        <span>{new Date(exp.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {deletingId === exp.id ? (
                      <div 
                        className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-xl p-1 shrink-0 animate-slide-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            onDeleteExpense(exp.id);
                            setDeletingId(null);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          تأكيد حذف
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-left">
                          <p className="font-bold text-red-500 text-sm font-mono">- {formatCurrency(exp.amount)}</p>
                          <p className="text-[9px] text-slate-400 text-left">{PAYMENT_METHODS[exp.paymentMethod] || exp.paymentMethod}</p>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(exp.id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {hasItems && (
                      <div className="text-slate-400 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanding sub-items view (The High-Fidelity Receipt Display) */}
                {isExpanded && hasItems && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-xs space-y-3.5">
                    {exp.notes && (
                      <div className="text-slate-500 italic bg-white p-2.5 border border-slate-100 rounded-xl leading-relaxed text-[11px]">
                        "{exp.notes}"
                      </div>
                    )}

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">الأصناف التي قرأها بيت AI:</span>
                      
                      {/* Thermal Paper Receipt Design */}
                      <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-inner max-w-sm mx-auto font-sans relative overflow-hidden">
                        {/* Zigzag paper edges simulation */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,transparent_25%,#e2e2e0_25%,#e2e2e0_50%,transparent_50%,transparent_75%,#e2e2e0_75%)] bg-[length:10px_10px]" />
                        
                        <div className="text-center pb-2 border-b border-dashed border-slate-200 mt-1">
                          <h5 className="font-bold text-slate-800 text-xs">{exp.merchant}</h5>
                          <span className="text-[10px] text-slate-400">تلقائي عبر بيت AI OCR</span>
                        </div>

                        <div className="py-3 space-y-2 text-[11px]">
                          {exp.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span>• {item.name}</span>
                              <span className="font-semibold">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-1.5 text-[11px]">
                          {exp.vat && exp.vat > 0 ? (
                            <div className="flex justify-between text-slate-500">
                              <span>ضريبة القيمة المضافة</span>
                              <span>{formatCurrency(exp.vat)}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between font-black text-slate-800 text-xs pt-1">
                            <span>المجموع الكلي</span>
                            <span>{formatCurrency(exp.amount)}</span>
                          </div>
                        </div>

                        <div className="text-center text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                          بواسطة {exp.recordedBy} • الدفع عبر {PAYMENT_METHODS[exp.paymentMethod]}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
