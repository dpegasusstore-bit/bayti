/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Bell, Shield, Wallet, Sun, Moon } from 'lucide-react';

interface AppHeaderProps {
  userEmail: string;
  isPremium: boolean;
  onOpenNotifications: () => void;
  notificationsCount: number;
  userName?: string;
  userAvatar?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AppHeader({ 
  userEmail, 
  isPremium, 
  onOpenNotifications, 
  notificationsCount,
  userName,
  userAvatar = '👨🏻‍💼',
  isDarkMode,
  onToggleDarkMode
}: AppHeaderProps) {
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'أحمد');

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-300">
      {/* User profile & Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 overflow-hidden shadow-inner">
            {userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('/api/') || userAvatar.startsWith('data:')) ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              userAvatar
            )}
          </div>
          {isPremium && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
              <Sparkles className="w-3 h-3 fill-white" />
            </span>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-slate-800 dark:text-white">مرحباً بك، {displayName}</h1>
            {isPremium && (
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/40 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-amber-600" />
                بريميوم
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">مساعدك المالي الذكي من بيت AI</p>
        </div>
      </div>

      {/* App Branding logo */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-100 dark:shadow-none">
          بيت
        </div>
        <span className="font-extrabold text-blue-600 tracking-tight text-base font-sans">Bayti AI</span>
      </div>

      {/* Quick notifications & Status icons */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800"
          title="تبديل المظهر"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <button 
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800"
          id="btn_notifications"
        >
          <Bell className="w-4.5 h-4.5 stroke-[1.8]" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {notificationsCount}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>آمن تماماً</span>
        </div>
      </div>
    </header>
  );
}
