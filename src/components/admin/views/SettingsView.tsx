/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog } from '../seedData';
import { 
  Settings, Shield, ShieldAlert, Key, ToggleLeft, ToggleRight,
  Database, RefreshCw, Calendar, Search, Filter, ShieldCheck, UserCheck, 
  HelpCircle, Check, Info, FileText
} from 'lucide-react';

interface SettingsViewProps {
  auditLogs: AuditLog[];
  featureFlags: {
    betaFeatures: boolean;
    maintenanceMode: boolean;
    forceUpdate: boolean;
    aiInsightsEngine: boolean;
    voiceInputPremium: boolean;
  };
  onUpdateFeatureFlags: (flags: any) => void;
  onAddAuditLog: (action: string, severity: 'Info' | 'Warning' | 'Critical') => void;
}

export default function SettingsView({
  auditLogs, featureFlags, onUpdateFeatureFlags, onAddAuditLog
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'rbac' | 'audit'>('system');

  // Pricing configuration state
  const [monthlyPrice, setMonthlyPrice] = useState(99);
  const [yearlyPrice, setYearlyPrice] = useState(599);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Security 2FA state
  const [admin2FA, setAdmin2FA] = useState(true);

  // Audit search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Info' | 'Warning' | 'Critical'>('All');

  // RBAC simulation state
  const [adminsList, setAdminsList] = useState([
    { email: 'admin@bayti-ai.com', name: 'المدير العام المالك', role: 'SUPER_ADMIN', permissions: ['ALL_ACCESS'] },
    { email: 'support@bayti-ai.com', name: 'مسؤول الدعم المالي', role: 'SUPPORT', permissions: ['READ_DATA', 'REPLY_TICKETS'] },
    { email: 'manager@bayti-ai.com', name: 'مدير عمليات الاشتراكات', role: 'ADMIN', permissions: ['READ_DATA', 'MANAGE_SUBSCRIPTIONS'] },
  ]);
  const [rbacSuccess, setRbacSuccess] = useState(false);

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  // Feature Flag toggle handler
  const handleToggleFlag = (key: keyof typeof featureFlags) => {
    const updatedFlags = { ...featureFlags, [key]: !featureFlags[key] };
    onUpdateFeatureFlags(updatedFlags);
    
    const flagNames: Record<string, string> = {
      betaFeatures: 'ميزات البيتا التجريبية',
      maintenanceMode: 'وضع الصيانة للمنصة',
      forceUpdate: 'تحديث التطبيق الإجباري',
      aiInsightsEngine: 'محرك استشاري الذكاء الاصطناعي',
      voiceInputPremium: 'إضافة الأوامر الصوتية كخاصية مدفوعة'
    };

    onAddAuditLog(
      `تعديل مفتاح الميزة (${flagNames[key]}) إلى ${updatedFlags[key] ? 'نشط' : 'معطل'}`,
      key === 'maintenanceMode' ? 'Critical' : 'Warning'
    );
  };

  // Price save handler
  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAuditLog(`تحديث خطط أسعار بريميوم للعملاء: الشهري ${monthlyPrice} ج.م والسيرفر السنوي ${yearlyPrice} ج.م`, 'Warning');
    setPriceSuccess(true);
    setTimeout(() => {
      setPriceSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white font-sans">الإعدادات والرقابة الفنية</h2>
          <p className="text-xs text-slate-400 mt-1">تعديل الإعدادات العامة للمنصة، تفعيل الميزات والذكاء الاصطناعي، تتبع سجل العمليات الإدارية، وإدارة صلاحيات الـ RBAC</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            إعدادات النظام والأسعار
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'rbac' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            صلاحيات المسؤولين (RBAC)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            سجل التدقيق والحركات ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Feature Flags config */}
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl lg:col-span-7 space-y-6">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-1.5">
                <ToggleRight className="w-5 h-5 text-indigo-400" />
                <span>مفاتيح الميزات الفورية (Feature Flags)</span>
              </h3>
              <p className="text-[10px] text-slate-400">تحكم بظهور أو إخفاء ميزات النظام لجميع العائلات لحظياً بدون الحاجة لإعادة رفع التطبيق.</p>
            </div>

            <div className="divide-y divide-slate-800/60 space-y-4">
              
              {/* Flag 1 */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <span className="text-xs font-bold text-white block">ميزات البيتا التجريبية (Beta Features)</span>
                  <span className="text-[10px] text-slate-500">تمكين ميزة محاكي الديون الذكي ومزامنة التنبيهات الفائقة لمختبري البيتا.</span>
                </div>
                <button
                  onClick={() => handleToggleFlag('betaFeatures')}
                  className={`text-indigo-400 hover:scale-105 transition-all focus:outline-none`}
                >
                  {featureFlags.betaFeatures ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500 fill-indigo-500/20" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Flag 2 */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <span className="text-xs font-bold text-white block">وضع الصيانة الكاملة (Maintenance Mode)</span>
                  <span className="text-[10px] text-red-500/80 font-bold">يقوم بإغلاق واجهة المستخدم ووضع لافتة تحت الصيانة فوراً!</span>
                </div>
                <button
                  onClick={() => handleToggleFlag('maintenanceMode')}
                  className={`text-red-400 hover:scale-105 transition-all focus:outline-none`}
                >
                  {featureFlags.maintenanceMode ? (
                    <ToggleRight className="w-12 h-12 text-red-500 fill-red-500/20" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Flag 3 */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <span className="text-xs font-bold text-white block">محرك نصائح الذكاء الاصطناعي (AI Insights Engine)</span>
                  <span className="text-[10px] text-slate-500">تفعيل التحليلات والافتراضات الذكية المتقدمة بناءً على Gemini 3.5.</span>
                </div>
                <button
                  onClick={() => handleToggleFlag('aiInsightsEngine')}
                  className={`text-indigo-400 hover:scale-105 transition-all focus:outline-none`}
                >
                  {featureFlags.aiInsightsEngine ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500 fill-indigo-500/20" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Flag 4 */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <span className="text-xs font-bold text-white block">صوتيات بريميوم فقط (Voice Input Premium)</span>
                  <span className="text-[10px] text-slate-500">جعل المساعد الصوتي متاحاً حصرياً لمشتركي باقة بريميوم الممتازة.</span>
                </div>
                <button
                  onClick={() => handleToggleFlag('voiceInputPremium')}
                  className={`text-indigo-400 hover:scale-105 transition-all focus:outline-none`}
                >
                  {featureFlags.voiceInputPremium ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500 fill-indigo-500/20" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Right: Pricing Settings & Security settings */}
          <div className="space-y-6 lg:col-span-5">
            {/* Pricing Panel */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
                <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                <span>أسعار اشتراكات باقة Premium</span>
              </h3>

              <form onSubmit={handleSavePrices} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2">السعر الشهري (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2">السعر السنوي (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={yearlyPrice}
                      onChange={(e) => setYearlyPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {priceSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-[10px] rounded-xl p-2 flex items-center justify-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم تحديث قيم الاشتراكات المعتمدة بنجاح!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  حفظ أسعار الباقات الجديدة
                </button>
              </form>
            </div>

            {/* Portal security parameters */}
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                <span>إعدادات أمان لوحة المالك</span>
              </h3>

              <div className="flex items-center justify-between text-xs bg-slate-950/40 border border-slate-800/50 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-slate-300 block">إلزامية المصادقة الثنائية (2FA)</span>
                  <span className="text-[9px] text-slate-500">فرض التحقق الثنائي عبر Google Authenticator للمسؤولين.</span>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !admin2FA;
                    setAdmin2FA(nextVal);
                    onAddAuditLog(`تغيير حالة المصادقة الثنائية الإلزامية للمسؤولين إلى ${nextVal ? 'نشط' : 'معطل'}`, 'Critical');
                  }}
                  className="focus:outline-none"
                >
                  {admin2FA ? <ToggleRight className="w-10 h-10 text-emerald-500" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                </button>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 leading-relaxed font-semibold">
                <span className="font-bold text-white block mb-0.5">تفاصيل السيرفر:</span>
                عنوان الـ IP المعتمد الحالي لعمليات المالك: <span className="font-mono text-indigo-400">197.34.40.112</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-1">
              <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
              <span>إدارة صلاحيات الوصول القائمة على الأدوار (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-400">تعيين وفحص صلاحيات التحكم للمسؤولين وموظفي الدعم التقني لضمان سرية البيانات المالية للعائلات.</p>
          </div>

          {/* Role mapping grid cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Super Admin */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-black">SUPER_ADMIN</span>
              <p className="text-[10px] text-slate-400 font-semibold">الوصول الكامل والمطلق لكافة تفاصيل النظام والاشتراكات والمبيعات وقواعد البيانات وحذف المستخدمين نهائياً.</p>
            </div>
            {/* Admin */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-black">ADMIN</span>
              <p className="text-[10px] text-slate-400 font-semibold">إدارة مستخدمي المنصة، تنشيط وتعديل باقات الاشتراك بريميوم، إرجاع المدفوعات، وبث الإعلانات العامة.</p>
            </div>
            {/* Support */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-black">SUPPORT</span>
              <p className="text-[10px] text-slate-400 font-semibold">استقبال والرد على تذاكر دعم المستخدمين، تتبع مشاكل الفواتير والـ OCR، واستعراض الإحصائيات العامة دون صلاحية الحذف.</p>
            </div>
            {/* User */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-black">USER (عملاء المنصة)</span>
              <p className="text-[10px] text-slate-400 font-semibold">الوصول الطبيعي لخدمات التطبيق العائلية من إضافة مصروفات والدردشة مع المستشار والـ OCR. يمنع تماماً من دخول لوحة المسؤولين.</p>
            </div>
          </div>

          {/* Admins Table list */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-xs">مسؤولو المنصة النشطون وصلاحياتهم الفردية:</div>
            <table className="w-full text-xs text-right text-slate-300">
              <thead className="bg-slate-900 text-[10px] text-slate-400 font-bold">
                <tr>
                  <th className="px-6 py-3">الاسم الكامل</th>
                  <th className="px-6 py-3">البريد الإلكتروني المعتمد</th>
                  <th className="px-6 py-3">الدور والـ Role الرئيسي</th>
                  <th className="px-6 py-3 text-left">الصلاحيات الفنية المقررة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {adminsList.map((adm, index) => (
                  <tr key={index} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4 font-bold text-white">{adm.name}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-400">{adm.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                        adm.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                        adm.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {adm.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left font-mono font-bold text-slate-500">
                      {adm.permissions.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          
          {/* Auditing filters toolbar */}
          <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pr-10 pl-4 text-xs text-white focus:outline-none"
                placeholder="البحث باسم الحركة، الإيميل، أو الـ IP..."
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 font-semibold focus:outline-none"
              >
                <option value="All">كل الخطورات</option>
                <option value="Info">عادية (Info)</option>
                <option value="Warning">متوسطة (Warning)</option>
                <option value="Critical">حرجة جداً (Critical)</option>
              </select>
            </div>
          </div>

          {/* Audit list table */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-right text-slate-300">
              <thead className="text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800 font-bold uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4">التوقيت والزمن</th>
                  <th scope="col" className="px-6 py-4">بريد المسؤول</th>
                  <th scope="col" className="px-6 py-4">الحركة الإدارية التفصيلية</th>
                  <th scope="col" className="px-6 py-4">عنوان الـ IP</th>
                  <th scope="col" className="px-6 py-4">الخطورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 font-bold text-xs">
                      لم يتم العثور على حركات مسجلة تطابق التصفية.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400 font-semibold">{log.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-white">{log.adminEmail}</td>
                      <td className="px-6 py-4 font-semibold text-slate-300">{log.action}</td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-400">{log.ipAddress}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-[9px] ${
                          log.severity === 'Info' ? 'bg-emerald-500/10 text-emerald-400' :
                          log.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                        }`}>
                          {log.severity === 'Info' ? 'عادية' : log.severity === 'Warning' ? 'متوسطة' : 'حرجة جداً'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
