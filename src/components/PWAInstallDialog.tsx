/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Smartphone, Share2, Plus, ArrowUpRight, 
  CheckCircle, Sparkles, Clock, X, Info, Apple
} from 'lucide-react';

export default function PWAInstallDialog() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Check if already running in standalone/installed mode
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone === true;
      const alreadyInstalled = localStorage.getItem('bayti_pwa_installed') === 'true';
      
      if (isStandalone || alreadyInstalled) {
        setIsInstalled(true);
      }
    };

    checkStandalone();
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen to native appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('bayti_pwa_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Retrieve any stashed beforeinstallprompt event from global window or listen to events
  useEffect(() => {
    if (isInstalled) return;

    // Check if window already has stashed prompt
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handlePromptAvailable = (e: any) => {
      setDeferredPrompt(e.detail || e);
    };

    window.addEventListener('beforeinstallprompt', handlePromptAvailable as any);
    window.addEventListener('bayti-pwa-prompt-available', handlePromptAvailable as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePromptAvailable as any);
      window.removeEventListener('bayti-pwa-prompt-available', handlePromptAvailable as any);
    };
  }, [isInstalled]);

  // Handler for timing & trigger rule:
  // "Display after 5 seconds on the first visit OR after the user performs their first action."
  useEffect(() => {
    if (isInstalled) return;

    // Check if dismissed within 7 days
    const dismissedUntil = localStorage.getItem('bayti_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    let timer: NodeJS.Timeout;
    let activated = false;

    const triggerDialog = () => {
      if (activated) return;
      activated = true;
      setShow(true);
      
      // Cleanup window listeners
      window.removeEventListener('click', triggerDialog);
      window.removeEventListener('touchstart', triggerDialog);
      window.removeEventListener('keydown', triggerDialog);
      clearTimeout(timer);
    };

    // 1. 5-second timer
    timer = setTimeout(() => {
      triggerDialog();
    }, 5000);

    // 2. First visit action listener
    window.addEventListener('click', triggerDialog);
    window.addEventListener('touchstart', triggerDialog);
    window.addEventListener('keydown', triggerDialog);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', triggerDialog);
      window.removeEventListener('touchstart', triggerDialog);
      window.removeEventListener('keydown', triggerDialog);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    // If we have the deferredPrompt, trigger the native installation prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
          setInstallSuccess(true);
          localStorage.setItem('bayti_pwa_installed', 'true');
          // Hide success message after 3.5s
          setTimeout(() => {
            setShow(false);
          }, 3500);
        } else {
          console.log('User dismissed PWA installation');
          handleDismissLater();
        }
      } catch (err) {
        console.error('Error during PWA installation prompt:', err);
        setShowInstructions(true);
      }
    } else {
      // Browser does not support native automatic prompt (e.g. iOS Safari)
      // Display simple beautiful step-by-step instructions
      setShowInstructions(true);
    }
  };

  const handleDismissLater = () => {
    // Wait at least 7 days before asking again
    const sevenDaysLater = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('bayti_pwa_dismissed_until', sevenDaysLater.toString());
    setShow(false);
  };

  // If already installed, never render anything
  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" dir="rtl">
          
          {/* Backdrop dismiss overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={handleDismissLater}
          />

          {/* Premium Dialog Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 font-sans text-right text-slate-100"
          >
            {/* Ambient decorative glowing bubble */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button 
              onClick={handleDismissLater}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Conditional Rendering logic based on state */}
            {!installSuccess ? (
              <>
                {!showInstructions ? (
                  /* --- Standard Main Dialog --- */
                  <div className="space-y-5">
                    {/* Visual Launcher Icon & App Badge */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/15 relative overflow-hidden shrink-0">
                        بيت
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                          تطبيق الهاتف الذكي
                        </span>
                        <h3 className="text-base font-black text-white mt-1">ثبت تطبيق Bayti AI</h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      استمتع بسرعة أكبر، إشعارات ذكية، واستخدام التطبيق مباشرة من شاشة هاتفك.
                    </p>

                    {/* Quick Value Props Banner */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 text-center">
                      <div className="space-y-1">
                        <span className="text-lg">⚡</span>
                        <span className="text-[9px] text-slate-400 font-bold block">سرعة فائقة</span>
                      </div>
                      <div className="space-y-1 border-x border-slate-800">
                        <span className="text-lg">🔔</span>
                        <span className="text-[9px] text-slate-400 font-bold block">إشعارات ذكية</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-lg">📱</span>
                        <span className="text-[9px] text-slate-400 font-bold block">شاشة كاملة</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleInstallClick}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/15"
                      >
                        <Download className="w-4 h-4" />
                        <span>✅ تثبيت الآن</span>
                      </button>
                      <button
                        onClick={handleDismissLater}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>⏰ لاحقًا</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- Step-by-Step Manual Instructions (E.g. iOS / Safari) --- */
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                        {isIOS ? <Apple className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">إضافة التطبيق للشاشة الرئيسية</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">خطوات تثبيت سريعة لنظام {isIOS ? 'iOS (آيفون)' : 'أندرويد'}</p>
                      </div>
                    </div>

                    {isIOS ? (
                      /* iOS Safari Flow */
                      <div className="space-y-3 text-xs leading-relaxed font-semibold text-slate-300">
                        <p className="text-slate-400 text-[11px]">بسبب قيود نظام التشغيل آبل، يرجى اتباع الآتي لتثبيت المساعد المالي:</p>
                        
                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">١</span>
                          <div>
                            <span>اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> في شريط متصفح Safari.</span>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">٢</span>
                          <div>
                            <span>مرر للأسفل واختر إضافة للشاشة الرئيسية <Plus className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> (Add to Home Screen).</span>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">٣</span>
                          <div>
                            <span>اضغط على كلمة "إضافة" (Add) في الزاوية العلوية اليسرى.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* General Chrome / Edge Instructions */
                      <div className="space-y-3 text-xs leading-relaxed font-semibold text-slate-300">
                        <p className="text-slate-400 text-[11px]">يمكنك تثبيت التطبيق يدوياً باتباع الخطوات التالية:</p>

                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">١</span>
                          <div>
                            <span>اضغط على زر القائمة المكون من ثلاث نقاط (⋮) في أعلى يسار المتصفح.</span>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">٢</span>
                          <div>
                            <span>اختر "تثبيت التطبيق" (Install App) أو "إضافة إلى الشاشة الرئيسية".</span>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                          <span className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 font-bold flex items-center justify-center shrink-0">٣</span>
                          <div>
                            <span>أكد التثبيت لتبسيط استخدام بيت AI.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleDismissLater}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition-colors"
                      >
                        فهمت، شكراً
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* --- Beautiful Premium Success Animation & Message --- */
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center justify-center text-center space-y-4"
              >
                {/* Checkmark drawing effect */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                  
                  {/* Floating decorative sparkles */}
                  <div className="absolute -top-1 -right-1 text-yellow-400 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">🎉 تم تثبيت التطبيق بنجاح.</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    شكراً لك! يمكنك الآن تشغيل تطبيق Bayti AI المساعد المالي مباشرة من شاشة هاتفك الرئيسية كـ PWA فائق السرعة.
                  </p>
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
