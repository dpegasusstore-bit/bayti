/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Home, 
  ShoppingBag, 
  Utensils, 
  Car, 
  FileText, 
  HeartPulse, 
  GraduationCap, 
  Plane, 
  Sparkles, 
  Briefcase 
} from 'lucide-react';
import { CategoryType, Expense, FamilyMember, BillReminder, AIInsight, SmartReminder, SmartNotification } from './types';

// Category details mapping
export const CATEGORY_DETAILS: Record<CategoryType, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  Home: {
    label: 'المنزل',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  Shopping: {
    label: 'التسوق',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
  },
  Restaurants: {
    label: 'المطاعم',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
  },
  Transportation: {
    label: 'المواصلات',
    icon: Car,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  Bills: {
    label: 'الفواتير',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  Health: {
    label: 'الصحة',
    icon: HeartPulse,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
  },
  Education: {
    label: 'التعليم',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
  },
  Travel: {
    label: 'السفر',
    icon: Plane,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
  },
  Entertainment: {
    label: 'الترفيه',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-100',
  },
  Work: {
    label: 'العمل',
    icon: Briefcase,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-100',
  }
};

// Payment methods in Arabic
export const PAYMENT_METHODS = {
  Cash: 'نقدي',
  Card: 'بطاقة مصرفية',
  Wallet: 'محفظة إلكترونية'
};

// Conversion rates with EGP as base
export const CURRENCY_RATES: Record<string, number> = {
  EGP: 1,
  SAR: 0.08,
  AED: 0.078,
  USD: 0.021,
  EUR: 0.019
};

export const CURRENCY_LABELS: Record<string, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$',
  EUR: '€'
};

// Format currency - Consistent financial premium layout with support for multiple currencies and masking
export function formatCurrency(amount: number, currency?: string, hideValues?: boolean): string {
  // Read from localStorage if not explicitly supplied (making it instantly work across all tabs!)
  const finalCurrency = currency || localStorage.getItem('bayti_active_currency') || 'EGP';
  const finalHideValues = hideValues !== undefined ? hideValues : localStorage.getItem('bayti_hide_values') === 'true';

  if (finalHideValues) {
    const label = CURRENCY_LABELS[finalCurrency] || finalCurrency;
    return `•••• ${label}`;
  }
  const rate = CURRENCY_RATES[finalCurrency] || 1;
  const converted = amount * rate;
  
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: converted < 100 && finalCurrency !== 'EGP' ? 2 : 0
  }).format(converted);
  
  const label = CURRENCY_LABELS[finalCurrency] || finalCurrency;
  return `${formatted} ${label}`;
}

// Initial Family Members
export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [];

// Initial Expenses
export const INITIAL_EXPENSES: Expense[] = [];

// Initial Bill Reminders
export const INITIAL_BILLS: BillReminder[] = [];

// Initial Insights
export const INITIAL_INSIGHTS: AIInsight[] = [];

// Initial Smart Reminders
export const INITIAL_REMINDERS: SmartReminder[] = [];

// Initial Smart Notifications
export const INITIAL_SMART_NOTIFICATIONS: SmartNotification[] = [];

