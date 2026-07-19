/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Key, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Chrome, 
  Apple, 
  Mail,
  AlertCircle
} from 'lucide-react';

interface SecurityGateProps {
  onUnlock: () => void;
  isFaceIdEnabled: boolean;
  onSetVerified?: () => void;
}

export default function SecurityGate({ 
  onUnlock, 
  isFaceIdEnabled 
}: SecurityGateProps) {
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Default correct passcode is '1234'
  const CORRECT_PASSCODE = '1234';

  // Autostart Simulated Biometrics if enabled on component mount
  useEffect(() => {
    if (isFaceIdEnabled) {
      handleBiometricScan();
    }
  }, [isFaceIdEnabled]);

  const handleKeyPress = (num: string) => {
    setError(null);
    if (passcode.length < 4) {
      const nextPasscode = passcode + num;
      setPasscode(nextPasscode);
      
      // Simulate haptic buzz
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(10);
      }

      if (nextPasscode === CORRECT_PASSCODE) {
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else if (nextPasscode.length === 4) {
        setTimeout(() => {
          setError('رقم سري غير صحيح! يرجى إدخال الرقم السري الافتراضي (1234)');
          setPasscode('');
          if (window.navigator?.vibrate) {
            window.navigator.vibrate([50, 50]);
          }
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleBiometricScan = () => {
    setIsScanning(true);
    setError(null);
    setScanSuccess(false);

    // Simulate standard Face ID sensor scanning
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(20);
      }
      setTimeout(() => {
        onUnlock();
      }, 500);
    }, 1800);
  };

  const handleSocialLogin = (platform: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onUnlock();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950 flex flex-col items-center justify-between text-white p-6 select-none font-sans">
      
      {/* Top Header - Locked Status */}
      <div className="w-full flex flex-col items-center pt-8 space-y-2">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center relative">
          <Lock className="w-5 h-5 text-blue-400" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border border-slate-950 rounded-full animate-ping"></span>
        </div>
        <h2 className="text-sm font-black text-slate-300">التطبيق مؤمن ومقفل 🔒</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bayti Smart Vault v1.0</p>
      </div>

      {/* Main interaction region */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-8">
        
        {/* Passcode dots */}
        <div className="flex flex-col items-center space-y-3">
          <p className="text-xs font-bold text-slate-400">يرجى إدخال رقم المرور لفك القفل (الافتراضي: 1234)</p>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx} 
                className={`w-3.5 h-3.5 rounded-full border border-slate-700 transition-all duration-200 ${
                  passcode.length > idx 
                    ? 'bg-blue-500 scale-110 shadow-sm shadow-blue-500/50' 
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic biometric simulation overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center space-y-4"
            >
              <div className="relative w-28 h-28 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping"></span>
                <span className="absolute inset-2 rounded-full border border-blue-400/40 animate-spin border-t-transparent"></span>
                <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/40 rounded-full flex items-center justify-center text-blue-400">
                  <Fingerprint className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <p className="text-xs font-black text-blue-400 animate-pulse">جاري التحقق عبر المستشعر الحيوي المعتمد...</p>
              <p className="text-[9px] text-slate-500">جاري قراءة تفاصيل الأمان بأمان مالي فائق</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom keypad layout */}
        <div className="w-full grid grid-cols-3 gap-y-4 gap-x-6 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold font-mono rounded-full flex items-center justify-center border border-white/5 transition-all mx-auto shadow-xs"
            >
              {num}
            </button>
          ))}
          
          {/* Back key / Fingerprint scan */}
          <button
            onClick={handleBiometricScan}
            className="w-14 h-14 hover:bg-white/5 active:scale-95 text-blue-400 rounded-full flex items-center justify-center transition-all mx-auto"
            title="بصمة بيومترية"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold font-mono rounded-full flex items-center justify-center border border-white/5 transition-all mx-auto shadow-xs"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="w-14 h-14 hover:bg-white/5 active:scale-95 text-slate-400 rounded-full flex items-center justify-center transition-all mx-auto"
          >
            ←
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-300 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] leading-relaxed max-w-xs text-right" style={{ direction: 'rtl' }}>
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Social / SSO Single Sign-On fallback methods */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-3 pb-4 border-t border-white/5 pt-4">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">أو تسجيل الدخول السريع</p>
        <div className="flex justify-center gap-4 w-full">
          <button 
            onClick={() => handleSocialLogin('Google')}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <Chrome className="w-3.5 h-3.5 text-red-400" />
            <span>Google</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('Apple')}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <Apple className="w-3.5 h-3.5 text-white" />
            <span>Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}
