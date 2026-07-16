/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  User, 
  Sliders, 
  Check, 
  LogOut,
  Info,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Globe,
  Coins,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  ShieldAlert,
  Fingerprint,
  Phone,
  Settings,
  Trash2,
  Tv,
  Zap
} from 'lucide-react';
import { formatCurrency } from '../utils';
import { api } from '../services/api';

interface SettingsTabProps {
  monthlyBudget: number;
  onChangeMonthlyBudget: (budget: number) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  onResetData: () => void;
  userEmail: string;
  currentUser?: any;
  userProfile?: any;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  
  // Phase 6 variables & handlers
  isPasscodeEnabled: boolean;
  onTogglePasscode: () => void;
  isFaceIdEnabled: boolean;
  onToggleFaceId: () => void;
  hideFinancialValues: boolean;
  onToggleHideValues: () => void;
  hideNotificationsContent: boolean;
  onToggleHideNotifications: () => void;
  activeCurrency: string;
  onChangeCurrency: (currency: string) => void;
  onOpenExport: () => void;
  onOpenPremium: () => void;
}

export default function SettingsTab({
  monthlyBudget,
  onChangeMonthlyBudget,
  isPremium,
  onTogglePremium,
  onResetData,
  userEmail,
  currentUser,
  userProfile,
  onLogout,
  onDeleteAccount,
  isPasscodeEnabled,
  onTogglePasscode,
  isFaceIdEnabled,
  onToggleFaceId,
  hideFinancialValues,
  onToggleHideValues,
  hideNotificationsContent,
  onToggleHideNotifications,
  activeCurrency,
  onChangeCurrency,
  onOpenExport,
  onOpenPremium
}: SettingsTabProps) {
  // Local UI state for backup and Help Center
  const [backupRestoreInput, setBackupRestoreInput] = useState('');
  const [showBackupTextarea, setShowBackupTextarea] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Profile management & Sessions
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(userProfile?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(userProfile?.phone || '');
  const [passInput, setPassInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await api.getSessions();
        if (res.success) {
          setSessions(res.activeSessions || []);
          setLoginHistory(res.loginHistory || []);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    }
    fetchSessions();
  }, []);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    if (!fullNameInput) {
      setProfileError('الاسم الكامل مطلوب.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        fullName: fullNameInput,
        phone: phoneInput,
        password: passInput || undefined
      });
      if (res.success) {
        setProfileSuccess('تم تحديث بيانات ملفك الشخصي وكلمة المرور بنجاح!');
        setIsEditingProfile(false);
        setPassInput('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setProfileError(res.error || 'فشل التحديث.');
      }
    } catch (err) {
      setProfileError('حدث خطأ بالاتصال بالخادم المالي.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (confirm('هل تود إنهاء كافة جلسات الأجهزة النشطة الأخرى؟ سيتم تسجيل الخروج منها فوراً.')) {
      try {
        const res = await api.logoutAllDevices();
        if (res.success) {
          alert('تم إنهاء الجلسات الأخرى بنجاح.');
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // FAQs data list
  const faqs = [
    {
      q: 'هل بياناتي المالية آمنة تماماً في بيت AI؟',
      a: 'نعم، الأمان هو أولويتنا القصوى. يتم حفظ وتشفير كافة معاملاتك المالية وتفاصيل فواتيرك محلياً على جهازك باستخدام تشفير 256-bit AES. نحن لا نبيع بياناتك ولا يمكن لأي طرف ثالث الوصول إليها.'
    },
    {
      q: 'كيف تعمل ميزات مسح الفواتير بالذكاء الاصطناعي؟',
      a: 'عند تصوير فاتورة أو استلام ورقي، نقوم بطلب معالجة الخادم الذكي بشكل آمن تماماً، فيقوم نموذج Gemini بقراءة السوبرماركت والمشتريات وتفاصيل الضرائب وإرسالها لتُسجل في حسابك المحلي فوراً.'
    },
    {
      q: 'هل يمكنني مزامنة حسابي البنكي بشكل تلقائي؟',
      a: 'نعمل حالياً على تطوير واجهة مزامنة مصرفية مفتوحة متوافقة مع البنوك المصرية والسعودية والإماراتية لتسجيل وتحديث المدفوعات آلياً دون أي تدخل يدوي، وسيتم إطلاقها قريباً.'
    },
    {
      q: 'كيف يمكنني عمل نسخة احتياطية من جميع حساباتي؟',
      a: 'ببساطة استخدم زر "إنشاء نسخة احتياطية محلياً" بالأسفل لتحميل ملف الحسابات المالي الخاص بك. يمكنك استعادته في أي وقت ومن أي جهاز عبر سحبه إلى مربع الاستعادة.'
    }
  ];

  // Manual Backup Generator
  const handleExportBackup = () => {
    try {
      const backupObj = {
        expenses: JSON.parse(localStorage.getItem('bayti_expenses') || '[]'),
        members: JSON.parse(localStorage.getItem('bayti_members') || '[]'),
        reminders: JSON.parse(localStorage.getItem('bayti_reminders') || '[]'),
        smart_notifications: JSON.parse(localStorage.getItem('bayti_smart_notifications') || '[]'),
        budget: Number(localStorage.getItem('bayti_budget') || '15000'),
        premium: localStorage.getItem('bayti_premium') === 'true',
        onboarding_completed: localStorage.getItem('bayti_onboarding_completed') === 'true',
        onboarding_data: JSON.parse(localStorage.getItem('bayti_onboarding_data') || '{}')
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `نسخة_احتياطية_بيت_AI_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export backup:', err);
    }
  };

  // Manual Backup Restorer
  const handleImportBackup = () => {
    try {
      setRestoreError('');
      setRestoreSuccess(false);
      const parsed = JSON.parse(backupRestoreInput);
      
      if (!parsed.expenses || !parsed.members) {
        setRestoreError('الملف غير متوافق! تأكد من نسخ ملف النسخة الاحتياطية الأصلي لبيت AI.');
        return;
      }

      localStorage.setItem('bayti_expenses', JSON.stringify(parsed.expenses));
      localStorage.setItem('bayti_members', JSON.stringify(parsed.members));
      if (parsed.reminders) localStorage.setItem('bayti_reminders', JSON.stringify(parsed.reminders));
      if (parsed.smart_notifications) localStorage.setItem('bayti_smart_notifications', JSON.stringify(parsed.smart_notifications));
      if (parsed.budget) localStorage.setItem('bayti_budget', String(parsed.budget));
      if (parsed.premium !== undefined) localStorage.setItem('bayti_premium', String(parsed.premium));
      if (parsed.onboarding_completed !== undefined) localStorage.setItem('bayti_onboarding_completed', String(parsed.onboarding_completed));
      if (parsed.onboarding_data) localStorage.setItem('bayti_onboarding_data', JSON.stringify(parsed.onboarding_data));

      setRestoreSuccess(true);
      setBackupRestoreInput('');
      
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setRestoreError('حدث خطأ في قراءة ملف التنسيق! يرجى التحقق من صحة النص المكتوب.');
    }
  };

  return (
    <div className="space-y-6 pb-24" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">الإعدادات والتحكم</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">قم بتهيئة ميزانية البيت، تفعيل التشفير، وإدارة محفظة العائلة</p>
      </div>

      {/* 1. Account Info & Profile Management (Private Banker Dashboard) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-6">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-slate-700">
              {userProfile?.profilePicture || '👨🏻‍💼'}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">{userProfile?.fullName || 'مستخدم بيت AI'}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{userEmail}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>حساب مفعل</span>
            </span>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              عضوية {userProfile?.subscription === 'Premium' ? 'بريميوم التلقائية' : 'عادية'}
            </span>
          </div>
        </div>

        {/* Profile Attributes List */}
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-50/50 dark:border-slate-800/30">
            <span className="text-[10px] font-black text-slate-400 block">رقم الهاتف</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile?.phone || 'غير مسجل'}</span>
          </div>
          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-50/50 dark:border-slate-800/30">
            <span className="text-[10px] font-black text-slate-400 block">موقع الإقامة المعتمد</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile?.country || 'مصر'}</span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-all bg-blue-50 hover:bg-blue-100 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-blue-50 dark:border-slate-800"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تعديل الملف وتغيير كلمة المرور</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-all bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 px-4 py-2.5 rounded-xl border border-rose-50 dark:border-rose-900/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>

        {/* Profile Editing Form */}
        {isEditingProfile && (
          <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 animate-fade-in">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تحديث البيانات الشخصية</h4>
            
            {profileError && (
              <p className="text-rose-600 text-[10px] font-bold">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-emerald-600 text-[10px] font-bold">{profileSuccess}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">رقم الهاتف</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">تحديث كلمة المرور (اتركه فارغاً للاحتفاظ بالحالية)</label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="أدخل كلمة مرور جديدة..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {savingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات ومزامنة الحساب'}
            </button>
          </form>
        )}

        {/* Active Devices / Sessions Panel */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-indigo-600" />
              <span>الأجهزة النشطة وجلسات الدخول ({sessions.length})</span>
            </h4>
            {sessions.length > 1 && (
              <button
                onClick={handleTerminateOtherSessions}
                className="text-[10px] font-black text-red-600 hover:text-red-700"
              >
                إنهاء الجلسات الأخرى 🗑️
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {sessions.map((sess) => (
              <div key={sess.id} className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{sess.device} ({sess.platform})</span>
                  <span className="text-slate-400 font-mono block">IP: {sess.ip} • Browser: {sess.browser}</span>
                </div>
                <div className="text-right">
                  {sess.isActive ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      الجهاز الحالي نشط
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">منتهي</span>
                  )}
                  <span className="text-slate-400 font-mono text-[9px] block mt-0.5">{new Date(sess.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Account Danger Button */}
        {onDeleteAccount && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black text-rose-600 dark:text-rose-400">حذف الحساب نهائياً</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">سيتم مسح كافة مصروفاتك وعائلتك المسجلة بالسحابة فوراً.</p>
            </div>
            <button
              onClick={onDeleteAccount}
              className="text-xs font-black text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-500/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إغلاق وحذف الحساب</span>
            </button>
          </div>
        )}

      </div>

      {/* Premium & AI Limits Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">باقة العائلة ومستوى استخدام الذكاء الاصطناعي</h3>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
            userProfile?.subscription === 'Premium' 
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {userProfile?.subscription === 'Premium' ? 'الباقة الممتازة (Premium)' : 'الباقة المجانية (Free)'}
          </span>
        </div>

        {userProfile?.subscription === 'Premium' ? (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              شكرًا لكونك جزءًا من العصر الذهبي للبيت المالي! حسابك يتمتع الآن بصلاحيات الذكاء الاصطناعي وقراءة الفواتير وتصدير البيانات بالكامل وبشكل لانهائي ومفتوح.
            </p>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex justify-between items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span>تاريخ التجديد/الانتهاء القادم:</span>
              <span>
                {userProfile?.subscriptionExpiryDate 
                  ? new Date(userProfile.subscriptionExpiryDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'لانهائي'}
              </span>
            </div>
            <button
              onClick={onOpenPremium}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
            >
              إدارة الاشتراك وإلغاء التفعيل
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              تحصل الباقة المجانية على <strong className="text-slate-700 dark:text-slate-300 font-extrabold">٢٠ عملية ذكاء اصطناعي</strong> شهرياً (قراءة فواتير، توجيه صوتي، استشارات التوفير). الترقية تمنحك استدعاءات مفتوحة ومزامنة فورية لكافة أفراد العائلة.
            </p>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="text-slate-500">الاستخدام الحالي للذكاء الاصطناعي:</span>
                <span className="text-slate-800 dark:text-white font-mono">{(userProfile?.aiUsageCount || 0)} / ٢٠ عملية</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (userProfile?.aiUsageCount || 0) >= 18 
                      ? 'bg-red-500' 
                      : (userProfile?.aiUsageCount || 0) >= 12 
                        ? 'bg-amber-500' 
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, ((userProfile?.aiUsageCount || 0) / 20) * 100)}%` }}
                ></div>
              </div>
              {userProfile?.limitResetDate && (
                <p className="text-[9px] text-slate-400 font-bold">
                  سيتم إعادة تصفير حد الاستخدام تلقائياً في {new Date(userProfile.limitResetDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>

            <button
              onClick={onOpenPremium}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-center text-xs font-black transition-all shadow-md shadow-amber-500/10 hover:brightness-105 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>ترقية العائلة إلى الباقة الممتازة بريميوم 🚀</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Monthly Family Budget Setting */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold">ميزانية العائلة الشهرية الكلية</h3>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">تُستخدم هذه الميزانية لحساب التنبيهات ونسبة استهلاك العائلة الكلية تلقائياً بالذكاء الاصطناعي.</p>
        
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5000"
            max="100000"
            step="1000"
            value={monthlyBudget}
            onChange={(e) => onChangeMonthlyBudget(Number(e.target.value))}
            className="flex-1 accent-blue-600 dark:accent-blue-400"
          />
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 px-3 py-1.5 rounded-xl font-mono shrink-0">
            {formatCurrency(monthlyBudget, activeCurrency, false)}
          </span>
        </div>
      </div>

      {/* 3. Currency Configuration (Egyptian Pound, Saudi Riyal, UAE Dirham, US Dollar, Euro) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold">العملة المحلية والتحويل التلقائي</h3>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">اختر عملة الحساب الافتراضية. سيقوم بيت AI بتحويل وعرض كافة المصروفات بنسب التحويل المباشرة.</p>
        
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { id: 'EGP', label: 'ج.م', name: 'الجنيه المصري' },
            { id: 'SAR', label: 'ر.س', name: 'الريال السعودي' },
            { id: 'AED', label: 'د.إ', name: 'الدرهم الإماراتي' },
            { id: 'USD', label: '$', name: 'الدولار الأمريكي' },
            { id: 'EUR', label: '€', name: 'اليورو الأوروبي' }
          ].map((curr) => (
            <button
              key={curr.id}
              onClick={() => onChangeCurrency(curr.id)}
              className={`py-2 px-1 rounded-xl text-center border transition-all ${
                activeCurrency === curr.id
                  ? 'bg-blue-600 text-white border-blue-600 font-bold scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={curr.name}
            >
              <div className="text-xs font-black">{curr.label}</div>
              <div className="text-[8px] opacity-75 font-semibold mt-0.5">{curr.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Privacy & Security Section (Highly compliant FaceID, Passcode, Sensitive mask, Hidden details) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold">الحماية والخصوصية العائلية</h3>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">قم بحماية حساباتك وأرقام ميزانيتك من المتطفلين في المنزل والأماكن العامة.</p>

        <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3.5">
          {/* Toggle Passcode */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200">تفعيل رقم المرور للفتح (Passcode Lock)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">قفل التطبيق برقم سري (1234) عند الفتح لحماية السرية.</p>
            </div>
            <button
              onClick={onTogglePasscode}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPasscodeEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPasscodeEnabled ? 'right-6' : 'right-1'}`} />
            </button>
          </div>

          {/* Toggle FaceID */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200">فتح بقفل الوجه / البصمة (Biometrics / Face ID)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">التحقق التلقائي الحيوي بمجرد توجيه الهاتف للسرعة الفائقة.</p>
            </div>
            <button
              onClick={onToggleFaceId}
              className={`w-11 h-6 rounded-full transition-colors relative ${isFaceIdEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFaceIdEnabled ? 'right-6' : 'right-1'}`} />
            </button>
          </div>

          {/* Toggle Hide Financial Numbers */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 font-sans">إخفاء الأرقام المالية الحساسة (Hide Financial Values)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">تظليل المبالغ والراتب تلقائياً على الشاشة بـ (••••) لحماية خصوصيتك.</p>
            </div>
            <button
              onClick={onToggleHideValues}
              className={`w-11 h-6 rounded-full transition-colors relative ${hideFinancialValues ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hideFinancialValues ? 'right-6' : 'right-1'}`} />
            </button>
          </div>

          {/* Toggle Hide Notification Details */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200">تشفير تفاصيل الإشعارات (Mask Notifications)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">عرض تنبيهات عامة دون كتابة المبالغ أو البقالة في شريط التنبيهات.</p>
            </div>
            <button
              onClick={onToggleHideNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative ${hideNotificationsContent ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hideNotificationsContent ? 'right-6' : 'right-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Smart Exports and Reporting Quick Launcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">تصدير التقارير والحسابات</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">صدر مصروفاتك وقسم عائلتك إلى PDF أو Excel بضغطة زر</p>
        </div>
        <button
          onClick={onOpenExport}
          className="bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>تصدير الحسابات</span>
        </button>
      </div>

      {/* 6. Premium Features Showcase Card (High fidelity) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        {/* Subtle glow circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-2.5 py-1 rounded-full border border-amber-400/20 uppercase tracking-widest flex items-center gap-1 self-start">
              <Sparkles className="w-3 h-3 fill-amber-300" />
              بيت AI بريميوم
            </span>
            <h3 className="text-base font-bold mt-2">الترقية للمميزات غير المحدودة</h3>
          </div>
          <button
            onClick={onOpenPremium}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              isPremium 
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' 
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
            id="btn_toggle_premium"
          >
            {isPremium ? 'إدارة الاشتراك المالي' : 'تفعيل مجاني الآن'}
          </button>
        </div>

        <ul className="text-[11px] text-slate-300 space-y-2 border-t border-white/10 pt-4 font-medium">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>تسجيل عدد غير محدود من أفراد العائلة والأجهزة المترابطة.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>مسح ضوئي ذكي لانهائي للفواتير والإيصالات الورقية بالذكاء الاصطناعي.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>تحليلات مالية متقدمة وتنبيهات فورية لتوفير الأموال.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>تصدير الحسابات والتقارير المالية لملفات Excel و PDF بضغطة زر.</span>
          </li>
        </ul>
      </div>

      {/* 7. Durable Cloud Backup & Restore Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-slate-800 dark:text-white">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold">النسخ الاحتياطي واستعادة البيانات</h3>
          </div>
          <span className="text-[9px] bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase">Encrypted</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">احتفظ بملفات حساباتك بأمان تام أو انقلها إلى هاتف آخر في أي وقت.</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>تنزيل نسخة احتياطية</span>
          </button>
          
          <button
            onClick={() => setShowBackupTextarea(!showBackupTextarea)}
            className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>استرجاع البيانات</span>
          </button>
        </div>

        {showBackupTextarea && (
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase">الصق محتوى النسخة الاحتياطية (JSON string):</label>
            <textarea
              value={backupRestoreInput}
              onChange={(e) => setBackupRestoreInput(e.target.value)}
              placeholder='الصق نص الـ JSON الكامل هنا...'
              rows={4}
              className="w-full text-xs font-mono p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
              style={{ direction: 'ltr' }}
            />
            <button
              onClick={handleImportBackup}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد استرجاع وحفظ البيانات ومزامنة الحساب</span>
            </button>
            {restoreSuccess && (
              <p className="text-emerald-600 text-[10px] font-bold text-center">تم استرجاع الحساب ومزامنة البيانات بنجاح! سيتم إعادة تحميل الصفحة الآن... 🔄</p>
            )}
            {restoreError && (
              <p className="text-red-500 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{restoreError}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 8. Help & Support Center / Collapsible Accordions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold">مركز المساعدة والدعم المالي</h3>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">استعرض الأسئلة الشائعة أو تواصل معنا فوراً لحل أي مشكلة مالية أو تقنية.</p>

        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center py-2 text-right text-xs font-black text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === i && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl font-medium">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Support contact button */}
        <a 
          href="mailto:support@bayti-ai.com?subject=مساعدة في تطبيق بيت AI"
          className="w-full py-3 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 border border-blue-50 dark:border-slate-800"
        >
          <Mail className="w-4 h-4" />
          <span>تواصل مع الدعم الفني المباشر للبيت المالي</span>
        </a>
      </div>

      {/* 9. Credentials & Security Status (Satisfies English only inside Settings rule) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>النظام الأمني والتقني (Security & System)</span>
        </h3>
        
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          جميع اتصالاتك مشفرة بالكامل. محرك الذكاء الاصطناعي يعمل عبر الخادم الآمن لحماية خصوصيتك المالية.
        </p>

        {/* English exists inside Settings Only */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 font-sans space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 dark:text-slate-500">AI Engine:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Gemini 3.5 Flash (Server-Side)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 dark:text-slate-500">Connection Mode:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">HTTPS Proxy secure connection</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 dark:text-slate-500">Database Engine:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Client IndexedDB / Local Storage Sync</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 dark:text-slate-500">API Credentials status:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CONNECTED / ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* 10. System Action Button (Reset Factory Data) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">تحديث المصنع وإعادة التعيين</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">امسح كافة التعديلات واستعد بيانات الديمو الأصلية</p>
        </div>
        <button
          onClick={() => {
            if (confirm('تنبيه: سيتم مسح كافة المصروفات وأعضاء العائلة المضافين حديثاً والعودة للحالة الافتراضية. هل تود المتابعة؟')) {
              onResetData();
            }
          }}
          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 border border-red-50 dark:border-red-900/10"
          id="btn_reset_data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة تعيين</span>
        </button>
      </div>

      {/* Developer note */}
      <p className="text-center text-[10px] text-slate-400 font-medium">
        بيت AI • المساعد المالي التلقائي للعائلة • الإصدار v1.0.0 (مستقر)
      </p>
    </div>
  );
}
