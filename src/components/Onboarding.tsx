/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  User, 
  DollarSign, 
  Home, 
  Car, 
  Check, 
  ChevronRight, 
  MapPin, 
  Coins, 
  Heart, 
  Users, 
  Calendar,
  Wallet
} from 'lucide-react';

export interface OnboardingData {
  name: string;
  avatar: string;
  country: string;
  currency: string;
  monthlySalary: number;
  otherIncome: number;
  maritalStatus: string;
  familyMembersCount: number;
  ownsCar: boolean;
  paysInstallments: boolean;
  participatesInGroup: boolean;
  homeStatus: 'rent' | 'own';
  wantsGoals: boolean;
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

const AVATARS = ['👨🏻‍💼', '👩🏻‍⚕️', '👨🏻‍💻', '👧🏻', '🧔', '👩', '👴', '👵', '🦁', '🦉', '🦊', '🎨'];
const COUNTRIES = [
  { name: 'مصر', code: 'EG', currency: 'EGP', symbol: 'ج.م' },
  { name: 'المملكة العربية السعودية', code: 'SA', currency: 'SAR', symbol: 'ر.س' },
  { name: 'الإمارات العربية المتحدة', code: 'AE', currency: 'AED', symbol: 'د.إ' },
  { name: 'الكويت', code: 'KW', currency: 'KWD', symbol: 'د.ك' },
  { name: 'قطر', code: 'QA', currency: 'QAR', symbol: 'ر.ق' },
  { name: 'أخرى', code: 'OTHER', currency: 'USD', symbol: '$' }
];

const CURRENCIES = [
  { code: 'EGP', name: 'جنيه مصري (EGP)', symbol: 'ج.م' },
  { code: 'SAR', name: 'ريال سعودي (SAR)', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي (AED)', symbol: 'د.إ' },
  { code: 'KWD', name: 'دينار كويتي (KWD)', symbol: 'د.ك' },
  { code: 'USD', name: 'دولار أمريكي (USD)', symbol: '$' }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    avatar: '👨🏻‍💼',
    country: 'مصر',
    currency: 'EGP',
    monthlySalary: 15000,
    otherIncome: 0,
    maritalStatus: 'متزوج',
    familyMembersCount: 4,
    ownsCar: false,
    paysInstallments: false,
    participatesInGroup: false,
    homeStatus: 'own',
    wantsGoals: true
  });

  const totalSteps = 13;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateData = (fields: Partial<OnboardingData>) => {
    setData(prev => {
      const next = { ...prev, ...fields };
      // Auto-set currency if country changes
      if (fields.country) {
        const found = COUNTRIES.find(c => c.name === fields.country);
        if (found) {
          next.currency = found.currency;
        }
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between p-6 overflow-y-auto select-none font-sans transition-colors duration-300">
      
      {/* Header bar */}
      <div className="flex justify-between items-center max-w-md w-full mx-auto pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-100 dark:shadow-none">
            بيت
          </div>
          <span className="font-extrabold text-slate-800 dark:text-white tracking-tight text-sm font-sans">Bayti AI</span>
        </div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
          خطوة {step + 1} من {totalSteps}
        </div>
      </div>

      {/* Progress line */}
      <div className="max-w-md w-full mx-auto h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-3">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Step 1: Name */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">ما هو اسمك الكريم؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">سوف نستخدم هذا الاسم لتخصيص تجربتك وتحيتك يومياً.</p>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  placeholder="اكتب اسمك هنا..."
                  className="w-full p-4 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white transition-all text-right"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Avatar */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">اختر صورتك التعبيرية (Emoji)</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">اختر الرمز الذي يمثلك بشكل أفضل كمسؤول البيت.</p>
                <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => updateData({ avatar: emoji })}
                      className={`h-14 rounded-2xl text-2xl flex items-center justify-center border transition-all ${
                        data.avatar === emoji
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 scale-105 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Country */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">في أي بلد تعيش؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">نستخدم هذا لتخصيص العملة التلقائية وتقديم نصائح تناسب طبيعة المعيشة في بلدك.</p>
                <div className="space-y-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => updateData({ country: c.name })}
                      className={`w-full p-4 rounded-2xl border text-right font-semibold text-xs flex justify-between items-center transition-all ${
                        data.country === c.name
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{c.name}</span>
                      {data.country === c.name && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Currency */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Coins className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">ما هي العملة التي تفضلها؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">سيتم عرض جميع التقارير والمبالغ في التطبيق بهذه العملة.</p>
                <div className="space-y-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => updateData({ currency: c.code })}
                      className={`w-full p-4 rounded-2xl border text-right font-semibold text-xs flex justify-between items-center transition-all ${
                        data.currency === c.code
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{c.name}</span>
                      {data.currency === c.code && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Monthly Salary */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">كم يبلغ راتبك الشهري الأساسي؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">نحتاج هذا لتحديد ميزانية عائلتك الافتراضية وحساب المتبقي الآمن.</p>
                <div className="relative">
                  <input
                    type="number"
                    value={data.monthlySalary}
                    onChange={(e) => updateData({ monthlySalary: Number(e.target.value) })}
                    className="w-full p-4 text-lg font-bold border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white transition-all text-left pl-12"
                    placeholder="مثال: 15000"
                  />
                  <span className="absolute left-4 top-4 font-black text-slate-400 dark:text-slate-500">{data.currency}</span>
                </div>
              </div>
            )}

            {/* Step 6: Other Income */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">مصادر دخل أخرى شهرياً؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">اكتب متوسط الدخل الإضافي إن وجد (مثل عقارات مؤجرة، أعمال حرة، مكافآت).</p>
                <div className="relative">
                  <input
                    type="number"
                    value={data.otherIncome || ''}
                    onChange={(e) => updateData({ otherIncome: Number(e.target.value) })}
                    className="w-full p-4 text-lg font-bold border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white transition-all text-left pl-12"
                    placeholder="اكتب 0 إن لم يكن هناك دخل إضافي"
                  />
                  <span className="absolute left-4 top-4 font-black text-slate-400 dark:text-slate-500">{data.currency}</span>
                </div>
              </div>
            )}

            {/* Step 7: Marital Status */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">ما هي حالتك الاجتماعية؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">يتيح لـ بيت AI تقديم نصائح تتناسب مع متطلبات الحياة الفردية أو الأسرية.</p>
                <div className="grid grid-cols-2 gap-3">
                  {['أعزب', 'متزوج', 'متزوج ولدي أطفال', 'رب أسرة'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateData({ maritalStatus: status })}
                      className={`p-5 rounded-3xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${
                        data.maritalStatus === status
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 8: Family Members Count */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">ما هو عدد أفراد عائلتك؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">تساعدنا في بناء ملفات أعضاء العائلة وتتبع مصروف كل شخص بدقة.</p>
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                  <button 
                    onClick={() => updateData({ familyMembersCount: Math.min(10, data.familyMembersCount + 1) })}
                    className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100"
                  >
                    +
                  </button>
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{data.familyMembersCount} أفراد</span>
                  <button 
                    onClick={() => updateData({ familyMembersCount: Math.max(1, data.familyMembersCount - 1) })}
                    className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100"
                  >
                    -
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: Do you own a car? */}
            {step === 8 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Car className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">هل تمتلك سيارة؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">نستخدم هذا لتجهيز ميزانيات المحروقات، الصيانة، والتراخيص تلقائياً.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateData({ ownsCar: true })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.ownsCar === true
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>نعم، أمتلك سيارة</span>
                  </button>
                  <button
                    onClick={() => updateData({ ownsCar: false })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.ownsCar === false
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>لا أمتلك سيارة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 10: Do you pay installments? */}
            {step === 9 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">هل تدفع أي أقساط شهرية؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">مثل قسط سيارة، قسط بنكي، كروت الائتمان، إلخ. ستتم جدولتها تلقائياً.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateData({ paysInstallments: true })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.paysInstallments === true
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>نعم، أدفع أقساطاً</span>
                  </button>
                  <button
                    onClick={() => updateData({ paysInstallments: false })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.paysInstallments === false
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>لا أدفع أقساطاً</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 11: Do you participate in a rotating savings group (جمعية)? */}
            {step === 10 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">هل تشترك في جمعية مالية؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">الجمعيات الادخارية (الجمعية الدورية). سنساعدك في جدولة وتذكر دفعات الجمعية شهرياً.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateData({ participatesInGroup: true })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.participatesInGroup === true
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>نعم، مشترك بجمعية</span>
                  </button>
                  <button
                    onClick={() => updateData({ participatesInGroup: false })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.participatesInGroup === false
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>لا أشترك بجمعيات</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 12: Do you rent or own your home? */}
            {step === 11 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Home className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">هل المنزل إيجار أم تمليك؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">تساعدنا في تتبع التزامات السكن الأساسية وجدولة مدفوعات الإيجار بانتظام.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateData({ homeStatus: 'rent' })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.homeStatus === 'rent'
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>البيت إيجار</span>
                  </button>
                  <button
                    onClick={() => updateData({ homeStatus: 'own' })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.homeStatus === 'own'
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>البيت تمليك / ملك</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 13: Do you want to create savings goals? */}
            {step === 12 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6 fill-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">هل ترغب في تحديد أهداف ادخار؟</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">سننشئ لك أهدافاً ادخارية ذكية تلقائياً (مثل شراء منزل، سيارة، صندوق الطوارئ) ونقيس نسبة نجاحها بالذكاء الاصطناعي.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateData({ wantsGoals: true })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.wantsGoals === true
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>نعم، أريد أهدافاً</span>
                  </button>
                  <button
                    onClick={() => updateData({ wantsGoals: false })}
                    className={`p-6 rounded-3xl border text-center font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                      data.wantsGoals === false
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>ليس الآن</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center pt-4 pb-6">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className="px-5 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-20 flex items-center gap-1 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>السابق</span>
        </button>

        <button
          onClick={handleNext}
          disabled={step === 0 && !data.name.trim()}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none transition-all disabled:opacity-50"
        >
          <span>{step === totalSteps - 1 ? 'ابدأ الاستخدام' : 'المتابعة'}</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
