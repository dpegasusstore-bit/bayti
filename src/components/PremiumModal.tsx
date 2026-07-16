/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Check, 
  Zap, 
  Volume2, 
  Camera, 
  FileSpreadsheet, 
  BrainCircuit, 
  Copy, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

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
  const [step, setStep] = useState<'comparison' | 'payment' | 'status'>('comparison');
  
  const [config, setConfig] = useState<{
    monthlyPrice: number;
    yearlyPrice: number;
    vodafoneNumber: string;
    userRequests: any[];
    profile: any;
  } | null>(null);

  const [senderNumber, setSenderNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch subscription configurations and active requests on open
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await api.getSubscriptionConfig();
      if (res.success) {
        setConfig(res);
        
        // Determine starting view step based on active/pending request
        const pendingReq = res.userRequests?.find((r: any) => r.status === 'Pending');
        if (pendingReq) {
          setStep('status');
        } else if (res.profile?.subscription === 'Premium') {
          setStep('status');
        } else {
          setStep('comparison');
        }
      }
    } catch (err) {
      console.error('Error loading subscription config:', err);
    }
  };

  if (!isOpen) return null;

  // Copy Vodafone number to clipboard
  const handleCopyNumber = () => {
    const numberToCopy = config?.vodafoneNumber || '01002345678';
    navigator.clipboard.writeText(numberToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  // Convert uploaded image file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('عذراً، حجم الملف كبير جداً (الأقصى 8 ميجابايت).');
        return;
      }
      setFormError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit proof of payment to server
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber || senderNumber.length < 11) {
      setFormError('يرجى إدخال رقم المحفظة المرسل بشكل صحيح (11 رقم).');
      return;
    }
    if (!screenshot) {
      setFormError('يرجى رفع صورة أو لقطة شاشة لإيصال التحويل لتأكيد العملية.');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const amount = billingCycle === 'yearly' 
        ? (config?.yearlyPrice || 599) 
        : (config?.monthlyPrice || 99);

      const res = await api.submitSubscriptionRequest({
        billingCycle,
        amount,
        senderNumber,
        screenshotBase64: screenshot
      });

      if (res.success) {
        setSuccess(true);
        if (window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => {
          setSuccess(false);
          setStep('status');
          loadConfig();
        }, 1500);
      } else {
        setFormError(res.error || 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      setFormError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel premium subscription
  const handleCancelPremium = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء اشتراكك الممتاز والعودة للباقة العادية؟ ستخسر الميزات اللانهائية فوراً.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.cancelSubscription();
      if (res.success) {
        onTogglePremium(); // update parent state
        loadConfig();
        setStep('comparison');
      }
    } catch (err) {
      alert('حدث خطأ أثناء محاولة إلغاء الاشتراك.');
    } finally {
      setLoading(false);
    }
  };

  // Render comparative plans table
  const renderComparisonTable = () => {
    const monthlyPrice = config?.monthlyPrice || 99;
    const yearlyPrice = config?.yearlyPrice || 599;
    const currentPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;

    return (
      <div className="flex flex-col justify-between h-full">
        {/* Toggle billing option */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2 rounded-xl text-center text-xs font-black transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>سنوي (توفير ٥٠٪) 🌟</span>
          </button>
          <button
            type="button"
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

        {/* Dynamic Comparison Table Grid */}
        <div className="flex-1 overflow-y-auto max-h-[320px] mb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/40 text-right">
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-2.5 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200/50 dark:border-slate-700/50">
              <div>الميزة المالية</div>
              <div className="text-center text-slate-500 dark:text-slate-400">الباقة العادية</div>
              <div className="text-center text-amber-600 dark:text-amber-400">بريميوم التميز</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-[10.5px]">
              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">عدد أفراد العائلة</div>
                <div className="text-center text-slate-500">حتى ٥ أفراد</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">لانهائي 👨‍👩‍👧‍👦</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">الذكاء الاصطناعي</div>
                <div className="text-center text-slate-500">٢٠ عملية شهرياً</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">لانهائي بلا حدود 🚀</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">مسح الفواتير (OCR)</div>
                <div className="text-center text-slate-500">يخصم من الميزان</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">مفتوح بالكاميرا 📸</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">الإدخال الصوتي ذكي</div>
                <div className="text-center text-slate-500">يخصم من الميزان</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">لانهائي بالصوت 🗣️</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">تصدير التقارير</div>
                <div className="text-center text-slate-500">صيغة أساسية</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">PDF / Excel مفصل 📊</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">مستشار "ماذا لو"</div>
                <div className="text-center text-slate-400">غير متوفر</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">متاح بالكامل 🔮</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">سجل المصروفات</div>
                <div className="text-center text-slate-500">متاح دائماً</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">متاح دائماً</div>
              </div>

              <div className="grid grid-cols-3 p-2.5 items-center">
                <div className="font-bold text-slate-800 dark:text-slate-200">الأولوية والدعم</div>
                <div className="text-center text-slate-400">عادي</div>
                <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">فوري 24/7 ⚡</div>
              </div>
            </div>
          </div>
        </div>

        {/* Price and Action Button */}
        <div className="space-y-3 shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400">قيمة الاشتراك المطلوبة</p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {currentPrice} ج.م
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  /{billingCycle === 'yearly' ? 'سنوياً' : 'شهرياً'}
                </span>
              </div>
            </div>
            {billingCycle === 'yearly' && (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                توفير ٦٠٠ ج.م سنوياً 🔥
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep('payment')}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-center text-xs font-black transition-all shadow-lg shadow-amber-500/10 active:scale-98 flex items-center justify-center gap-1.5 hover:brightness-105"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>الترقية السريعة عبر فودافون كاش 💳</span>
          </button>
        </div>
      </div>
    );
  };

  // Render Vodafone Cash payment process
  const renderPaymentForm = () => {
    const monthlyPrice = config?.monthlyPrice || 99;
    const yearlyPrice = config?.yearlyPrice || 599;
    const currentPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
    const vodafoneNumber = config?.vodafoneNumber || '01002345678';

    return (
      <form onSubmit={handleSubmitPayment} className="flex flex-col justify-between h-full text-right">
        <div className="flex-1 overflow-y-auto max-h-[380px] mb-4 pr-1 space-y-4">
          
          {/* Instruction Card */}
          <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl space-y-2">
            <h4 className="text-[11px] font-black text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-4.5 h-4.5" />
              <span>خطوات التحويل فودافون كاش:</span>
            </h4>
            <ol className="text-[10px] text-slate-600 dark:text-slate-300 list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>قم بتحويل مبلغ <strong className="text-slate-950 dark:text-white font-extrabold">{currentPrice} ج.م</strong> إلى الرقم الإداري التالي.</li>
              <li>يرجى كتابة رقم الهاتف المرسل منه وتحميل إيصال التحويل بالأسفل لتأكيد الاشتراك.</li>
            </ol>
          </div>

          {/* Number Display Box */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400">الرقم الإداري المراد التحويل إليه:</p>
              <p className="text-sm font-black text-slate-800 dark:text-white tracking-wider mt-0.5">{vodafoneNumber}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyNumber}
              className={`p-2.5 rounded-xl transition-all ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Wallet Phone Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500">رقم المحفظة الذي قمت بالتحويل منه (المرسل):</label>
            <input
              type="tel"
              required
              maxLength={11}
              placeholder="مثال: 01012345678"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Screenshot Upload Block */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500">صورة إيصال التحويل أو لقطة الشاشة:</label>
            
            {screenshot ? (
              <div className="relative border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden aspect-video group">
                <img src={screenshot} alt="Screenshot receipt" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute top-2 left-2 p-1.5 bg-slate-950/80 hover:bg-red-600 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/40 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/20 dark:bg-slate-900/10">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">اسحب صورة الإيصال هنا أو اضغط للتصفح</p>
                <p className="text-[8px] text-slate-400 mt-1 font-bold">بحد أقصى 8 ميجابايت (JPG, PNG)</p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {formError && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-2xl text-[10px] font-bold flex items-center gap-1.5 border border-red-100 dark:border-red-950/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setStep('comparison')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-center text-xs font-black transition-all"
          >
            <span>رجوع</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1.5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-center text-xs font-black transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 hover:brightness-105"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>إرسال لتأكيد التحويل</span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  // Render subscription status and request tracking timeline
  const renderStatusView = () => {
    const isUserPremium = config?.profile?.subscription === 'Premium';
    const pendingReq = config?.userRequests?.find((r: any) => r.status === 'Pending');
    const rejectedReq = config?.userRequests?.find((r: any) => r.status === 'Rejected');

    return (
      <div className="flex flex-col justify-between h-full text-right space-y-4">
        
        {/* Case A: Active Premium */}
        {isUserPremium ? (
          <div className="flex-1 space-y-5">
            <div className="flex flex-col items-center text-center p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-2">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">باقة العائلة الممتازة بريميوم نشطة! ✨</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                حسابك الآن يتمتع بالصلاحيات الممتازة اللانهائية واستدعاءات الذكاء الاصطناعي بلا حدود.
              </p>
            </div>

            {/* Info cards */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-3xl space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-slate-400">صلاحية الباقة:</span>
                <span className="text-slate-800 dark:text-white">
                  {config?.profile?.subscriptionExpiryDate 
                    ? new Date(config.profile.subscriptionExpiryDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'لانهائي'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-slate-400">معدل عمليات AI:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">مفتوح بلا قيود 🚀</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCancelPremium}
                disabled={loading}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>إلغاء الاشتراك النشط والعودة للمجاني</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : pendingReq ? (
          /* Case B: Pending Approval */
          <div className="flex-1 space-y-5">
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-amber-600 dark:text-amber-400">طلب الاشتراك قيد المراجعة الإدارية ⏳</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                لقد استلمنا لقطة شاشة التحويل بقيمة {pendingReq.amount} ج.م من الرقم {pendingReq.senderNumber} وجاري التدقيق الفوري.
              </p>
            </div>

            {/* Timeline element */}
            <div className="space-y-4 px-2">
              <h4 className="text-[11px] font-black text-slate-400">حالة تدقيق الفاتورة:</h4>
              <div className="relative border-r-2 border-slate-200 dark:border-slate-800 mr-2 pr-4 space-y-4 text-right">
                
                <div className="relative">
                  <div className="absolute -right-[23px] top-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></div>
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">تم إرسال طلب تأكيد التحويل</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">في {new Date(pendingReq.requestDate).toLocaleTimeString('ar-EG', {hour:'numeric', minute:'2-digit'})}</p>
                </div>

                <div className="relative">
                  <div className="absolute -right-[23px] top-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-4 ring-amber-500/20 animate-ping"></div>
                  <h5 className="text-[11px] font-black text-slate-700 dark:text-slate-300">مراجعة كشوفات Vodafone Cash</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">يقوم مسؤولو الإدارة بمطابقة المبلغ حالياً</p>
                </div>

                <div className="relative">
                  <div className="absolute -right-[23px] top-0.5 w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                  <h5 className="text-[11px] font-black text-slate-400">تفعيل الباقة الممتازة مدى الحياة/سنوياً</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">يتم تفعيل المزايا فور اكتمال التدقيق المالي</p>
                </div>

              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={loadConfig}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-2xl text-center text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                <span>تحديث حالة الطلب يدوياً 🔄</span>
              </button>
            </div>
          </div>
        ) : rejectedReq ? (
          /* Case C: Rejected recently */
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-3xl flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-red-600 dark:text-red-400">تم رفض طلب الترقية الأخير 🔴</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                السبب: <strong className="text-red-600 font-black">{rejectedReq.rejectionReason}</strong>
              </p>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              برجاء مراجعة التحويل المالي أو إعادة المحاولة بلقطة شاشة صحيحة ومطابقة.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('comparison')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-center text-xs font-black"
              >
                <span>مقارنة الخطط</span>
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-center text-xs font-black transition-all hover:brightness-105"
              >
                <span>إرسال طلب جديد 💳</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">لا توجد اشتراكات نشطة أو معلقة حالياً.</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans" style={{ direction: 'rtl' }}>
      
      {/* Dynamic Splash Screen for Quick Actions */}
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
            <h2 className="text-2xl font-black text-amber-300">تم إرسال طلبك بنجاح! ✨</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-xs font-semibold leading-relaxed">
              يقوم فريق العمل الآن بمطابقة بيانات التحويل وتفعيل بريميوم لحسابك على الفور.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Amber decoration circles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 -right-8 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-xl"></div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center pt-2 space-y-1 mb-4">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
            <span>باقة العائلة الممتازة بريميوم (Premium)</span>
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white">ترقية حساب العائلة المميز</h2>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {step === 'comparison' && 'قارن المزايا وابدأ التوفير الاستثنائي لعصبك المالي'}
            {step === 'payment' && 'أرسل لقطة شاشة تحويل فودافون كاش للتفعيل الفوري'}
            {step === 'status' && 'متابعة حالة تفعيل وتدقيق باقة بريميوم الخاصة بك'}
          </p>
        </div>

        {/* Dynamic Multi-step Content */}
        <div className="flex-1 min-h-[360px]">
          {step === 'comparison' && renderComparisonTable()}
          {step === 'payment' && renderPaymentForm()}
          {step === 'status' && renderStatusView()}
        </div>

        <p className="text-[9px] text-slate-400 font-bold text-center mt-4 border-t border-slate-50 dark:border-slate-800/40 pt-2.5">
          مستشاري بيت AI الماليين ملتزمون بمطابقة وتأكيد كافة التحويلات على مدار الساعة طوال أيام الأسبوع.
        </p>

      </motion.div>
    </div>
  );
}
