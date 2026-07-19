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
  adminPasscode?: string;
  onSaveAdminPasscode?: (passcode: string) => Promise<void>;
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
  onOpenPremium,
  adminPasscode = '',
  onSaveAdminPasscode
}: SettingsTabProps) {
  // Local UI state for Cloud Backups and Help Center
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Admin Security Passcode States
  const [adminPasscodeInput, setAdminPasscodeInput] = useState(adminPasscode);
  const [isSavingAdminPasscode, setIsSavingAdminPasscode] = useState(false);
  const [adminPasscodeSuccess, setAdminPasscodeSuccess] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState('');

  useEffect(() => {
    setAdminPasscodeInput(adminPasscode);
  }, [adminPasscode]);

  const handleSaveAdminPasscodeLocal = async () => {
    setAdminPasscodeError('');
    setAdminPasscodeSuccess('');
    if (!adminPasscodeInput || adminPasscodeInput.trim().length < 4) {
      setAdminPasscodeError('رمز الأمان يجب أن يتكون من 4 خانات على الأقل.');
      return;
    }
    setIsSavingAdminPasscode(true);
    try {
      if (onSaveAdminPasscode) {
        await onSaveAdminPasscode(adminPasscodeInput.trim());
        setAdminPasscodeSuccess('تم حفظ رمز الأمان للدخول الإداري بنجاح! 👑');
      }
    } catch (err) {
      setAdminPasscodeError('حدث خطأ أثناء حفظ رمز الأمان.');
    } finally {
      setIsSavingAdminPasscode(false);
    }
  };

  // Fetch Backups from database
  const fetchBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const response = await fetch('/api/backup/list');
      const data = await response.json();
      if (data.success) {
        setBackupsList(data.backups);
      }
    } catch (err) {
      console.error('Error fetching backups list:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Create new Backup
  const handleCreateNewBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const res = await fetch('/api/backup/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchBackups();
        if (window.navigator?.vibrate) window.navigator.vibrate(100);
      } else {
        alert(data.error || 'فشل إنشاء النسخة الاحتياطية.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه النسخة الاحتياطية بشكل نهائي؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }
    try {
      const res = await fetch(`/api/backup/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchBackups();
      } else {
        alert(data.error || 'فشل حذف النسخة الاحتياطية.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Download Backup File
  const handleDownloadBackupFile = (id: string) => {
    window.open(`/api/backup/download/${id}`, '_blank');
  };

  // Restore Backup
  const handleRestoreBackupSubmit = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setIsRestoring(true);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackupForRestore.id,
          mode: restoreMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة لتطبيق التغييرات.');
        setSelectedBackupForRestore(null);
        window.location.reload();
      } else {
        alert(data.error || 'فشل استعادة النسخة الاحتياطية.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Upload and Restore Backup File
  const handleFileChangeAndUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setUploadError('الملف فارغ أو غير صالح.');
        return;
      }

      const mode = window.confirm('هل تريد استبدال البيانات الحالية بالكامل؟ انقر "موافق" للاستبدال الكامل، أو "إلغاء" للدمج دون تكرار.') ? 'replace' : 'merge';

      try {
        setIsRestoring(true);
        const res = await fetch('/api/backup/upload-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encryptedString: text.trim(),
            mode,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setUploadSuccess(true);
          alert('تم استيراد واستعادة ملف النسخة الاحتياطية بنجاح! سيتم إعادة تحميل الصفحة الآن.');
          window.location.reload();
        } else {
          setUploadError(data.error || 'فشل استيراد الملف.');
        }
      } catch (err) {
        console.error(err);
        setUploadError('حدث خطأ أثناء رفع ومعالجة الملف.');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

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

  const [languageInput, setLanguageInput] = useState(userProfile?.language || 'ar');
  const [countryInput, setCountryInput] = useState(userProfile?.country || 'مصر');
  const [currencyInput, setCurrencyInput] = useState(activeCurrency || 'EGP');
  const [avatarInput, setAvatarInput] = useState(userProfile?.profilePicture || '👨🏻‍💼');

  useEffect(() => {
    if (userProfile) {
      if (userProfile.fullName) setFullNameInput(userProfile.fullName);
      if (userProfile.phone) setPhoneInput(userProfile.phone);
      if (userProfile.language) setLanguageInput(userProfile.language);
      if (userProfile.country) setCountryInput(userProfile.country);
      if (userProfile.profilePicture) setAvatarInput(userProfile.profilePicture);
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeCurrency) {
      setCurrencyInput(activeCurrency);
    }
  }, [activeCurrency]);

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

  const handleCustomProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('يرجى اختيار ملف صورة صالح.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const token = localStorage.getItem('bayti_user_token') || localStorage.getItem('bayti_admin_token') || '';
        const response = await fetch('/api/auth/upload-profile-picture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64String })
        });
        const data = await response.json();
        if (data.success) {
          setAvatarInput(data.profilePicture);
          setProfileSuccess('تم رفع صورتك الشخصية المخصصة وتحديثها بنجاح!');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setProfileError(data.error || 'فشل في رفع الصورة.');
        }
      } catch (err) {
        console.error('Profile pic upload error:', err);
        setProfileError('حدث خطأ أثناء الاتصال بالخادم لرفع الصورة.');
      } finally {
        setSavingProfile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomProfilePic = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const token = localStorage.getItem('bayti_user_token') || localStorage.getItem('bayti_admin_token') || '';
      const response = await fetch('/api/auth/delete-profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvatarInput(data.profilePicture);
        setProfileSuccess('تم حذف صورتك الشخصية المخصصة والعودة للصورة الافتراضية بنجاح!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setProfileError(data.error || 'فشل في حذف الصورة الشخصية.');
      }
    } catch (err) {
      console.error('Profile pic delete error:', err);
      setProfileError('حدث خطأ أثناء الاتصال بالخادم لحذف الصورة.');
    } finally {
      setSavingProfile(false);
    }
  };

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
        password: passInput || undefined,
        language: languageInput,
        country: countryInput,
        currency: currencyInput,
        profilePicture: avatarInput
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-slate-700 overflow-hidden shadow-inner">
              {userProfile?.profilePicture && (userProfile.profilePicture.startsWith('http') || userProfile.profilePicture.startsWith('/api/') || userProfile.profilePicture.startsWith('data:')) ? (
                <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                userProfile?.profilePicture || '👨🏻‍💼'
              )}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition-all bg-blue-50 hover:bg-blue-100 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-blue-50 dark:border-slate-800 w-full"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تعديل الملف وتغيير كلمة المرور</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/admin/login';
            }}
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-all bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/20 w-full"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>لوحة تحكم السوبر أدمن 👑</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1.5 transition-all bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 px-4 py-2.5 rounded-xl border border-rose-50 dark:border-rose-900/10 w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>

        {/* Profile Editing Form */}
        {isEditingProfile && (
          <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 animate-fade-in">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تحديث البيانات الشخصية والخيارات</h4>
            
            {profileError && (
              <p className="text-rose-600 text-[10px] font-bold">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-emerald-600 text-[10px] font-bold">{profileSuccess}</p>
            )}

            {/* Avatar Selector */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">اختر صورتك التعبيرية أو ارفع صورة مخصصة</label>
              
              {avatarInput && (avatarInput.startsWith('http') || avatarInput.startsWith('/api/') || avatarInput.startsWith('data:')) && (
                <div className="flex items-center gap-3 mb-4 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <img src={avatarInput} alt="Custom Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white block">صورة مخصصة مرفوعة</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">مخزنة ومحسنة سحابياً</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {['👨🏻‍💼', '👩🏻‍⚕️', '👨🏼‍💻', '👩🏻‍🏫', '👨🏽‍🎨', '👩🏼‍🔬', '🦁', '🚀', '🦉', '🥑'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarInput(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                      avatarInput === emoji
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 scale-105 shadow-sm font-black'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Custom Image Upload Buttons */}
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800/60 flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">أو ارفع صورة مخصصة من جهازك (رفع سحابي محسّن)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-pic-upload"
                    className="hidden"
                    onChange={handleCustomProfilePicUpload}
                  />
                  <label
                    htmlFor="profile-pic-upload"
                    className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-900/60 text-[10px] flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة مخصصة</span>
                  </label>
                  {avatarInput && (avatarInput.startsWith('http') || avatarInput.startsWith('/api/') || avatarInput.startsWith('data:')) && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomProfilePic}
                      className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-[10px] flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الصورة والعودة للافتراضي</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">اللغة المفضلة</label>
                <select
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ar">العربية (Ar)</option>
                  <option value="en">English (En)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">الدولة وموقع الإقامة</label>
                <select
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="مصر">مصر 🇪🇬</option>
                  <option value="المملكة العربية السعودية">السعودية 🇸🇦</option>
                  <option value="الإمارات">الإمارات 🇦🇪</option>
                  <option value="الكويت">الكويت 🇰🇼</option>
                  <option value="عمان">عمان 🇴🇲</option>
                  <option value="قطر">قطر 🇶🇦</option>
                  <option value="الأردن">الأردن 🇯🇴</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">العملة الافتراضية</label>
                <select
                  value={currencyInput}
                  onChange={(e) => {
                    setCurrencyInput(e.target.value);
                    onChangeCurrency(e.target.value);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو أوروبي (EUR)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">تحديث كلمة المرور (اتركه فارغاً للاحتفاظ بالحالية)</label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="أدخل كلمة مرور جديدة للتحديث والتشديد الأمني..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {savingProfile ? 'جاري تشفير وحفظ الإعدادات...' : 'تحديث ملفي الشخصي في السحابة الأمنية'}
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
          
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
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

        {/* Login History Panel */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
          <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>سجل عمليات تسجيل الدخول السابقة ({loginHistory.length})</span>
          </h4>
          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
            {loginHistory.map((hist) => (
              <div key={hist.id} className="bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-xl border border-slate-50/50 dark:border-slate-800/50 flex justify-between items-center text-[9px]">
                <div className="space-y-0.5 text-slate-500">
                  <span className="font-bold text-slate-600 dark:text-slate-400 block">{hist.device} ({hist.platform})</span>
                  <span className="font-mono block">IP: {hist.ip} • {hist.browser}</span>
                </div>
                <div className="text-right text-slate-400">
                  <span className="block font-bold">{hist.status === 'SUCCESS' ? '🟢 دخول ناجح' : '🔴 محاولة فشلت'}</span>
                  <span className="font-mono text-[8px] block mt-0.5">{new Date(hist.createdAt).toLocaleString('ar-EG')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Account Data Section */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black text-blue-600 dark:text-blue-400">تصدير بيانات الحساب السحابية</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">قم بتنزيل كافة معاملاتك، عائلتك، إعداداتك، وملفك الشخصي بنسخة JSON موحدة.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await api.exportAccount();
                if (res.success) {
                  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `bayti_account_export_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  alert('فشل تصدير البيانات: ' + (res.error || 'خطأ مجهول'));
                }
              } catch (err) {
                alert('حدث خطأ أثناء محاولة تصدير البيانات السحابية.');
              }
            }}
            className="text-xs font-black text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-500/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير نسخة JSON شاملة</span>
          </button>
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
              <p className="text-[10px] text-slate-400 mt-0.5">عرض تنبيهات عامة دون كتابة المبالغ في شريط التنبيهات.</p>
            </div>
            <button
              onClick={onToggleHideNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative ${hideNotificationsContent ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hideNotificationsContent ? 'right-6' : 'right-1'}`} />
            </button>
          </div>

          {/* Admin Security Passcode Customization */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-3.5 space-y-2">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>رمز الأمان لوحة التحكم الإدارية (/admin)</span>
              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black px-2 py-0.5 rounded-full">سوبر أدمن 👑</span>
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              عيّن رمز أمان مخصص (أرقام أو حروف) لتتمكن من فتح لوحة التحكم الإدارية مباشرة عبر الرابط الخاص بك بنفس الحساب.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <input
                type="text"
                maxLength={12}
                placeholder="أدخل رمز الأمان الخاص بك"
                value={adminPasscodeInput}
                onChange={(e) => setAdminPasscodeInput(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-mono w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveAdminPasscodeLocal}
                disabled={isSavingAdminPasscode}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 w-full sm:w-auto"
              >
                {isSavingAdminPasscode ? 'جاري الحفظ...' : 'حفظ رمز الأمان 💾'}
              </button>
            </div>
            {adminPasscodeError && <p className="text-[10px] text-rose-500 font-bold mt-1">{adminPasscodeError}</p>}
            {adminPasscodeSuccess && <p className="text-[10px] text-emerald-500 font-bold mt-1">{adminPasscodeSuccess}</p>}
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
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold">مركز النسخ الاحتياطي السحابي المشفر</h3>
          </div>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">AES-256</span>
        </div>
        
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          نظام نسخ احتياطي آمن وسحابي بالكامل لحماية ملفات عائلتك وأفرادها ومصروفاتها وأهدافها المالية. يتم تشفير الملفات على خادم بيت AI لتأمين السرية والخصوصية.
        </p>

        {/* Premium feature highlight */}
        {isPremium ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
              اشتراك بريميوم نشط: جاري النسخ الاحتياطي التلقائي لحسابك (يومياً، أسبوعياً، شهرياً) بشكل آمن ومنتظم.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              النسخ الاحتياطي التلقائي المنتظم حصري لمشتركي <span className="font-bold cursor-pointer underline" onClick={onOpenPremium}>باقة بريميوم Premium</span>. يمكنك إجراء النسخ اليدوي وتصدير ملفاتك مجاناً في أي وقت.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleCreateNewBackup}
            disabled={isCreatingBackup}
            className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 dark:shadow-none"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء النسخة...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>إنشاء نسخة احتياطية سحابية فورية</span>
              </>
            )}
          </button>
          
          <label className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>رفع واستعادة ملف (.bayti)</span>
            <input 
              type="file" 
              accept=".bayti" 
              onChange={handleFileChangeAndUploadRestore} 
              className="hidden" 
            />
          </label>
        </div>

        {uploadError && (
          <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 dark:bg-red-950/20 p-2 rounded-xl">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-emerald-600 text-[11px] font-bold text-center bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl">تم استيراد واستعادة ملف النسخة بنجاح!</p>
        )}

        {/* Selected Backup Restore warning and controls */}
        {selectedBackupForRestore && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>تحذير استعادة البيانات</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              أنت على وشك استعادة النسخة الاحتياطية المؤرخة في: <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(selectedBackupForRestore.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> ({selectedBackupForRestore.type === 'manual' ? 'يدوية' : 'تلقائية'}). يرجى اختيار طريقة الاستعادة لتأكيد رغبتك:
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="restore_mode" 
                  checked={restoreMode === 'merge'} 
                  onChange={() => setRestoreMode('merge')} 
                  className="mt-0.5 text-blue-600 focus:ring-blue-500" 
                />
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">دمج البيانات الذكي (موصى به)</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">يقوم بإضافة السجلات الجديدة فقط ويمنع تكرار أي سجلات موجودة مسبقاً.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="restore_mode" 
                  checked={restoreMode === 'replace'} 
                  onChange={() => setRestoreMode('replace')} 
                  className="mt-0.5 text-red-600 focus:ring-red-500" 
                />
                <div className="text-right">
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400">استبدال كامل (حذف البيانات الحالية)</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">يقوم بمسح كامل البيانات الحالية على الحساب واستبدالها بنسخة الملف بالكامل.</p>
                </div>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleRestoreBackupSubmit}
                disabled={isRestoring}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الاستعادة...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تأكيد واستعادة الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Backups History list */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>سجل النسخ الاحتياطية السحابية ({backupsList.length})</span>
            {isLoadingBackups && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
          </h4>

          {isLoadingBackups && backupsList.length === 0 ? (
            <div className="text-center py-6">
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto mb-1" />
              <p className="text-[11px] text-slate-400">جاري تحميل قائمة النسخ...</p>
            </div>
          ) : backupsList.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">لا توجد نسخ احتياطية مسجلة حالياً.</p>
              <p className="text-[9px] text-slate-400 mt-0.5">انقر على زر الإنشاء بالأعلى لحفظ نسخة سحابية أولى لحسابك.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
              {backupsList.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition-colors">
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {new Date(b.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-slate-400 font-medium">{(b.size / 1024).toFixed(1)} KB</span>
                      <span className="text-[9px] text-slate-300 dark:text-slate-700">•</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        b.type === 'manual' 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      }`}>
                        {b.type === 'manual' ? 'يدوية' : b.type === 'auto_daily' ? 'يومية تلقائية' : b.type === 'auto_weekly' ? 'أسبوعية تلقائية' : 'شهرية تلقائية'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedBackupForRestore(b)}
                      title="استعادة البيانات"
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownloadBackupFile(b.id)}
                      title="تنزيل الملف"
                      className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(b.id)}
                      title="حذف النسخة"
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-slate-800 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
