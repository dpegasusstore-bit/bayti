import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Mail, Lock, User, Phone, MapPin, Coins, 
  ShieldAlert, ShieldCheck, ArrowRight, ArrowLeft, Eye, EyeOff,
  CheckCircle2, Globe, HelpCircle, Loader2, Camera
} from 'lucide-react';
import { api } from '../services/api';

interface UserAuthProps {
  onLoginSuccess: (token: string, user: any, profile: any, onboarding: any, settings?: any) => void;
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

export default function UserAuth({ onLoginSuccess }: UserAuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>('login');
  
  // Loading & Message states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Show password toggle
  const [showPass, setShowPass] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Fields
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('مصر');
  const [currency, setCurrency] = useState('EGP');
  const [avatar, setAvatar] = useState('👨🏻‍💼');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Token Verification
  const [verificationToken, setVerificationToken] = useState('');
  const [resetToken, setResetToken] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleCountryChange = (cName: string) => {
    setCountry(cName);
    const found = COUNTRIES.find(c => c.name === cName);
    if (found) {
      setCurrency(found.currency);
    }
  };

  // 1. Google One-Tap Sign In (Simulation)
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Create a simulated premium Cairo family user
      const res = await api.oauthLogin({
        email: 'mona.financial@gmail.com',
        fullName: 'منى أحمد',
        provider: 'google',
        profilePicture: '👩🏻‍⚕️'
      });
      if (res.success) {
        setSuccess('تم تسجيل الدخول عبر Google بنجاح!');
        setTimeout(() => {
          onLoginSuccess(res.token, res.user, res.profile, res.onboarding, res.settings);
        }, 1000);
      } else {
        setError(res.error || 'فشل تسجيل الدخول عبر Google.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email, password, rememberMe });
      if (res.success) {
        setSuccess('تم تسجيل الدخول بنجاح! جاري تحميل ميزانيتك...');
        setTimeout(() => {
          onLoginSuccess(res.token, res.user, res.profile, res.onboarding, res.settings);
        }, 1200);
      } else {
        if (res.notVerified) {
          setError(res.error);
          setView('verify');
        } else {
          setError(res.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
      }
    } catch (err) {
      setError('عذراً، فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Register Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!fullName || !email || !password || !confirmPassword) {
      setError('يرجى ملء كافة الحقول الأساسية المطلوبة.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (password.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف لحماية حسابك المالي.');
      return;
    }

    if (!acceptTerms) {
      setError('يجب قبول سياسة الخصوصية والشروط والأحكام للاستفادة من خدماتنا.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        email,
        password,
        phone,
        country,
        currency,
        profilePicture: avatar,
        acceptTerms
      });

      if (res.success) {
        setSuccess('تم إنشاء حسابك المالي العائلي بنجاح! تم إرسال رمز تفعيل للبريد.');
        // Save the verification token for easy automatic mock verification in the UI
        if (res.verificationToken) {
          setVerificationToken(res.verificationToken);
        }
        setTimeout(() => {
          setView('verify');
          setError('');
        }, 1500);
      } else {
        setError(res.error || 'حدث خطأ أثناء تسجيل الحساب.');
      }
    } catch (err) {
      setError('فشلت عملية إنشاء الحساب بسبب مشكلة اتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Code
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!verificationToken) {
      setError('يرجى إدخال رمز التحقق.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyEmail(verificationToken);
      if (res.success) {
        setSuccess('تم تفعيل حسابك بنجاح! جاري توجيهك لتسجيل الدخول.');
        setTimeout(() => {
          setView('login');
          clearMessages();
        }, 1500);
      } else {
        setError(res.error || 'الرمز غير صحيح أو منتهي الصلاحية.');
      }
    } catch (err) {
      setError('فشل التفعيل لعدم استجابة الخادم.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Resend verification
  const handleResendToken = async () => {
    clearMessages();
    if (!email) {
      setError('يرجى كتابة بريدك الإلكتروني أولاً.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resendVerification(email);
      if (res.success) {
        setSuccess('تم إعادة إرسال رمز التفعيل لبريدك الإلكتروني.');
        if (res.token) {
          setVerificationToken(res.token); // auto fill for simulator ease
        }
      } else {
        setError(res.error || 'فشل إرسال الرمز.');
      }
    } catch (err) {
      setError('حدث خطأ بالشبكة.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setError('يرجى إدخال بريدك الإلكتروني.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setSuccess('تم إرسال رمز إعادة تعيين كلمة المرور بنجاح لبريدك.');
        if (res.token) {
          setResetToken(res.token); // auto fill for simulator ease
        }
        setTimeout(() => {
          setView('reset');
          clearMessages();
        }, 1800);
      } else {
        setError(res.error || 'البريد غير مسجل.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetToken || !password) {
      setError('يرجى ملء الرمز وكلمة المرور الجديدة.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token: resetToken, newPassword: password });
      if (res.success) {
        setSuccess('تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول بالبيانات الجديدة.');
        setTimeout(() => {
          setView('login');
          clearMessages();
        }, 1800);
      } else {
        setError(res.error || 'الرمز منتهي الصلاحية أو غير صحيح.');
      }
    } catch (err) {
      setError('خطأ بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 relative overflow-x-hidden font-sans select-none" dir="rtl">
      
      {/* Background elegant floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-400/10 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Brand */}
      <div className="flex justify-center pt-8 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/10">
            بيت
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-white tracking-wide mt-2">Bayti AI</span>
        </div>
      </div>

      {/* Central form container */}
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col justify-center py-8 relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          
          {/* Alerts */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl p-4 mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl p-4 mb-6 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* VIEW 1: LOGIN */}
            {view === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">أهلاً بك في بيتك المالي 👋</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">سجل الدخول لإدارة ومراقبة مصاريف عائلتك بذكاء</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">كلمة المرور</label>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-[11px] font-black text-blue-600 hover:text-blue-700"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3.5 pr-11 pl-11 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember" className="text-xs font-bold text-slate-500 dark:text-slate-400">تذكرني على هذا الجهاز</label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الدخول'}
                  </button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase">أو تابع عبر</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                </div>

                {/* Google Sign-in */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887C18.2 16.632 15.657 18 12.24 18c-3.866 0-7-3.134-7-7s3.134-7 7-7c1.785 0 3.407.674 4.636 1.774l3.125-3.125C17.923 1.096 15.22 0 12.24 0c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.808 0 10.74-4.172 10.74-11 0-.743-.075-1.455-.213-2.143H12.24z"/>
                  </svg>
                  <span>متابعة باستخدام Google</span>
                </button>

                <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 pt-2">
                  ليس لديك حساب مالي؟{' '}
                  <button
                    onClick={() => { setView('register'); clearMessages(); }}
                    className="text-blue-600 hover:text-blue-700 underline font-black"
                  >
                    إنشاء حساب جديد
                  </button>
                </p>
              </motion.div>
            )}

            {/* VIEW 2: REGISTER */}
            {view === 'register' && (
              <motion.div
                key="register-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">تأسيس بيت مالي عائلي 🌸</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">ابدأ بتسجيل حسابك الشخصي لنبدأ ميزانيتكم</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5 max-h-[420px] overflow-y-auto px-1">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">الاسم الكامل *</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="اكتب اسمك الكامل"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">البريد الإلكتروني *</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">كلمة المرور *</label>
                      <div className="relative">
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-9 pl-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">تأكيد المرور *</label>
                      <div className="relative">
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-9 pl-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">بلد الإقامة *</label>
                      <div className="relative">
                        <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-9 pl-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none transition-all appearance-none"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">العملة الافتراضية *</label>
                      <div className="relative">
                        <Coins className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          disabled
                          value={currency}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-400 rounded-2xl py-3 pr-9 pl-3 text-xs font-black text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">رقم الهاتف (اختياري)</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 000 0000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Profile Avatar Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>اختر صورتك التعبيرية (الملف الشخصي)</span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                      {AVATARS.map(av => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border shrink-0 transition-all ${
                            avatar === av 
                              ? 'bg-blue-50 border-blue-600 scale-105 shadow-sm' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <label htmlFor="terms" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                      أوافق تماماً على <span className="text-blue-600 underline cursor-pointer font-black">شروط الخدمة</span> و <span className="text-blue-600 underline cursor-pointer font-black">سياسة الخصوصية وأمان البيانات</span> لبيت AI.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء حساب جديد وتفعيل البيت المالي'}
                  </button>
                </form>

                <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 pt-1">
                  لديك حساب مالي بالفعل؟{' '}
                  <button
                    onClick={() => { setView('login'); clearMessages(); }}
                    className="text-blue-600 hover:text-blue-700 underline font-black"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </motion.div>
            )}

            {/* VIEW 3: EMAIL VERIFICATION */}
            {view === 'verify' && (
              <motion.div
                key="verify-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">تنشيط حسابك المالي 📧</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">تم إرسال رمز التفعيل بنجاح للبريد الإلكتروني التالي: <span className="text-blue-600 font-bold font-mono">{email}</span></p>
                </div>

                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">رمز المحاكاة التلقائي (لسهولة الاختبار):</span>
                    <span className="text-base font-black tracking-widest text-emerald-600 font-mono select-all">
                      {verificationToken || 'سيتولد عند التسجيل'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">أدخل رمز التفعيل المالي</label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        placeholder="الصق الرمز المشفر هنا..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-emerald-500 rounded-2xl py-3.5 pr-11 pl-4 text-center text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد التفعيل وبدء الاستخدام'}
                  </button>
                </form>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => { setView('login'); clearMessages(); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>الرجوع للدخول</span>
                  </button>

                  <button
                    onClick={handleResendToken}
                    disabled={loading}
                    className="text-xs font-black text-blue-600 hover:text-blue-700"
                  >
                    إعادة إرسال الرمز
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 4: FORGOT PASSWORD */}
            {view === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">نسيت رمز الدخول المالي؟ 🔐</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">أدخل بريدك الإلكتروني وسنرسل لك رمزاً مشفراً لاستعادة كلمة المرور</p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">بريدك الإلكتروني المسجل</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'طلب رمز الاستعادة'}
                  </button>
                </form>

                <button
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 pt-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>الرجوع لتسجيل الدخول</span>
                </button>
              </motion.div>
            )}

            {/* VIEW 5: RESET PASSWORD */}
            {view === 'reset' && (
              <motion.div
                key="reset-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">إعادة تعيين كلمة المرور 🔐</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">أدخل رمز استعادة المرور المدون بالبريد وكلمة المرور الجديدة</p>
                </div>

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">رمز الاستعادة المسجل (تلقائي للمحاكاة):</span>
                    <span className="text-base font-black tracking-widest text-indigo-600 font-mono select-all">
                      {resetToken || 'سيصلك بالبريد'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">رمز الاستعادة</label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="أدخل الرمز المستلم"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3.5 text-center text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أدخل ٦ أحرف على الأقل..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد وحفظ كلمة المرور'}
                  </button>
                </form>

                <button
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 pt-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>إلغاء والرجوع للدخول</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 py-6 relative z-10 flex items-center justify-center gap-1">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>جميع حسابات عائلة بيت AI مؤمنة بتشفير ثنائي الأبعاد ومحمية طبقاً للمصرفية المفتوحة.</span>
      </div>

    </div>
  );
}
