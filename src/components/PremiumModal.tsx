/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Check, 
  Zap, 
  ChevronRight, 
  Volume2, 
  Camera, 
  FileSpreadsheet, 
  BrainCircuit, 
  Users, 
  TrendingDown
} from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onTogglePremium: () => void;
}

export default function PremiumModal({
  isOpen,
  onClose,
  isPremium,
  onTogglePremium
}: PremiumModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setLoading(true);
    // Simulate premium validation
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onTogglePremium();
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans" style={{ direction: 'rtl' }}>
      
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center text-white text-center p-6"
          >
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/20 mb-6 animate-bounce">
              <Sparkles className="w-10 h-10 fill-slate-950" />
            </div>
            <h2 className="text-2xl font-black text-amber-300">أهلاً بك في العصر الذهبي للبيت المالي! ✨</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-xs font-semibold leading-relaxed">
              تم ترقية حسابك بنجاح إلى الباقة الممتازة. استمتع بمميزات غير محدودة الآن!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Amber decoration circles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 -right-8 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-xl"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center pt-2 space-y-2 mb-5">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
            <span>باقة العائلة الممتازة (Premium)</span>
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white">تحكّم استثنائي في عصبك المالي</h2>
          <p className="text-[11px] text-slate-400 font-medium">ابدأ الآن لتتمكن عائلتك من تحقيق أقصى مستويات التوفير الذكي</p>
        </div>

        {/* Core Premium features list */}
        <div className="space-y-3.5 mb-6">
          <div className="flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">مسح الفواتير بالذكاء الاصطناعي (OCR)</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">التقط صورة للفاتورة وسيقوم بيت AI بقراءة البنود والأسعار تلقائياً وتوزيعها.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">الإدخال الصوتي التفاعلي السلس</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">قل فقط "صرفت اليوم ١٥٠ جنيه بقالة في كارفور" وسيكتبها المساعد عنك.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تصدير التقارير بصيغ متعددة (PDF/Excel/CSV)</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">صدر تقاريرك المالية كاملة للكهرباء والمصاريف بضغطة زر واحدة لمشاركتها.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">المستشار المالي التنبئي والمحاكي الكامل</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">توقع ذكي لمصروفات الشهور القادمة محاكاة كاملة لقرارات الشراء مسبقاً.</p>
            </div>
          </div>
        </div>

        {/* Toggle billing option */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1 mb-5">
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2 rounded-xl text-center text-xs font-black transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>سنوي (توفير ٥٠٪)</span>
          </button>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2 rounded-xl text-center text-xs font-black transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>شهرياً</span>
          </button>
        </div>

        {/* Price display and CTA button */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400">التسعير العادل والمستمر</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {billingCycle === 'yearly' ? '٥٩٩ ج.م' : '٩٩ ج.م'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  /{billingCycle === 'yearly' ? 'سنوياً' : 'شهرياً'}
                </span>
              </div>
            </div>
            {billingCycle === 'yearly' && (
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                توفير ٦٠٠ ج.م سنوياً
              </span>
            )}
          </div>

          {isPremium ? (
            <button
              onClick={() => {
                onTogglePremium();
                onClose();
              }}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-center text-xs font-black text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>إلغاء الاشتراك الممتاز النشط حالياً</span>
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-center text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 hover:brightness-105"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Zap className="w-4.5 h-4.5 fill-slate-950" />
                  <span>تأكيد الاشتراك السريع والبدء ✨</span>
                </>
              )}
            </button>
          )}

          <p className="text-[10px] text-slate-400 font-bold text-center">بشراء الاشتراك، أنت توافق على شروط الاستخدام وسياسة الخصوصية بالكامل.</p>
        </div>

      </motion.div>
    </div>
  );
}
