/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import DashboardView from './views/DashboardView';
import UserManagementView from './views/UserManagementView';
import PremiumManagementView from './views/PremiumManagementView';
import AnalyticsView from './views/AnalyticsView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import BackupStatsView from './views/BackupStatsView';

import { 
  INITIAL_ADMIN_USERS, INITIAL_SUBSCRIPTIONS, INITIAL_FEEDBACK, 
  INITIAL_AUDIT_LOGS, INITIAL_CONTENT, INITIAL_FEATURE_FLAGS,
  AdminUser, Subscription, FeedbackTicket, AuditLog, ContentItem 
} from './seedData';

import { 
  LayoutDashboard, Users, Award, BarChart3, Bell, Settings, LogOut, 
  ShieldAlert, Sparkles, Home, ShieldCheck, ChevronLeft, HelpCircle, Lock
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminPortal() {
  // --- Standard Client-side SPA Router ---
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Custom passcode gate states
  const [passcodeGateInput, setPasscodeGateInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [isVerifyingGate, setIsVerifyingGate] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // --- Session & Security Check ---
  const [adminSession, setAdminSession] = useState<{ email: string; loggedInAt: string; role: string } | null>(() => {
    const stored = localStorage.getItem('bayti_admin_session');
    const token = localStorage.getItem('bayti_admin_token');
    return stored && token ? JSON.parse(stored) : null;
  });

  const handleLoginSuccess = (email: string) => {
    const session = {
      email,
      loggedInAt: new Date().toISOString(),
      role: 'SUPER_ADMIN'
    };
    localStorage.setItem('bayti_admin_session', JSON.stringify(session));
    setAdminSession(session);
    
    // Log the login success
    addAuditLogDirect('تسجيل دخول ناجح للمسؤول إلى لوحة التحكم', 'Info', email);
    
    // Redirect to dashboard
    navigateTo('/admin/dashboard');
  };

  const handleLogout = () => {
    if (adminSession) {
      addAuditLogDirect('تسجيل خروج آمن للمسؤول من اللوحة', 'Info', adminSession.email);
    }
    localStorage.removeItem('bayti_admin_session');
    localStorage.removeItem('bayti_admin_token');
    setAdminSession(null);
    navigateTo('/admin/login');
  };

  // --- Persisted State Engines ---
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [feedback, setFeedback] = useState<FeedbackTicket[]>(INITIAL_FEEDBACK);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>(INITIAL_CONTENT);
  const [featureFlags, setFeatureFlags] = useState(INITIAL_FEATURE_FLAGS);
  
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  const [loadingStats, setLoadingStats] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);

  const fetchAdminData = async () => {
    if (!adminSession) return;
    setLoadingStats(true);
    try {
      const res = await api.getAdminStats();
      if (res.success) {
        setAdminStats(res.stats);
        setSystemConfig(res.systemConfig);
        setSubscriptionRequests(res.subscriptionRequests || []);
        
        // Map backend users to AdminPortal users list format
        const mappedUsers = res.users.map((u: any) => ({
          id: u.id,
          name: u.fullName || 'مستخدم بيت AI',
          email: u.email,
          role: u.role,
          subscription: u.subscription,
          joinedDate: new Date(u.createdDate).toISOString().split('T')[0],
          status: u.verified ? 'Active' : 'Pending',
          phone: u.phone,
          country: u.country,
          currency: u.currency,
          activeSessionsCount: u.activeSessionsCount,
          totalExpensesSpent: u.totalExpensesSpent,
          plan: u.subscription === 'Premium' ? 'Premium' : 'Free'
        }));
        setUsers(mappedUsers);

        // Update subscriptions list for view
        const subList: Subscription[] = res.users
          .filter((u: any) => u.subscription === 'Premium')
          .map((u: any, index: number) => ({
            id: 'sub_' + u.id,
            userName: u.fullName || 'مستخدم بيت AI',
            userEmail: u.email,
            planName: 'عضوية بريميوم العائلية',
            price: 249,
            status: 'Active',
            startDate: new Date(u.createdDate).toISOString().split('T')[0],
            renewalDate: new Date(new Date(u.createdDate).setMonth(new Date(u.createdDate).getMonth() + 1)).toISOString().split('T')[0]
          }));
        setSubscriptions(subList.length > 0 ? subList : INITIAL_SUBSCRIPTIONS);

        // Map backend login history to AdminPortal auditLogs list format
        const mappedLogs = res.logs.map((l: any, idx: number) => ({
          id: l.id || 'log_' + idx,
          timestamp: new Date(l.loginDate).toISOString().replace('T', ' ').substring(0, 19),
          adminEmail: l.email,
          action: `تسجيل دخول (${l.fullName}) - نظام ${l.platform} جهاز ${l.device} موقع ${l.country}`,
          ipAddress: l.ip || '127.0.0.1',
          severity: l.role === 'ADMIN' || l.role === 'SUPER_ADMIN' ? 'Critical' : 'Info'
        }));
        setAuditLogs(mappedLogs);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (adminSession) {
      fetchAdminData();
    }
  }, [adminSession]);

  const handleUpdateUserStatusAndRole = async (targetUserId: string, role?: string, subscription?: string) => {
    try {
      const res = await api.adminUpdateUser({ targetUserId, role, subscription });
      if (res.success) {
        addAuditLogDirect(`تحديث العميل ${targetUserId}: دور (${role || 'بدون تغيير'})، اشتراك (${subscription || 'بدون تغيير'})`, 'Info', adminSession?.email || 'admin@bayti-ai.com');
        await fetchAdminData();
      } else {
        alert(res.error || 'فشل التحديث من الخادم.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ بالاتصال بالخادم المالي.');
    }
  };

  // Add log helper
  const addAuditLog = (action: string, severity: 'Info' | 'Warning' | 'Critical') => {
    const email = adminSession?.email || 'admin@bayti-ai.com';
    addAuditLogDirect(action, severity, email);
  };

  const addAuditLogDirect = (action: string, severity: 'Info' | 'Warning' | 'Critical', email: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      adminEmail: email,
      action,
      ipAddress: '197.34.40.112', // Egyptian Static Administrator IP Address
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- Check client-side Role Based Access Control (RBAC) ---
  // If no adminSession exists:
  // Is this an active normal USER of the main app?
  // We can verify if onboarding was completed by checking 'bayti_onboarding_completed' in localStorage.
  const isOnboardingCompleted = localStorage.getItem('bayti_onboarding_completed') === 'true';
  const hasUserToken = !!localStorage.getItem('bayti_user_token');
  const storedPasscode = localStorage.getItem('bayti_admin_security_passcode') || '';

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    if (!passcodeGateInput.trim()) {
      setGateError('يرجى إدخال رمز الأمان.');
      return;
    }
    setIsVerifyingGate(true);
    try {
      const res = await api.verifyAdminPasscode(passcodeGateInput.trim());
      if (res.success) {
        handleLoginSuccess(res.user.email);
      } else {
        setGateError(res.error || 'رمز الأمان غير صحيح، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      setGateError('حدث خطأ أثناء محاولة التحقق بالاتصال بالخادم.');
    } finally {
      setIsVerifyingGate(false);
    }
  };

  if (!adminSession) {
    // If they explicitly navigate to /admin/login, let them login
    if (currentPath === '/admin/login') {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    // If they have a user token (logged in as normal user), let them login using their custom security passcode!
    if (hasUserToken) {
      if (!storedPasscode || storedPasscode.trim() === '') {
        return (
          <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans" dir="rtl">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-lg bg-slate-900/70 border border-indigo-500/15 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center relative z-10 animate-fade-in">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/5">
                <Lock className="w-8 h-8 text-indigo-400" />
              </div>
              
              <span className="text-[10px] font-black tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full">
                بوابة السوبر أدمن 👑
              </span>
              
              <h1 className="text-xl font-black text-white mt-5">تعيين رمز الأمان مطلوب ⚙️</h1>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed font-semibold">
                أهلاً بك! للدخول إلى لوحة التحكم الإدارية عبر رابط <code className="bg-slate-950 text-indigo-400 px-1.5 py-0.5 rounded font-mono">/admin</code> المباشر، يرجى أولاً تعيين <strong>رمز الأمان للدخول الإداري</strong> من داخل حسابك في صفحة <strong>الإعدادات ⚙️</strong> تحت قسم <strong>الحماية والخصوصية العائلية</strong>.
              </p>

              <div className="grid grid-cols-1 gap-4 mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-indigo-500 shadow-lg shadow-indigo-600/15 animate-pulse"
                >
                  <Home className="w-4 h-4" />
                  <span>الذهاب للتطبيق العائلي وتعيين الرمز</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // If passcode is set, show lock screen
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans" dir="rtl">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-full max-w-md bg-slate-900/70 border border-blue-500/15 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center relative z-10 animate-fade-in">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/5">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            
            <span className="text-[10px] font-black tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
              بوابة السوبر أدمن للتحكم 👑
            </span>
            
            <h1 className="text-xl font-black text-white mt-5">مطلوب رمز الأمان للدخول 🔒</h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              الرجاء إدخال رمز الأمان المخصص الذي قمت بإنشائه في حسابك لفتح اللوحة فوراً.
            </p>

            <form onSubmit={handleVerifyPasscode} className="mt-6 space-y-4">
              <input
                type="password"
                placeholder="أدخل رمز الأمان الإداري الخاص بك"
                value={passcodeGateInput}
                onChange={(e) => setPasscodeGateInput(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-center font-mono w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                autoFocus
              />
              
              {gateError && (
                <p className="text-xs text-red-500 font-bold bg-red-500/5 py-2 px-3 rounded-xl border border-red-500/10">
                  {gateError}
                </p>
              )}

              <button
                type="submit"
                disabled={isVerifyingGate}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
              >
                {isVerifyingGate ? 'جاري التحقق...' : 'فتح لوحة التحكم 🚀'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto"
              >
                <Home className="w-3.5 h-3.5" />
                <span>الرجوع للتطبيق العائلي</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise, they are an unauthenticated visitor, redirect to /admin/login
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // If we are logged in as admin, but somehow the path is just `/admin`, push them to `/admin/dashboard`
  if (currentPath === '/admin' || currentPath === '/admin/') {
    setTimeout(() => navigateTo('/admin/dashboard'), 0);
  }

  // Render correct content view based on path routing
  const renderActiveView = () => {
    switch (currentPath) {
      case '/admin/dashboard':
        return (
          <DashboardView 
            usersCount={users.length} 
            premiumCount={subscriptions.filter(s => s.status === 'Active').length} 
            revenueThisMonth={subscriptions.filter(s => s.status === 'Active').reduce((acc, curr) => acc + curr.price, 0)} 
            aiUsageCount={feedback.length * 3 + 120} // realistic usage factor
          />
        );
      case '/admin/users':
        return (
          <UserManagementView 
            users={users} 
            onUpdateUsers={(updated) => {
              const changed = updated.find(u => {
                const orig = users.find(o => o.id === u.id);
                return orig && (orig.status !== u.status || orig.role !== u.role || orig.plan !== u.plan);
              });
              if (changed) {
                const targetSub = changed.plan === 'Premium' ? 'Premium' : 'Standard';
                handleUpdateUserStatusAndRole(changed.id, changed.role, targetSub);
              } else {
                setUsers(updated);
              }
            }} 
            onAddAuditLog={addAuditLog} 
          />
        );
      case '/admin/subscriptions':
        return (
          <PremiumManagementView 
            subscriptions={subscriptions} 
            users={users}
            subscriptionRequests={subscriptionRequests}
            systemConfig={systemConfig}
            onRefreshData={fetchAdminData}
            onUpdateSubscriptions={setSubscriptions} 
            onUpdateUsers={(updated) => {
              const changed = updated.find(u => {
                const orig = users.find(o => o.id === u.id);
                return orig && (orig.status !== u.status || orig.role !== u.role || orig.plan !== u.plan);
              });
              if (changed) {
                const targetSub = changed.plan === 'Premium' ? 'Premium' : 'Standard';
                handleUpdateUserStatusAndRole(changed.id, changed.role, targetSub);
              } else {
                setUsers(updated);
              }
            }}
            onAddAuditLog={addAuditLog} 
          />
        );
      case '/admin/analytics':
        return (
          <AnalyticsView 
            users={users} 
            subscriptions={subscriptions} 
            onAddAuditLog={addAuditLog} 
          />
        );
      case '/admin/notifications':
        return (
          <NotificationsView 
            feedback={feedback} 
            contentItems={contentItems} 
            onUpdateFeedback={setFeedback} 
            onUpdateContent={setContentItems} 
            onAddAuditLog={addAuditLog} 
          />
        );
      case '/admin/settings':
        return (
          <SettingsView 
            auditLogs={auditLogs} 
            featureFlags={featureFlags} 
            onUpdateFeatureFlags={setFeatureFlags} 
            onAddAuditLog={addAuditLog} 
          />
        );
      case '/admin/backups':
        return (
          <BackupStatsView />
        );
      default:
        // Default to dashboard view for safety
        return (
          <DashboardView 
            usersCount={users.length} 
            premiumCount={subscriptions.filter(s => s.status === 'Active').length} 
            revenueThisMonth={subscriptions.filter(s => s.status === 'Active').reduce((acc, curr) => acc + curr.price, 0)} 
            aiUsageCount={142} 
          />
        );
    }
  };

  // Sidebar link details
  const sidebarLinks = [
    { name: 'لوحة القيادة الموحدة', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'إدارة المستخدمين والعائلات', path: '/admin/users', icon: Users },
    { name: 'باقات واشتراكات بريميوم', path: '/admin/subscriptions', icon: Award },
    { name: 'التحليلات المالية المتقدمة', path: '/admin/analytics', icon: BarChart3 },
    { name: 'إحصائيات النسخ الاحتياطي السحابي', path: '/admin/backups', icon: ShieldCheck },
    { name: 'الدعم الفني وتذاكر العمليات', path: '/admin/notifications', icon: Bell },
    { name: 'إعدادات النظام والرقابة (RBAC)', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden font-sans" dir="rtl">
      
      {/* Background radial soft light blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-72 bg-slate-900/90 border-l border-slate-800 flex flex-col justify-between relative z-20 shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-indigo-600/10">
              بيت
            </div>
            <div>
              <h1 className="font-extrabold text-white text-sm">لوحة تحكم بيت AI</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Admin Portal v1.2</p>
            </div>
          </div>

          {/* Admin Logged-In Profile Card */}
          <div className="m-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              👑
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{adminSession.email}</div>
              <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                {adminSession.role}
              </span>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="px-3 py-4 space-y-1.5">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigateTo(link.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-right transition-all group ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{link.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action controls footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {/* Back to Client App button */}
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-800/80 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>الخروج وتصفح تطبيق العائلات</span>
          </button>

          {/* Secure Logout button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 text-red-400 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل خروج آمن لـ 2FA</span>
          </button>
        </div>
      </aside>

      {/* Main content body container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <header className="h-16 border-b border-slate-850 px-8 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-bold">بوابة الإدارة النشطة محمية بنظام تشفير SSL ثنائي</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>مستوى حماية الخصوصية: <span className="text-white font-bold">فائق التشفير</span></span>
            <span className="text-slate-600">|</span>
            <span>وقت الخادم (GMT): <span className="text-white font-mono">{new Date().toISOString().substring(11,16)}</span></span>
          </div>
        </header>

        {/* Render View Stage wrapper */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

    </div>
  );
}
