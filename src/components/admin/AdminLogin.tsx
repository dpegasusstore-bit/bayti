/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ShieldAlert, Sparkles, LogIn, ChevronLeft, HelpCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (adminEmail: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@bayti-ai.com');
  const [password, setPassword] = useState('Admin@Bayti2026');
  const [step, setStep] = useState<'login' | '2fa' | 'forgot'>('login');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email !== 'admin@bayti-ai.com' || password !== 'Admin@Bayti2026') {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('2fa');
    }, 800);
  };

  const handle2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (twoFactorCode !== '123456') {
      setError('رمز التحقق الثنائي (2FA) غير صحيح. استخدم الرمز التجريبي 123456.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Save session in local storage
      localStorage.setItem('bayti_admin_session', JSON.stringify({
        email,
        loggedInAt: new Date().toISOString(),
        role: 'SuperAdmin'
      }));
      onLoginSuccess(email);
    }, 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى البريد المدخل.');
      setTimeout(() => {
        setStep('login');
        setSuccessMsg('');
      }, 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none" dir="rtl">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800 rounded-2xl border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/5">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">لوحة تحكم بيت AI الإدارية</h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">نظام الإدارة الآمن للبوابة المالية لعائلات بيت AI</p>
        </div>

        {/* Info Credentials Box */}
        {step === 'login' && (
          <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-2xl p-3.5 mb-6 text-xs text-indigo-200 leading-relaxed font-medium">
            <div className="flex items-center gap-2 mb-1.5 text-indigo-300 font-bold">
              <KeyRound className="w-4 h-4" />
              <span>بيانات الدخول التجريبية الخاصة بالمالك:</span>
            </div>
            <div>البريد: <span className="font-mono text-indigo-400 selection:bg-indigo-900">admin@bayti-ai.com</span></div>
            <div>كلمة المرور: <span className="font-mono text-indigo-400 selection:bg-indigo-900">Admin@Bayti2026</span></div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-xs rounded-2xl p-3 mb-6 flex items-start gap-2.5 font-bold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 text-xs rounded-2xl p-3 mb-6 flex items-start gap-2.5 font-bold">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step: Login */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">البريد الإلكتروني للإدارة</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono transition-all"
                  placeholder="admin@bayti-ai.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-300">كلمة المرور</label>
                <button
                  type="button"
                  onClick={() => setStep('forgot')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? 'جاري التحقق...' : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول كمسؤول</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step: 2FA */}
        {step === '2fa' && (
          <form onSubmit={handle2faSubmit} className="space-y-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-2 text-center">
              <span className="text-xs text-slate-400 block mb-1">الرمز السري لـ 2FA (أمان إضافي):</span>
              <span className="text-lg font-black tracking-widest text-emerald-400 font-mono">123456</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 text-center">
                أدخل رمز المصادقة الثنائية (2FA)
              </label>
              <div className="relative">
                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl py-3.5 pr-11 pl-4 text-center font-mono text-lg tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="000000"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                تم إرسال رمز التحقق الثنائي إلى تطبيق المصادقة الخاص بالمسؤول.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 px-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span>رجوع</span>
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
              >
                {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز والدخول'}
              </button>
            </div>
          </form>
        )}

        {/* Step: Forgot Password */}
        {step === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-xs text-slate-400 text-center leading-relaxed mb-4">
              أدخل بريدك الإلكتروني المعتمد لإعادة تعيين كلمة مرور المسؤول. سنقوم بإرسال رابط تأكيد مشفر.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">بريدك الإلكتروني الإداري</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono transition-all"
                  placeholder="admin@bayti-ai.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 px-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span>رجوع</span>
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رابط التعيين'}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center flex items-center justify-center gap-1 text-[10px] text-slate-500 font-medium">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>هذا النظام مخصص لمسؤولي بيت AI فقط. جميع العمليات مسجلة ومحمية.</span>
        </div>
      </div>
    </div>
  );
}
