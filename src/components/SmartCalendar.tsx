/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  DollarSign, 
  FileText, 
  Bell, 
  CreditCard, 
  Users, 
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  amount: number;
  type: 'salary' | 'bill' | 'installment' | 'association' | 'subscription' | 'reminder';
  typeLabel: string;
  color: string;
  bgColor: string;
  isPaid?: boolean;
}

interface SmartCalendarProps {
  onboardingData?: any;
  monthlySalary?: number;
}

export default function SmartCalendar({ onboardingData, monthlySalary = 15000 }: SmartCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  
  // Dynamically generate events based on onboarding answers for Cairo 2026!
  const hasRent = onboardingData?.homeStatus === 'rent';
  const hasCar = onboardingData?.ownsCar;
  const hasInstallments = onboardingData?.paysInstallments;
  const hasGroup = onboardingData?.participatesInGroup;

  const events: CalendarEvent[] = [
    {
      id: 'cal_salary',
      day: 25,
      title: 'إيداع الراتب الشهري للعائلة 🏦',
      amount: monthlySalary,
      type: 'salary',
      typeLabel: 'الراتب المودع',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      id: 'cal_internet',
      day: 18,
      title: 'فاتورة الإنترنت المنزلي WE 🌐',
      amount: 450,
      type: 'bill',
      typeLabel: 'فاتورة اتصالات',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      isPaid: false
    },
    {
      id: 'cal_elec',
      day: 15,
      title: 'فاتورة الكهرباء لشركة جنوب القاهرة ⚡',
      amount: 720,
      type: 'bill',
      typeLabel: 'فاتورة خدمات العامة',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      isPaid: true
    },
    {
      id: 'cal_netflix',
      day: 12,
      title: 'اشتراك نتفليكس العائلي 🍿',
      amount: 320,
      type: 'subscription',
      typeLabel: 'اشتراك رقمي',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      isPaid: true
    },
    {
      id: 'cal_spotify',
      day: 8,
      title: 'اشتراك سبوتيفاي العائلي الموسيقي 🎵',
      amount: 90,
      type: 'subscription',
      typeLabel: 'اشتراك رقمي',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      isPaid: true
    },
    {
      id: 'cal_rem_budget',
      day: 1,
      title: 'إعادة تصفير الميزانية وبدء التحدي الجديد 🏁',
      amount: 0,
      type: 'reminder',
      typeLabel: 'تذكير مالي',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-800'
    }
  ];

  // Onboarding responsive additions!
  if (hasRent) {
    events.push({
      id: 'cal_rent',
      day: 1,
      title: 'قسط إيجار الشقة الشهري 🏠',
      amount: 3500,
      type: 'bill',
      typeLabel: 'إيجار المنزل',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      isPaid: false
    });
  }

  if (hasCar && hasInstallments) {
    events.push({
      id: 'cal_car_installment',
      day: 28,
      title: 'قسط السيارة الشهري للبنك 🚗',
      amount: 2350,
      type: 'installment',
      typeLabel: 'قسط تمويلي',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      isPaid: false
    });
  }

  if (hasGroup) {
    events.push({
      id: 'cal_association',
      day: 5,
      title: 'دفع قسط الجمعية الشهرية الدورية 👥',
      amount: 1000,
      type: 'association',
      typeLabel: 'الجمعية الشهرية',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      isPaid: false
    });
  }

  // Get days in July 2026 (July has 31 days, starts on Wednesday)
  const totalDays = 31;
  const startOffset = 3; // Wednesday offset (Sun:0, Mon:1, Tue:2, Wed:3...)

  const calendarCells = [];
  // Fill empty spaces before start of month
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(i);
  }

  const selectedDayEvents = events.filter(e => e.day === selectedDay);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <CalendarIcon className="w-4.5 h-4.5 text-blue-600" />
          <h3 className="text-sm font-black">الجدول المالي والالتزامات</h3>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">
          <Sparkles className="w-3 h-3 fill-blue-600 dark:fill-blue-400" />
          <span>شهر يوليو ٢٠٢٦</span>
        </div>
      </div>

      {/* Grid of week days */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
        <span>أح</span>
        <span>اث</span>
        <span>ثل</span>
        <span>أر</span>
        <span>خم</span>
        <span>جم</span>
        <span>سب</span>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty_${idx}`} className="h-9"></div>;
          }

          const hasEvent = events.some(e => e.day === day);
          const isSelected = day === selectedDay;
          const dayEventsList = events.filter(e => e.day === day);

          return (
            <button
              key={`day_${day}`}
              onClick={() => setSelectedDay(day)}
              className={`h-9 flex flex-col items-center justify-between py-1 rounded-xl transition-all relative ${
                isSelected
                  ? 'bg-blue-600 text-white font-black scale-105 shadow-sm shadow-blue-100 dark:shadow-none'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs'
              }`}
            >
              <span className="text-[11px] leading-none mt-1">{day}</span>
              {/* Event Indicators */}
              <div className="flex gap-0.5 justify-center pb-1">
                {dayEventsList.slice(0, 3).map((ev, i) => (
                  <span 
                    key={i} 
                    className={`w-1 h-1 rounded-full ${
                      isSelected 
                        ? 'bg-white' 
                        : ev.type === 'salary' 
                          ? 'bg-emerald-500' 
                          : ev.type === 'bill' 
                            ? 'bg-amber-500' 
                            : ev.type === 'installment'
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                    }`} 
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Events detail list */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          التزامات يوم {selectedDay} يوليو:
        </span>

        {selectedDayEvents.length === 0 ? (
          <div className="text-center py-5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl text-[11px] text-slate-400">
            لا توجد التزامات مالية أو أقساط مسجلة في هذا اليوم. 🍀
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((ev) => (
              <div 
                key={ev.id} 
                className={`p-3.5 rounded-2xl border border-slate-100/60 dark:border-slate-800/80 flex items-center justify-between ${ev.bgColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ev.bgColor} ${ev.color}`}>
                    {ev.type === 'salary' ? (
                      <DollarSign className="w-4.5 h-4.5" />
                    ) : ev.type === 'bill' ? (
                      <FileText className="w-4.5 h-4.5" />
                    ) : ev.type === 'installment' ? (
                      <CreditCard className="w-4.5 h-4.5" />
                    ) : ev.type === 'association' ? (
                      <Users className="w-4.5 h-4.5" />
                    ) : (
                      <Bell className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{ev.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{ev.typeLabel}</span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  {ev.amount > 0 ? (
                    <p className={`text-xs font-black font-mono ${ev.type === 'salary' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {ev.type === 'salary' ? '+' : '-'} {formatCurrency(ev.amount)}
                    </p>
                  ) : (
                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-300">بدون تكلفة</span>
                  )}
                  {ev.isPaid !== undefined && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full block mt-1 text-center ${
                      ev.isPaid 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {ev.isPaid ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
