/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 
  | 'Home' 
  | 'Shopping' 
  | 'Restaurants' 
  | 'Transportation' 
  | 'Bills' 
  | 'Health' 
  | 'Education' 
  | 'Travel' 
  | 'Entertainment' 
  | 'Work';

export interface ExpenseItem {
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM AM/PM
  category: CategoryType;
  merchant: string;
  paymentMethod: 'Cash' | 'Card' | 'Wallet'; // نقدي - بطاقة - محفظة
  vat?: number;
  items?: ExpenseItem[];
  recordedBy: string; // Family member name/ID
  notes?: string;
  tags?: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string; // Emoji or custom image
  monthlyBudget: number;
  spentThisMonth: number;
  role: string; // الأب، الأم، الابن، الابنة، إلخ.
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  message: string;
  date: string;
  category?: CategoryType;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: CategoryType;
  isPaid: boolean;
  merchant: string;
}

export interface SmartReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  repeatType: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'missed' | 'upcoming';
  category: string; 
  notes?: string;
  isAiGenerated?: boolean;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'financial' | 'family' | 'system' | 'ai_tip' | 'summary';
  actionable?: boolean;
  reminderId?: string;
}

