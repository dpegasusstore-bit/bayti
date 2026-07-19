/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subscription, AdminUser } from '../seedData';
import { 
  Sparkles, ShieldCheck, ShieldAlert, Award, Calendar, DollarSign, 
  Trash2, Plus, Clock, Check, X, RotateCcw, AlertTriangle, Eye, Phone, Edit, Save
} from 'lucide-react';
import { api } from '../../../services/api';

interface PremiumManagementViewProps {
  subscriptions: Subscription[];
  users: AdminUser[];
  subscriptionRequests?: any[];
  systemConfig?: any;
  onRefreshData?: () => Promise<void>;
  onUpdateSubscriptions: (subs: Subscription[]) => void;
  onUpdateUsers: (users: AdminUser[]) => void;
  onAddAuditLog: (action: string, severity: 'Info' | 'Warning' | 'Critical') => void;
}

export default function PremiumManagementView({ 
  subscriptions, 
  users, 
  subscriptionRequests = [], 
  systemConfig, 
  onRefreshData,
  onUpdateSubscriptions, 
  onUpdateUsers, 
  onAddAuditLog 
}: PremiumManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  
  // States for system settings
  const [editingConfig, setEditingConfig] = useState(false);
  const [cfgMonthlyPrice, setCfgMonthlyPrice] = useState(systemConfig?.monthlyPrice || 99);
  const [cfgYearlyPrice, setCfgYearlyPrice] = useState(systemConfig?.yearlyPrice || 599);
  const [cfgVodafoneNumber, setCfgVodafoneNumber] = useState(systemConfig?.vodafoneNumber || '01002345678');
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgSuccess, setCfgSuccess] = useState('');

  // States for manual creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [addBillingCycle, setAddBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Lightbox for screenshot
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState<string | null>(null);

  // Rejection handling state
  const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // States for extension
  const [extendingSub, setExtendingSub] = useState<Subscription | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extensionSuccess, setExtensionSuccess] = useState(false);

  // Trial settings state
  const [trialDurationDays, setTrialDurationDays] = useState(7);
  const [isTrialAutoEnabled, setIsTrialAutoEnabled] = useState(true);

  // Filter subscriptions
  const filteredSubs = subscriptions.filter((sub) => {
    if (activeTab === 'active') return sub.status === 'Active';
    if (activeTab === 'expired') return sub.status === 'Expired' || sub.status === 'Cancelled' || sub.status === 'Refunded';
    return true;
  });

  // Handle saving system configs
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfgSaving(true);
    setCfgSuccess('');
    try {
      const res = await api.adminUpdateConfig({
        monthlyPrice: cfgMonthlyPrice,
        yearlyPrice: cfgYearlyPrice,
        vodafoneNumber: cfgVodafoneNumber
      });
      if (res.success) {
        setCfgSuccess('تم حفظ إعدادات النظام وتحديث الأسعار بنجاح! ✨');
        setEditingConfig(false);
        if (onRefreshData) await onRefreshData();
        onAddAuditLog('تحديث أسعار باقات بريميوم والرقم الإداري لفودافون كاش', 'Warning');
        setTimeout(() => setCfgSuccess(''), 3000);
      } else {
        alert(res.error || 'فشل الحفظ.');
      }
    } catch (err) {
      alert('حدث خطأ بالاتصال بالخادم المالي.');
    } finally {
      setCfgSaving(false);
    }
  };

  // Handle Approving a request
  const handleApproveRequest = async (requestId: string, userEmail: string) => {
    if (!window.confirm('هل تود الموافقة على هذا الطلب وتفعيل العضوية بريميوم للعائلة بشكل فوري؟')) {
      return;
    }
    setActionLoadingId(requestId);
    try {
      const res = await api.adminActionSubscription({
        requestId,
        action: 'Approve'
      });
      if (res.success) {
        onAddAuditLog(`تأكيد عملية التحويل المالي وتفعيل باقة بريميوم لحساب العميل (${userEmail})`, 'Info');
        if (onRefreshData) await onRefreshData();
      } else {
        alert(res.error || 'فشل معالجة الطلب.');
      }
    } catch (err) {
      alert('خطأ أثناء التفعيل.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Rejecting a request
  const handleRejectRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionRequestId) return;
    if (!rejectionReason.trim()) {
      alert('يرجى تحديد سبب الرفض لتوجيه العميل بشكل صحيح.');
      return;
    }

    setActionLoadingId(rejectionRequestId);
    try {
      const res = await api.adminActionSubscription({
        requestId: rejectionRequestId,
        action: 'Reject',
        rejectionReason
      });
      if (res.success) {
        onAddAuditLog(`رفض طلب تحويل الترقية بسبب: ${rejectionReason}`, 'Warning');
        setRejectionRequestId(null);
        setRejectionReason('');
        if (onRefreshData) await onRefreshData();
      } else {
        alert(res.error || 'فشل معالجة الرفض.');
      }
    } catch (err) {
      alert('خطأ أثناء رفض الطلب.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Manual Creation
  const handleCreateManualSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail) return;

    const user = users.find(u => u.email === selectedUserEmail);
    if (!user) return;

    // Check if subscription already active
    const existing = subscriptions.find(s => s.userEmail === selectedUserEmail && s.status === 'Active');
    if (existing) {
      alert('هذا المستخدم يمتلك اشتراك نشط بالفعل!');
      return;
    }

    const price = addBillingCycle === 'yearly' ? 599 : 99;
    const durationDays = addBillingCycle === 'yearly' ? 365 : 30;

    const todayStr = new Date().toISOString().split('T')[0];
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + durationDays);
    const expStr = expDate.toISOString().split('T')[0];

    const newSub: Subscription = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      userName: user.name,
      userEmail: user.email,
      plan: `باقة العائلة الممتازة (${addBillingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
      status: 'Active',
      price,
      currency: 'EGP',
      billingCycle: addBillingCycle,
      startDate: todayStr,
      expiryDate: expStr
    };

    onUpdateSubscriptions([newSub, ...subscriptions]);
    
    const updatedUsers = users.map((u) => {
      if (u.email === selectedUserEmail) {
        return { ...u, plan: 'Premium' as const };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);

    onAddAuditLog(`ترقية حساب المستخدم (${user.email}) وتفعيل باقة Premium يدوياً`, 'Warning');
    setShowAddModal(false);
  };

  const handleCancelSubscription = (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    if (window.confirm(`هل أنت متأكد من رغبتك في إلغاء اشتراك المستخدم (${sub.userName})؟`)) {
      const updatedSubs = subscriptions.map((s) => {
        if (s.id === subId) {
          return { ...s, status: 'Cancelled' as const };
        }
        return s;
      });
      onUpdateSubscriptions(updatedSubs);

      const updatedUsers = users.map((u) => {
        if (u.email === sub.userEmail) {
          return { ...u, plan: 'Free' as const };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);

      onAddAuditLog(`إلغاء اشتراك باقة Premium للمستخدم (${sub.userEmail})`, 'Info');
    }
  };

  const handleRefundSubscription = (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    if (window.confirm(`هل أنت متأكد من رد قيمة الاشتراك (${sub.price} {sub.currency}) للمستخدم (${sub.userName}) وإيقاف اشتراكه؟`)) {
      const updatedSubs = subscriptions.map((s) => {
        if (s.id === subId) {
          return { ...s, status: 'Refunded' as const };
        }
        return s;
      });
      onUpdateSubscriptions(updatedSubs);

      const updatedUsers = users.map((u) => {
        if (u.email === sub.userEmail) {
          return { ...u, plan: 'Free' as const };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);

      onAddAuditLog(`استرداد رسوم الاشتراك بقيمة ${sub.price} ج.م للمستخدم (${sub.userEmail})`, 'Critical');
    }
  };

  const handleExtendInit = (sub: Subscription) => {
    setExtendingSub(sub);
    setExtendMonths(1);
    setExtensionSuccess(false);
  };

  const handleConfirmExtension = () => {
    if (!extendingSub) return;

    const currentExp = new Date(extendingSub.expiryDate);
    currentExp.setMonth(currentExp.getMonth() + extendMonths);
    const newExpStr = currentExp.toISOString().split('T')[0];

    const updatedSubs = subscriptions.map((s) => {
      if (s.id === extendingSub.id) {
        return { ...s, expiryDate: newExpStr };
      }
      return s;
    });
    onUpdateSubscriptions(updatedSubs);

    onAddAuditLog(`تمديد فترة صلاحية اشتراك (${extendingSub.userEmail}) بمقدار ${extendMonths} شهر/أشهر`, 'Info');
    setExtensionSuccess(true);
    setTimeout(() => {
      setExtendingSub(null);
      setExtensionSuccess(false);
    }, 2500);
  };

  const freeUsers = users.filter(u => u.plan === 'Free' && u.status === 'Active');
  const pendingRequests = subscriptionRequests.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-6 text-right font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الاشتراكات والمبيعات</h2>
          <p className="text-xs text-slate-400 mt-1">تتبع المبيعات الحية، تفعيل باقات Premium، تمديد الاشتراك، إرجاع الأموال وإدارة تجارب الاستخدام المجانية</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>تهيئة الأسعار ومحفظة الاستلام 💰</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/15 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تفعيل اشتراك يدوياً لعميل</span>
          </button>
        </div>
      </div>

      {/* Dynamic pricing success alerts */}
      {cfgSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{cfgSuccess}</span>
        </div>
      )}

      {/* Pricing and Vodafone Number configuration Panel */}
      {editingConfig && (
        <form onSubmit={handleSaveConfig} className="bg-slate-900/80 border border-amber-500/10 p-5 rounded-3xl space-y-4 animate-fade-in text-right">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
            <span>تهيئة أسعار الباقات وقناة تحويل مبيعات فودافون كاش</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">رقم محفظة التحويل الإدارية (Vodafone Cash)</label>
              <input
                type="tel"
                required
                value={cfgVodafoneNumber}
                onChange={(e) => setCfgVodafoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">قيمة الاشتراك الشهري (ج.م)</label>
              <input
                type="number"
                required
                value={cfgMonthlyPrice}
                onChange={(e) => setCfgMonthlyPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">قيمة الاشتراك السنوي (ج.م)</label>
              <input
                type="number"
                required
                value={cfgYearlyPrice}
                onChange={(e) => setCfgYearlyPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 text-xs">
            <button
              type="button"
              onClick={() => setEditingConfig(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={cfgSaving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-xl font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              {cfgSaving ? 'جاري الحفظ...' : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ وتعميم التحديثات</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 1. Pending Vodafone Cash Requests Queue */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl space-y-4 text-right">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-amber-500" />
          <span>طلبات التحويل والترقية المعلقة ({pendingRequests.length})</span>
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          قم بمراجعة المبالغ الواردة على محفظة Vodafone Cash الإدارية الخاصة بك، ومطابقة لقطة الشاشة ثم اتخذ القرار.
        </p>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 text-center text-xs text-slate-500 font-bold">
            لا توجد طلبات ترقية معلقة حالياً على النظام. جميع الحسابات تمت تسويتها بنجاح. ✅
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl relative space-y-3.5 flex flex-col justify-between">
                
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-black">
                      {req.billingCycle === 'yearly' ? 'طلب ترقية سنوية 🌟' : 'طلب ترقية شهرية 📅'}
                    </span>
                    <h4 className="text-xs font-black text-white mt-1.5">{req.userEmail}</h4>
                    <p className="text-[9px] text-slate-400 font-mono">في {new Date(req.requestDate).toLocaleString('ar-EG')}</p>
                  </div>
                  
                  {/* Thumbnail Screenshot */}
                  {req.screenshotBase64 && (
                    <button
                      type="button"
                      onClick={() => setActiveScreenshotUrl(req.screenshotBase64)}
                      className="w-16 h-12 rounded-lg overflow-hidden border border-slate-800 shrink-0 relative group shadow-lg"
                      title="تكبير الإيصال"
                    >
                      <img src={req.screenshotBase64} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/30 text-[10px] font-semibold text-slate-300">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[8.5px] block">رقم المحفظة المرسلة:</span>
                    <span className="font-mono text-white flex items-center gap-1 font-bold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {req.senderNumber}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-slate-500 text-[8.5px] block">القيمة المطلوبة:</span>
                    <span className="font-mono text-emerald-400 font-black">{req.amount} ج.م</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setRejectionRequestId(req.id)}
                    className="flex-1 py-2 bg-red-950/50 hover:bg-red-900 text-red-400 border border-red-900/30 rounded-xl font-bold transition-all"
                  >
                    رفض التحويل
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId !== null}
                    onClick={() => handleApproveRequest(req.id, req.userEmail)}
                    className="flex-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10"
                  >
                    {actionLoadingId === req.id ? 'جاري التفعيل...' : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>موافقة وتفعيل الباقة ✅</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trial Settings Panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            <span>فترة التجربة المجانية (Free Trial)</span>
          </h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">تغيير إعدادات تفعيل الفترة التجريبية التلقائية للمستخدمين الجدد المسجلين.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/60 p-3 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold shrink-0">مدة التجربة:</span>
          <input
            type="number"
            min={1}
            max={90}
            value={trialDurationDays}
            onChange={(e) => setTrialDurationDays(Number(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-800 focus:border-indigo-500 py-1.5 px-2 rounded-lg text-xs text-center font-bold font-mono focus:outline-none"
          />
          <span className="text-xs text-slate-300">يوم</span>
        </div>
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800/60 p-3.5 rounded-2xl">
          <span className="text-xs text-slate-300 font-bold">تفعيل تلقائي عند التسجيل:</span>
          <button
            onClick={() => setIsTrialAutoEnabled(!isTrialAutoEnabled)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all ${isTrialAutoEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
          >
            <div className={`w-4.5 h-4.5 bg-white rounded-full transition-all ${isTrialAutoEnabled ? 'translate-x-0' : '-translate-x-5'}`} />
          </button>
        </div>
      </div>

      {/* Subscription Tabs & Counters */}
      <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'active', 'expired'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'كل عمليات الشراء' : tab === 'active' ? 'الاشتراكات النشطة' : 'الملغية والمستردة'}
            </button>
          ))}
        </div>
        <div className="flex gap-6 text-xs font-semibold">
          <div className="text-slate-400">
            إجمالي المحصل: <span className="text-emerald-400 font-mono font-bold">{(subscriptions.filter(s=>s.status==='Active').reduce((acc,curr)=>acc+curr.price, 0) + 120500).toLocaleString()} ج.م</span>
          </div>
          <div className="text-slate-400">
            نشط حالياً: <span className="text-indigo-400 font-mono font-bold">{subscriptions.filter(s=>s.status==='Active').length} باقات</span>
          </div>
        </div>
      </div>

      {/* Subscriptions List Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-slate-300">
            <thead className="text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800 font-bold uppercase">
              <tr>
                <th scope="col" className="px-6 py-4">المستفيد</th>
                <th scope="col" className="px-6 py-4">الباقة المتفاعلة</th>
                <th scope="col" className="px-6 py-4">القيمة والعملة</th>
                <th scope="col" className="px-6 py-4">تاريخ البدء</th>
                <th scope="col" className="px-6 py-4">تاريخ الانتهاء</th>
                <th scope="col" className="px-6 py-4">حالة العملية</th>
                <th scope="col" className="px-6 py-4 text-left">إجراءات المبيعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-bold text-xs">
                    لا توجد اشتراكات مطابقة لهذا الخيار حالياً.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-white">{sub.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{sub.plan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-emerald-400">{sub.price} {sub.currency}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{sub.billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400">{sub.startDate}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{sub.expiryDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        sub.status === 'Cancelled' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                        sub.status === 'Refunded' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {sub.status === 'Active' ? 'نشط وصالح' : 
                         sub.status === 'Cancelled' ? 'ملغي ومستنفذ' : 
                         sub.status === 'Refunded' ? 'مسترد ومغلق' : 'منتهي الصلاحية'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {sub.status === 'Active' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleExtendInit(sub)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            title="تمديد الصلاحية"
                          >
                            تعديل/تمديد
                          </button>
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            title="إيقاف الاشتراك"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => handleRefundSubscription(sub.id)}
                            className="bg-red-950/40 hover:bg-red-900 text-red-400 text-[10px] font-bold px-2 py-1 rounded border border-red-900/30 transition-colors"
                            title="إرجاع المبلغ للبطاقة"
                          >
                            إرجاع مالي
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activeScreenshotUrl && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              onClick={() => setActiveScreenshotUrl(null)}
              className="absolute -top-12 left-0 text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full font-bold transition-all flex items-center gap-1 text-xs"
            >
              <X className="w-4 h-4" />
              <span>إغلاق المعاينة</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2.5 overflow-hidden w-full aspect-video flex items-center justify-center">
              <img src={activeScreenshotUrl} alt="Receipt large zoom" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Dialog */}
      {rejectionRequestId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRejectRequestSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right space-y-4">
            <h3 className="text-base font-black text-red-400">تحديد سبب رفض الترقية</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يرجى كتابة سبب رفض الفاتورة لمساعدة المستخدم في تصحيح العملية ومحاولة الدفع مجدداً.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">سبب الرفض الموجه للمستخدم:</label>
              <select
                onChange={(e) => setRejectionReason(e.target.value)}
                value={rejectionReason}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none mb-2"
              >
                <option value="">-- اختر سبباً شائعاً --</option>
                <option value="المبلغ المحول غير متطابق مع قيمة الاشتراك المطلوبة">المبلغ المحول غير متطابق مع الاشتراك</option>
                <option value="لقطة الشاشة غير واضحة أو لا تحتوي على تفاصيل المعاملة">الفاتورة/الصورة غير واضحة</option>
                <option value="لم نستلم المبلغ على محفظة فودافون كاش المسجلة">التحويل لم يصل للمحفظة الإدارية</option>
                <option value="الصورة المرفوعة مكررة أو مستخدمة في طلب آخر">التحويل مستخدم مسبقاً</option>
              </select>
              <textarea
                required
                rows={3}
                placeholder="أو اكتب تفاصيل الرفض المخصصة هنا..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectionRequestId(null);
                  setRejectionReason('');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                إلغاء الإجراء
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-600/10"
              >
                <XCircleIcon className="w-4 h-4" />
                <span>تأكيد الرفض وإخطار العميل</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Premium Grant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right">
            <h3 className="text-base font-black text-white mb-2">تفعيل ميزات Premium يدوياً للمستخدم</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              يمكنك ترقية أي عائلة مجانية إلى باقة العائلة الممتازة Premium مجاناً لأغراض الدعم الفني، التسويق، أو العروض الخاصة.
            </p>

            <form onSubmit={handleCreateManualSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">اختر المستخدم المجاني النشط</label>
                <select
                  required
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                >
                  <option value="">-- اختر العميل --</option>
                  {freeUsers.map((u) => (
                    <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">الدورة المحاسبية</label>
                  <select
                    value={addBillingCycle}
                    onChange={(e) => setAddBillingCycle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">القيمة المسجلة</label>
                  <div className="bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white font-mono font-bold">
                    {addBillingCycle === 'yearly' ? '599 ج.م' : '99 ج.م'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end text-xs pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
                >
                  تأكيد التفعيل الفوري
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Extension Modal */}
      {extendingSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right">
            <h3 className="text-base font-black text-white mb-2">تمديد ميزات Premium الحالية</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              يمكنك تمديد فترة صلاحية اشتراك <span className="text-white font-bold">{extendingSub.userName}</span> مجاناً كتعويض أو تقدير مخصص.
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs space-y-1 mb-4">
              <div className="text-slate-400">تاريخ الانتهاء الحالي: <span className="font-mono text-white font-bold">{extendingSub.expiryDate}</span></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">فترة التمديد المطلوبة</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                >
                  <option value={1}>تمديد شهر واحد (+30 يوم)</option>
                  <option value={3}>تمديد ٣ أشهر (+90 يوم)</option>
                  <option value={6}>تمديد ٦ أشهر (+180 يوم)</option>
                  <option value={12}>تمديد سنة كاملة (+365 يوم)</option>
                </select>
              </div>

              {extensionSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs rounded-2xl p-3 flex items-center justify-center gap-2 font-bold">
                  <Check className="w-4 h-4" />
                  <span>تم التمديد وتعديل تاريخ انتهاء الصلاحية بنجاح!</span>
                </div>
              )}

              <div className="flex gap-3 justify-end text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingSub(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  إلغاء الإجراء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtension}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
                >
                  تأكيد التمديد الإضافي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback icon for reject action
function XCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-x-circle w-4 h-4"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
