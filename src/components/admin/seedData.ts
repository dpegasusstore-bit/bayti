/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Banned';
  plan: 'Free' | 'Premium';
  registeredAt: string;
  lastLogin: string;
  device: string;
  ipAddress: string;
  spentThisMonth: number;
  totalSpent: number;
  activityHistory: { date: string; action: string; details: string }[];
  role?: string;
}

export interface Subscription {
  id: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: 'Active' | 'Cancelled' | 'Refunded' | 'Expired';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  expiryDate: string;
}

export interface FeedbackTicket {
  id: string;
  userEmail: string;
  type: 'Bug Report' | 'Feature Request' | 'Support Message';
  subject: string;
  message: string;
  status: 'Open' | 'Solved';
  date: string;
  reply?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  ipAddress: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface ContentItem {
  id: string;
  type: 'banner' | 'announcement' | 'tip' | 'news' | 'daily_msg';
  title: string;
  content: string;
  target?: string;
  isActive: boolean;
  createdAt: string;
}

export const INITIAL_ADMIN_USERS: AdminUser[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_FEEDBACK: FeedbackTicket[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_CONTENT: ContentItem[] = [];

export const INITIAL_FEATURE_FLAGS = {
  betaFeatures: true,
  maintenanceMode: false,
  forceUpdate: false,
  aiInsightsEngine: true,
  voiceInputPremium: true
};
