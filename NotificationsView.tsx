/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  ReceiptText, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon,
  AlarmClock
} from 'lucide-react';

export type TabId = 'home' | 'expenses' | 'reminders' | 'family' | 'reports' | 'settings';

interface TabBarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export default function TabBar({ activeTab, onChangeTab }: TabBarProps) {
  const tabs = [
    { id: 'home' as TabId, label: 'الرئيسية', icon: Home },
    { id: 'expenses' as TabId, label: 'المصاريف', icon: ReceiptText },
    { id: 'reminders' as TabId, label: 'التذكيرات', icon: AlarmClock },
    { id: 'family' as TabId, label: 'العائلة', icon: Users },
    { id: 'reports' as TabId, label: 'التقارير', icon: BarChart3 },
    { id: 'settings' as TabId, label: 'الإعدادات', icon: SettingsIcon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(15,23,42,0.03)] px-3 pb-safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between h-16 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
                isActive 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id={`tab_${tab.id}`}
            >
              {/* Subtle indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-full animate-fade-in" />
              )}
              
              <Icon className={`w-5 h-5 mb-1 stroke-[2] ${isActive ? 'scale-110 text-blue-600' : ''}`} />
              <span className="text-[10px] tracking-wide text-center font-medium select-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
