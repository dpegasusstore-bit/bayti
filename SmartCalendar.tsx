/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import AppHeader from './components/AppHeader';
import TabBar, { TabId } from './components/TabBar';
import HomeTab from './components/HomeTab';
import ExpensesTab from './components/ExpensesTab';
import FamilyTab from './components/FamilyTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import QuickActionModal from './components/QuickActionModal';
import RemindersTab from './components/RemindersTab';
import { Expense, FamilyMember, AIInsight, SmartReminder, SmartNotification } from './types';
import { 
  INITIAL_EXPENSES, 
  INITIAL_FAMILY_MEMBERS, 
  INITIAL_INSIGHTS, 
  INITIAL_BILLS,
  INITIAL_REMINDERS,
  INITIAL_SMART_NOTIFICATIONS
} from './utils';
import { Sparkles, Info, X, Bell } from 'lucide-react';
import Onboarding, { OnboardingData } from './components/Onboarding';
import SplashScreen from './components/SplashScreen';
import SecurityGate from './components/SecurityGate';
import PremiumModal from './components/PremiumModal';
import SmartExportModal from './components/SmartExportModal';
import AdminPortal from './components/admin/AdminPortal';
import PWAInstallDialog from './components/PWAInstallDialog';
import UserAuth from './components/UserAuth';
import { api } from './services/api';

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // --- Admin Portal Route Interception ---
  if (pathname.startsWith('/admin')) {
    return <AdminPortal />;
  }

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(15000);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [currentMemberName, setCurrentMemberName] = useState<string>('أحمد');
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Security & Premium settings (Phase 6)
  const [isPasscodeEnabled, setIsPasscodeEnabled] = useState<boolean>(false);
  const [isFaceIdEnabled, setIsFaceIdEnabled] = useState<boolean>(false);
  const [hideFinancialValues, setHideFinancialValues] = useState<boolean>(false);
  const [hideNotificationsContent, setHideNotificationsContent] = useState<boolean>(false);
  const [activeCurrency, setActiveCurrency] = useState<string>('EGP');
  const [adminPasscode, setAdminPasscode] = useState<string>('');

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isSplashFinished, setIsSplashFinished] = useState<boolean>(false);

  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Modal and notifications states
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionInitialTab, setQuickActionInitialTab] = useState<'scan' | 'voice' | 'text'>('text');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Reminders and Smart Notifications State
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([]);

  const [loadingInsights, setLoadingInsights] = useState(false);

  // Authentication & Session States
  const [userToken, setUserToken] = useState<string | null>(() => localStorage.getItem('bayti_user_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Track the last successfully synchronized data to prevent redundant API calls
  const lastSyncedRef = useRef<{ expenses: string; familyMembers: string }>({ expenses: '', familyMembers: '' });

  // 1. Session check and remote database pull on startup
  useEffect(() => {
    async function checkAuth() {
      if (userToken) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setCurrentUser(res.user);
            setUserProfile(res.profile);
            setIsPremium(res.profile?.subscription === 'Premium');
            localStorage.setItem('bayti_premium', String(res.profile?.subscription === 'Premium'));
            setOnboardingCompleted(res.onboarding?.onboardingCompleted);
            if (res.profile?.fullName) {
              setCurrentMemberName(res.profile.fullName);
            }
            if (res.profile?.currency) {
              setActiveCurrency(res.profile.currency);
              localStorage.setItem('bayti_active_currency', res.profile.currency);
            }
            if (res.settings) {
              setIsPasscodeEnabled(res.settings.isPasscodeEnabled);
              setIsFaceIdEnabled(res.settings.isFaceIdEnabled);
              setHideFinancialValues(res.settings.hideFinancialValues);
              setHideNotificationsContent(res.settings.hideNotificationsContent);
              setAdminPasscode(res.settings.adminPasscode || '');
              
              localStorage.setItem('bayti_passcode_enabled', String(res.settings.isPasscodeEnabled));
              localStorage.setItem('bayti_faceid_enabled', String(res.settings.isFaceIdEnabled));
              localStorage.setItem('bayti_hide_values', String(res.settings.hideFinancialValues));
              localStorage.setItem('bayti_hide_notifications', String(res.settings.hideNotificationsContent));
              localStorage.setItem('bayti_admin_security_passcode', res.settings.adminPasscode || '');
              
              if (!res.settings.isPasscodeEnabled) {
                setIsUnlocked(true);
              }
            }

            // Pull active records from the persistent cloud database
            const dataRes = await api.pullData();
            if (dataRes.success) {
              if (dataRes.expenses && dataRes.expenses.length > 0) {
                setExpenses(dataRes.expenses);
                lastSyncedRef.current.expenses = JSON.stringify(dataRes.expenses);
              }
              if (dataRes.familyMembers && dataRes.familyMembers.length > 0) {
                setFamilyMembers(dataRes.familyMembers);
                lastSyncedRef.current.familyMembers = JSON.stringify(dataRes.familyMembers);
              }
              if (dataRes.reminders && dataRes.reminders.length > 0) {
                setReminders(dataRes.reminders);
              }
              if (dataRes.notifications && dataRes.notifications.length > 0) {
                setSmartNotifications(dataRes.notifications);
              }
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('bayti_user_token');
            setUserToken(null);
          }
        } catch (e) {
          console.error('Failed to verify session on startup:', e);
        }
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, [userToken]);

  // 2. Automatic cloud-database synchronization when local state modifications occur
  useEffect(() => {
    if (userToken && authChecked && currentUser) {
      const currentExpensesStr = JSON.stringify(expenses);
      const currentMembersStr = JSON.stringify(familyMembers);

      // Skip synchronization if local data is already identical to the last successfully synced data
      if (
        currentExpensesStr === lastSyncedRef.current.expenses &&
        currentMembersStr === lastSyncedRef.current.familyMembers
      ) {
        return;
      }

      const syncTimeout = setTimeout(async () => {
        try {
          const syncRes = await api.syncData({
            expenses,
            familyMembers,
            reminders,
            notifications: smartNotifications,
            onboarding: {
              onboardingCompleted,
              salary: monthlyBudget,
              otherIncome: 0,
              familyMembersCount: familyMembers.length || 1,
              ownsCar: false,
              paysInstallments: false,
              participatesInGroup: false,
              homeStatus: 'own',
              wantsGoals: true
            }
          });
          if (syncRes.success) {
            lastSyncedRef.current = {
              expenses: currentExpensesStr,
              familyMembers: currentMembersStr
            };
          }
        } catch (e) {
          console.error('Failed to auto-sync with server:', e);
        }
      }, 1000); // Debounce sync by 1 second to minimize requests
      return () => clearTimeout(syncTimeout);
    }
  }, [expenses, familyMembers, reminders, smartNotifications, onboardingCompleted, userToken, authChecked, currentUser]);

  // Load from LocalStorage for durable offline-friendly client state!
  useEffect(() => {
    const localExpenses = localStorage.getItem('bayti_expenses');
    const localMembers = localStorage.getItem('bayti_members');
    const localInsights = localStorage.getItem('bayti_insights');
    const localBudget = localStorage.getItem('bayti_budget');
    const localPremium = localStorage.getItem('bayti_premium');
    const localMember = localStorage.getItem('bayti_current_member');

    if (localExpenses) setExpenses(JSON.parse(localExpenses));
    else {
      setExpenses(INITIAL_EXPENSES);
      localStorage.setItem('bayti_expenses', JSON.stringify(INITIAL_EXPENSES));
    }

    if (localMembers) setFamilyMembers(JSON.parse(localMembers));
    else {
      setFamilyMembers(INITIAL_FAMILY_MEMBERS);
      localStorage.setItem('bayti_members', JSON.stringify(INITIAL_FAMILY_MEMBERS));
    }

    if (localInsights) setInsights(JSON.parse(localInsights));
    else {
      setInsights(INITIAL_INSIGHTS);
      localStorage.setItem('bayti_insights', JSON.stringify(INITIAL_INSIGHTS));
    }

    if (localBudget) setMonthlyBudget(Number(localBudget));
    else {
      setMonthlyBudget(15000);
      localStorage.setItem('bayti_budget', '15000');
    }

    if (localPremium) setIsPremium(localPremium === 'true');
    if (localMember) setCurrentMemberName(localMember);

    const localReminders = localStorage.getItem('bayti_reminders');
    if (localReminders) setReminders(JSON.parse(localReminders));
    else {
      setReminders(INITIAL_REMINDERS);
      localStorage.setItem('bayti_reminders', JSON.stringify(INITIAL_REMINDERS));
    }

    const localSmartNotifications = localStorage.getItem('bayti_smart_notifications');
    if (localSmartNotifications) setSmartNotifications(JSON.parse(localSmartNotifications));
    else {
      setSmartNotifications(INITIAL_SMART_NOTIFICATIONS);
      localStorage.setItem('bayti_smart_notifications', JSON.stringify(INITIAL_SMART_NOTIFICATIONS));
    }

    const localOnboardingCompleted = localStorage.getItem('bayti_onboarding_completed') === 'true';
    const localOnboardingData = localStorage.getItem('bayti_onboarding_data');
    const localDarkMode = localStorage.getItem('bayti_dark_mode') === 'true';

    const localPasscodeEnabled = localStorage.getItem('bayti_passcode_enabled') === 'true';
    const localFaceIdEnabled = localStorage.getItem('bayti_faceid_enabled') === 'true';
    const localHideValues = localStorage.getItem('bayti_hide_values') === 'true';
    const localHideNotifications = localStorage.getItem('bayti_hide_notifications') === 'true';
    const localCurrency = localStorage.getItem('bayti_active_currency') || 'EGP';
    const localAdminPasscode = localStorage.getItem('bayti_admin_security_passcode') || '';

    setIsPasscodeEnabled(localPasscodeEnabled);
    setIsFaceIdEnabled(localFaceIdEnabled);
    setHideFinancialValues(localHideValues);
    setHideNotificationsContent(localHideNotifications);
    setActiveCurrency(localCurrency);
    setAdminPasscode(localAdminPasscode);

    if (!localPasscodeEnabled) {
      setIsUnlocked(true);
    }

    setOnboardingCompleted(localOnboardingCompleted);
    if (localOnboardingData) setOnboardingData(JSON.parse(localOnboardingData));
    setIsDarkMode(localDarkMode);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleOnboardingComplete = (data: OnboardingData) => {
    const primaryMember: FamilyMember = {
      id: 'mem_1',
      name: data.name,
      avatar: data.avatar,
      monthlyBudget: data.monthlySalary,
      spentThisMonth: 0,
      role: data.maritalStatus.includes('زوج') ? 'الأب/الأم' : 'مسؤول البيت'
    };

    const list: FamilyMember[] = [primaryMember];
    if (data.familyMembersCount > 1) {
      const roles = ['الزوج/الزوجة', 'الابن', 'الابنة', 'الجد', 'الجدة'];
      const emojis = ['👩🏻‍⚕️', '👧🏻', '👨🏻‍💻', '👵', '👴'];
      for (let i = 1; i < data.familyMembersCount; i++) {
        const role = roles[(i - 1) % roles.length];
        const name = `${role} ${i}`;
        list.push({
          id: `mem_${i + 1}`,
          name: name,
          avatar: emojis[(i - 1) % emojis.length],
          monthlyBudget: Math.round(data.monthlySalary / data.familyMembersCount),
          spentThisMonth: 0,
          role: role
        });
      }
    }

    const finalBudget = data.monthlySalary + data.otherIncome;
    setMonthlyBudget(finalBudget);
    localStorage.setItem('bayti_budget', String(finalBudget));

    setFamilyMembers(list);
    localStorage.setItem('bayti_members', JSON.stringify(list));

    setCurrentMemberName(data.name);
    localStorage.setItem('bayti_current_member', data.name);

    const initialExpenses: Expense[] = [];
    
    if (data.homeStatus === 'rent') {
      initialExpenses.push({
        id: 'exp_rent',
        title: 'إيجار المنزل الشهري 🏠',
        amount: 3500,
        date: new Date().toISOString().split('T')[0],
        time: '١٢:٠٠ م',
        category: 'Home',
        merchant: 'مالك العقار',
        paymentMethod: 'Cash',
        recordedBy: data.name,
        notes: 'تم الخصم تلقائياً كإيجار مالي مجدول',
        tags: ['سكن', 'إيجار', 'البيت']
      });
    }

    if (data.ownsCar && data.paysInstallments) {
      initialExpenses.push({
        id: 'exp_car',
        title: 'قسط السيارة الشهري للبنك 🚗',
        amount: 2350,
        date: new Date().toISOString().split('T')[0],
        time: '٠١:٠٠ م',
        category: 'Transportation',
        merchant: 'البنك الأهلي المصري',
        paymentMethod: 'Card',
        recordedBy: data.name,
        notes: 'تم الخصم التلقائي لقسط تمويل السيارة',
        tags: ['سيارة', 'قسط', 'البنك']
      });
    }

    if (data.participatesInGroup) {
      initialExpenses.push({
        id: 'exp_group',
        title: 'قسط الجمعية الشهرية الدورية 👥',
        amount: 1000,
        date: new Date().toISOString().split('T')[0],
        time: '١٠:٠٠ ص',
        category: 'Bills',
        merchant: 'منسق الجمعية',
        paymentMethod: 'Wallet',
        recordedBy: data.name,
        notes: 'المستحق الشهري لجمعية الأقارب والأصدقاء',
        tags: ['جمعية', 'ادخار', 'أقارب']
      });
    }

    initialExpenses.push({
      id: 'exp_groceries',
      title: 'شراء لوازم البيت والطلبات الأسبوعية 🥬',
      amount: 1420,
      date: new Date().toISOString().split('T')[0],
      time: '٠٤:١٥ م',
      category: 'Home',
      merchant: 'كارفور هايبر ماركت',
      paymentMethod: 'Card',
      recordedBy: data.name,
      notes: 'شراء مستلزمات بقالة متكاملة بخصم فيزا',
      tags: ['بقالة', 'كارفور', 'سوبرماركت']
    });

    setExpenses(initialExpenses);
    localStorage.setItem('bayti_expenses', JSON.stringify(initialExpenses));

    setOnboardingCompleted(true);
    localStorage.setItem('bayti_onboarding_completed', 'true');
    setOnboardingData(data);
    localStorage.setItem('bayti_onboarding_data', JSON.stringify(data));
  };

  // Save states helper
  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('bayti_expenses', JSON.stringify(newExpenses));
  };

  const saveMembers = (newMembers: FamilyMember[]) => {
    setFamilyMembers(newMembers);
    localStorage.setItem('bayti_members', JSON.stringify(newMembers));
  };

  const saveInsights = (newInsights: AIInsight[]) => {
    setInsights(newInsights);
    localStorage.setItem('bayti_insights', JSON.stringify(newInsights));
  };

  // Add Expense & dynamically run AI Insights generation in background!
  const handleAddExpense = (expense: Expense) => {
    const updatedExpenses = [expense, ...expenses];
    saveExpenses(updatedExpenses);

    // Update member spent balance
    const updatedMembers = familyMembers.map((m) => {
      if (m.name === expense.recordedBy) {
        return { ...m, spentThisMonth: m.spentThisMonth + expense.amount };
      }
      return m;
    });
    saveMembers(updatedMembers);

    // Dynamic background trigger to refresh smart AI advice
    triggerBackgroundInsights(updatedExpenses, updatedMembers);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const updatedExpenses = expenses.filter((e) => e.id !== id);
    const updatedMembers = familyMembers.map((m) => {
      if (m.name === target.recordedBy) {
        return { ...m, spentThisMonth: Math.max(0, m.spentThisMonth - target.amount) };
      }
      return m;
    });

    // 1. Immediately update local state & localStorage for instant, highly-responsive UI feedback
    saveExpenses(updatedExpenses);
    saveMembers(updatedMembers);

    // 2. Trigger an immediate, non-debounced database sync to ensure the deletion persists on the server
    if (userToken && authChecked && currentUser) {
      try {
        const syncRes = await api.syncData({
          expenses: updatedExpenses,
          familyMembers: updatedMembers,
          reminders,
          notifications: smartNotifications,
          onboarding: {
            onboardingCompleted,
            salary: monthlyBudget,
            otherIncome: 0,
            familyMembersCount: familyMembers.length || 1,
            ownsCar: false,
            paysInstallments: false,
            participatesInGroup: false,
            homeStatus: 'own',
            wantsGoals: true
          }
        });

        if (syncRes.success) {
          // Pre-populate lastSyncedRef to ensure the debounced useEffect auto-sync doesn't fire redundantly
          lastSyncedRef.current = {
            expenses: JSON.stringify(updatedExpenses),
            familyMembers: JSON.stringify(updatedMembers)
          };
          console.log('[App] Database deletion sync completed successfully.');
        } else {
          console.error('[App] Database deletion sync failed:', syncRes.error);
        }
      } catch (err) {
        console.error('[App] Network error during immediate database sync on deletion:', err);
      }
    }

    // Refresh advice
    triggerBackgroundInsights(updatedExpenses, updatedMembers);
  };

  // Trigger background Server-Side Gemini Insights
  const triggerBackgroundInsights = async (currExpenses: Expense[], currMembers: FamilyMember[]) => {
    setLoadingInsights(true);
    try {
      const token = localStorage.getItem('bayti_user_token') || localStorage.getItem('bayti_admin_token') || '';
      const response = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expenses: currExpenses,
          familyMembers: currMembers,
          monthlyBudget
        })
      });
      const data = await response.json();
      if (data.success && data.insights) {
        saveInsights(data.insights);
      }
    } catch (err) {
      console.error('Failed to regenerate insights dynamically:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAddMember = (member: FamilyMember) => {
    const updated = [...familyMembers, member];
    saveMembers(updated);
  };

  const handleDeleteMember = (id: string) => {
    const updated = familyMembers.filter((m) => m.id !== id);
    saveMembers(updated);
  };

  const handleUpdateBudget = (budget: number) => {
    setMonthlyBudget(budget);
    localStorage.setItem('bayti_budget', String(budget));
  };

  const handleTogglePremium = () => {
    const nextVal = !isPremium;
    setIsPremium(nextVal);
    localStorage.setItem('bayti_premium', String(nextVal));
  };

  // Reminders and Notification Handlers
  const handleAddReminder = (rem: SmartReminder) => {
    const updated = [rem, ...reminders];
    setReminders(updated);
    localStorage.setItem('bayti_reminders', JSON.stringify(updated));

    // Also push a nice notification when a reminder is added!
    const newNotif: SmartNotification = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      title: 'تم جدولة تذكير جديد ⏰',
      message: `تمت إضافة تذكير "${rem.title}" بنجاح وتاريخ استحقاقه ${rem.dueDate}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      priority: rem.priority,
      category: 'financial'
    };
    const updatedNotifs = [newNotif, ...smartNotifications];
    setSmartNotifications(updatedNotifs);
    localStorage.setItem('bayti_smart_notifications', JSON.stringify(updatedNotifs));
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem('bayti_reminders', JSON.stringify(updated));
  };

  const handleUpdateReminderStatus = (id: string, status: 'completed' | 'missed' | 'upcoming') => {
    const updated = reminders.map(r => r.id === id ? { ...r, status } : r);
    setReminders(updated);
    localStorage.setItem('bayti_reminders', JSON.stringify(updated));

    // If marked completed, add a celebration/completion notification!
    if (status === 'completed') {
      const rem = reminders.find(r => r.id === id);
      if (rem) {
        const newNotif: SmartNotification = {
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          title: 'رائع! تم السداد والاكتمال 🎉',
          message: `تهانينا! لقد أكملت التزامك المالي بنجاح: "${rem.title}". ميزانية عائلتك تشكرك!`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'medium',
          category: 'financial'
        };
        const updatedNotifs = [newNotif, ...smartNotifications];
        setSmartNotifications(updatedNotifs);
        localStorage.setItem('bayti_smart_notifications', JSON.stringify(updatedNotifs));
      }
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    const updated = smartNotifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setSmartNotifications(updated);
    localStorage.setItem('bayti_smart_notifications', JSON.stringify(updated));
  };

  const handleArchiveNotification = (id: string) => {
    const updated = smartNotifications.map(n => n.id === id ? { ...n, isArchived: true } : n);
    setSmartNotifications(updated);
    localStorage.setItem('bayti_smart_notifications', JSON.stringify(updated));
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = smartNotifications.map(n => ({ ...n, isRead: true }));
    setSmartNotifications(updated);
    localStorage.setItem('bayti_smart_notifications', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    await api.logout();
    setUserToken(null);
    setCurrentUser(null);
    setUserProfile(null);
    setOnboardingCompleted(false);
    // Clear dynamic states
    setExpenses([]);
    setFamilyMembers([]);
    setReminders([]);
    setSmartNotifications([]);
    localStorage.clear();
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    const res = await api.deleteAccount();
    if (res.success) {
      setUserToken(null);
      setCurrentUser(null);
      setUserProfile(null);
      setOnboardingCompleted(false);
      setExpenses([]);
      setFamilyMembers([]);
      setReminders([]);
      setSmartNotifications([]);
      localStorage.clear();
      window.location.reload();
    } else {
      alert(res.error || 'حدث خطأ أثناء محاولة حذف الحساب.');
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('bayti_expenses');
    localStorage.removeItem('bayti_members');
    localStorage.removeItem('bayti_insights');
    localStorage.removeItem('bayti_budget');
    localStorage.removeItem('bayti_premium');
    localStorage.removeItem('bayti_current_member');
    localStorage.removeItem('bayti_reminders');
    localStorage.removeItem('bayti_smart_notifications');

    setExpenses(INITIAL_EXPENSES);
    setFamilyMembers(INITIAL_FAMILY_MEMBERS);
    setInsights(INITIAL_INSIGHTS);
    setMonthlyBudget(15000);
    setIsPremium(false);
    setCurrentMemberName('أحمد');
    setReminders(INITIAL_REMINDERS);
    setSmartNotifications(INITIAL_SMART_NOTIFICATIONS);
    
    window.location.reload();
  };

  const handleOpenQuickAction = (tab: 'scan' | 'voice' | 'text') => {
    setQuickActionInitialTab(tab);
    setIsQuickActionOpen(true);
  };

  const handleTogglePasscode = async () => {
    const nextVal = !isPasscodeEnabled;
    setIsPasscodeEnabled(nextVal);
    localStorage.setItem('bayti_passcode_enabled', String(nextVal));
    if (!nextVal) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
    if (userToken) {
      try {
        await api.updateProfile({ isPasscodeEnabled: nextVal });
      } catch (err) {
        console.error('Failed to sync passcode setting:', err);
      }
    }
  };

  const handleSaveAdminPasscode = async (passcode: string) => {
    setAdminPasscode(passcode);
    localStorage.setItem('bayti_admin_security_passcode', passcode);
    if (userToken) {
      try {
        await api.updateProfile({ adminPasscode: passcode });
      } catch (err) {
        console.error('Failed to sync admin passcode:', err);
      }
    }
  };

  const handleToggleFaceId = async () => {
    const nextVal = !isFaceIdEnabled;
    setIsFaceIdEnabled(nextVal);
    localStorage.setItem('bayti_faceid_enabled', String(nextVal));
    if (userToken) {
      try {
        await api.updateProfile({ isFaceIdEnabled: nextVal });
      } catch (err) {
        console.error('Failed to sync faceid setting:', err);
      }
    }
  };

  const handleToggleHideValues = async () => {
    const nextVal = !hideFinancialValues;
    setHideFinancialValues(nextVal);
    localStorage.setItem('bayti_hide_values', String(nextVal));
    if (userToken) {
      try {
        await api.updateProfile({ hideFinancialValues: nextVal });
      } catch (err) {
        console.error('Failed to sync hideValues setting:', err);
      }
    }
  };

  const handleToggleHideNotifications = async () => {
    const nextVal = !hideNotificationsContent;
    setHideNotificationsContent(nextVal);
    localStorage.setItem('bayti_hide_notifications', String(nextVal));
    if (userToken) {
      try {
        await api.updateProfile({ hideNotificationsContent: nextVal });
      } catch (err) {
        console.error('Failed to sync hideNotifications setting:', err);
      }
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setActiveCurrency(currency);
    localStorage.setItem('bayti_active_currency', currency);
    if (userToken) {
      try {
        await api.updateProfile({ currency });
      } catch (err) {
        console.error('Failed to sync currency:', err);
      }
    }
  };

  if (!isSplashFinished) {
    return <SplashScreen onFinish={() => setIsSplashFinished(true)} />;
  }

  if (isPasscodeEnabled && !isUnlocked) {
    return (
      <SecurityGate 
         isFaceIdEnabled={isFaceIdEnabled} 
         onUnlock={() => setIsUnlocked(true)} 
      />
    );
  }

  if (!userToken) {
    return (
      <UserAuth 
        onLoginSuccess={(token, user, profile, onboarding, settings) => {
          setUserToken(token);
          setCurrentUser(user);
          setUserProfile(profile);
          setIsPremium(profile?.subscription === 'Premium');
          localStorage.setItem('bayti_premium', String(profile?.subscription === 'Premium'));
          setOnboardingCompleted(onboarding?.onboardingCompleted);
          if (profile?.fullName) {
            setCurrentMemberName(profile.fullName);
          }
          if (profile?.currency) {
            setActiveCurrency(profile.currency);
            localStorage.setItem('bayti_active_currency', profile.currency);
          }
          if (settings) {
            setIsPasscodeEnabled(settings.isPasscodeEnabled);
            setIsFaceIdEnabled(settings.isFaceIdEnabled);
            setHideFinancialValues(settings.hideFinancialValues);
            setHideNotificationsContent(settings.hideNotificationsContent);
            localStorage.setItem('bayti_passcode_enabled', String(settings.isPasscodeEnabled));
            localStorage.setItem('bayti_faceid_enabled', String(settings.isFaceIdEnabled));
            localStorage.setItem('bayti_hide_values', String(settings.hideFinancialValues));
            localStorage.setItem('bayti_hide_notifications', String(settings.hideNotificationsContent));
          }
        }} 
      />
    );
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans select-none pb-20 transition-colors duration-300">
      
      {/* App Top Glass Header */}
      <AppHeader
        userEmail={currentUser?.email || "d.pegasus.store@gmail.com"}
        isPremium={isPremium}
        notificationsCount={smartNotifications.filter(n => !n.isRead && !n.isArchived).length}
        onOpenNotifications={() => setShowNotifications(true)}
        userName={userProfile?.fullName || onboardingData?.name || currentUser?.email}
        userAvatar={userProfile?.profilePicture || onboardingData?.avatar || "👨🏻‍💼"}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          const next = !isDarkMode;
          setIsDarkMode(next);
          localStorage.setItem('bayti_dark_mode', String(next));
        }}
      />

      {/* Floating Active Member Switcher (Masterpiece touch for Cairo families) */}
      <div className="bg-white border-b border-slate-100 py-2 px-4 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold shrink-0">
          <span>العضو النشط الآن:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {familyMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setCurrentMemberName(m.name);
                localStorage.setItem('bayti_current_member', m.name);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                currentMemberName === m.name
                  ? 'bg-blue-600 text-white shadow-xs scale-105'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span>{m.avatar}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-6">
        
        {/* Render Tab Contents */}
        {activeTab === 'home' && (
          <HomeTab
            expenses={expenses}
            insights={insights}
            familyMembers={familyMembers}
            monthlyBudget={monthlyBudget}
            onOpenQuickAction={handleOpenQuickAction}
            onRefreshInsights={() => triggerBackgroundInsights(expenses, familyMembers)}
            loadingInsights={loadingInsights}
            onViewAllExpenses={() => setActiveTab('expenses')}
            onboardingData={onboardingData}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            familyMembers={familyMembers.map(m => m.name)}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersTab
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onUpdateReminderStatus={handleUpdateReminderStatus}
            onDeleteReminder={handleDeleteReminder}
            smartNotifications={smartNotifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onArchiveNotification={handleArchiveNotification}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            expenses={expenses}
            familyMembers={familyMembers}
            monthlyBudget={monthlyBudget}
            onboardingData={onboardingData}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'family' && (
          <FamilyTab
            familyMembers={familyMembers}
            expenses={expenses}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            expenses={expenses}
            familyMembers={familyMembers}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            monthlyBudget={monthlyBudget}
            onChangeMonthlyBudget={handleUpdateBudget}
            isPremium={isPremium}
            onTogglePremium={handleTogglePremium}
            onResetData={handleResetData}
            userEmail={currentUser?.email || "d.pegasus.store@gmail.com"}
            currentUser={currentUser}
            userProfile={userProfile}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            isPasscodeEnabled={isPasscodeEnabled}
            onTogglePasscode={handleTogglePasscode}
            isFaceIdEnabled={isFaceIdEnabled}
            onToggleFaceId={handleToggleFaceId}
            hideFinancialValues={hideFinancialValues}
            onToggleHideValues={handleToggleHideValues}
            hideNotificationsContent={hideNotificationsContent}
            onToggleHideNotifications={handleToggleHideNotifications}
            activeCurrency={activeCurrency}
            onChangeCurrency={handleCurrencyChange}
            onOpenExport={() => setShowExportModal(true)}
            onOpenPremium={() => setShowPremiumModal(true)}
            adminPasscode={adminPasscode}
            onSaveAdminPasscode={handleSaveAdminPasscode}
          />
        )}

      </main>

      {/* Bottom App Navigation Tabs */}
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Magical Intelligent Insertion Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onAddExpense={handleAddExpense}
        currentMember={currentMemberName}
      />

      {/* Sliding notifications tray */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col animate-slide-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                <Bell className="w-4 h-4" />
                <h3 className="text-xs font-black">التنبيهات الذكية</h3>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {smartNotifications.filter(n => !n.isRead && !n.isArchived).length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-10 font-bold">
                  لا توجد تنبيهات غير مقروءة حالياً 🎉
                </div>
              ) : (
                smartNotifications.filter(n => !n.isRead && !n.isArchived).map((notif) => {
                  const displayTitle = hideNotificationsContent ? 'تنبيه مالي آمن 🔒' : notif.title;
                  const displayMessage = hideNotificationsContent 
                    ? 'تم تشفير تفاصيل هذا الإشعار بموجب إعدادات الخصوصية والأمان النشطة.' 
                    : notif.message;
                  return (
                    <div key={notif.id} className="p-3 bg-blue-50/50 border border-blue-50 text-xs text-slate-700 rounded-2xl leading-relaxed">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-800">{displayTitle}</span>
                        <button 
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold hover:bg-blue-200 transition-colors"
                        >
                          مقروء
                        </button>
                      </div>
                      <p className="font-medium">{displayMessage}</p>
                    </div>
                  );
                })
              )}
              <div className="p-3 bg-emerald-50/50 border border-emerald-50 text-xs text-slate-700 rounded-2xl leading-relaxed font-semibold">
                {hideNotificationsContent 
                  ? 'توصية مالية خاصة مشفرة 🔒' 
                  : 'توصية: يمكنك توفير ما يصل إلى ٨٠٠ ج.م هذا الشهر عن طريق تقليل طلبات الدليفري بنسبة ١٥٪.'}
              </div>
            </div>

            <button
              onClick={handleMarkAllNotificationsRead}
              className="w-full py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              تحديد المقروء بالكامل
            </button>
          </div>
        </div>
      )}

      {/* Premium Subscription Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        isPremium={isPremium}
        onTogglePremium={handleTogglePremium}
      />

      {/* Smart reports PDF / CSV / Excel Exporter */}
      <SmartExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        expenses={expenses}
        familyMembers={familyMembers}
        monthlyBudget={monthlyBudget}
      />

      {/* Premium PWA Installation Prompt */}
      <PWAInstallDialog />

    </div>
  );
}
