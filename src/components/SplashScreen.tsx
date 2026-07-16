/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Home, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 600); // Wait for fade-out animation
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden select-none">
      {/* Golden ambient background pulse */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="text-center space-y-6 relative z-10 flex flex-col items-center">
        {/* Animated Brand Icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="relative w-24 h-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 border border-white/10"
        >
          <Home className="w-12 h-12 text-amber-300 stroke-[1.5]" />
          <div className="absolute -top-1 -right-1 bg-amber-400 p-1.5 rounded-full border-4 border-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-white text-yellow-100" />
          </div>
        </motion.div>

        {/* Brand Name Typography */}
        <div className="space-y-2">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-black tracking-tight"
          >
            بيت AI
          </motion.h1>
          
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xs text-slate-400 font-medium tracking-wide"
          >
            BAYTI AI • FINANCIAL OPERATING SYSTEM
          </motion.p>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-sm font-bold text-amber-200/90 leading-relaxed font-sans max-w-[280px]"
        >
          "بيت مالي متزن، عائلة مستقرة"
        </motion.p>

        {/* Premium Spinner and Security label */}
        <div className="pt-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin"></div>
          
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام تشفير معتمد بالكامل (256-bit AES)</span>
          </div>
        </div>
      </div>

      {/* Footer credits */}
      <div className="absolute bottom-8 text-[10px] text-slate-500 font-bold font-sans tracking-widest">
        REVOLUT & APPLE QUALITY COMPLIANT
      </div>
    </div>
  );
}
