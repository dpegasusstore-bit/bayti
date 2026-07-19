/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AdminUser } from '../seedData';
import { 
  Search, Filter, ShieldAlert, Ban, RefreshCw, Key, Trash2, Eye, 
  X, Check, Smartphone, MapPin, Sparkles, Clock, Calendar, ShieldCheck 
} from 'lucide-react';

interface UserManagementViewProps {
  users: AdminUser[];
  onUpdateUsers: (updatedUsers: AdminUser[]) => void;
  onAddAuditLog: (action: string, severity: 'Info' | 'Warning' | 'Critical') => void;
}

export default function UserManagementView({ users, onUpdateUsers, onAddAuditLog }: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended' | 'Banned'>('All');
  const [planFilter, setPlanFilter] = useState<'All' | 'Free' | 'Premium'>('All');
  
  // Selected user for detailed sidebar/modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Reset password state
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [tempNewPassword, setTempNewPassword] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Filter and search logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchesPlan = planFilter === 'All' || user.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleStatusChange = (userId: string, newStatus: 'Active' | 'Suspended' | 'Banned') => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const uEmail = u.email;
        onAddAuditLog(
          `تغيير حالة حساب المستخدم (${uEmail}) إلى ${newStatus}`, 
          newStatus === 'Active' ? 'Info' : 'Critical'
        );
        return { ...u, status: newStatus };
      }
      return u;
    });
    onUpdateUsers(updated);
    
    // Update local modal state if active
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find(usr => usr.id === userId);
    if (!u) return;

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف حساب المستخدم (${u.name}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      const updated = users.filter((usr) => usr.id !== userId);
      onUpdateUsers(updated);
      onAddAuditLog(`حذف حساب المستخدم (${u.email}) نهائياً من قاعدة البيانات`, 'Critical');
      setSelectedUser(null);
    }
  };

  const handleResetPasswordInit = (user: AdminUser) => {
    const randomPass = 'BaytiPass_' + Math.random().toString(36).substr(2, 6).toUpperCase() + '@2026';
    setTempNewPassword(randomPass);
    setResettingUser(user);
    setPasswordResetSuccess(false);
  };

  const handleConfirmResetPassword = () => {
    if (!resettingUser) return;
    
    // Perform simulated DB reset
    onAddAuditLog(`تعيين كلمة مرور مؤقتة جديدة للمستخدم (${resettingUser.email})`, 'Warning');
    setPasswordResetSuccess(true);
    
    setTimeout(() => {
      setResettingUser(null);
      setPasswordResetSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-black text-white">إدارة مستخدمي المنصة</h2>
        <p className="text-xs text-slate-400 mt-1">عرض، بحث، تصفية، تعديل مستويات الأمان، تجميد الحسابات وإعادة تعيين كلمات المرور</p>
      </div>

      {/* Toolbar / Search & Filter Panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pr-10 pl-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="البحث باسم المستخدم أو البريد..."
          />
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 font-semibold focus:outline-none"
            >
              <option value="All">كل الحالات</option>
              <option value="Active">نشط</option>
              <option value="Suspended">معلق</option>
              <option value="Banned">محظور</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 font-semibold focus:outline-none"
            >
              <option value="All">كل الاشتراكات</option>
              <option value="Free">الباقة المجانية</option>
              <option value="Premium">الباقة الممتازة</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-slate-300">
            <thead className="text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800 font-bold uppercase">
              <tr>
                <th scope="col" className="px-6 py-4">المستخدم</th>
                <th scope="col" className="px-6 py-4">حالة الحساب</th>
                <th scope="col" className="px-6 py-4">الاشتراك الحالي</th>
                <th scope="col" className="px-6 py-4">تاريخ التسجيل</th>
                <th scope="col" className="px-6 py-4">آخر حركة دخول</th>
                <th scope="col" className="px-6 py-4 text-left">العمليات الإدارية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-bold text-xs">
                    لم يتم العثور على مستخدمين يطابقون خيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${
                        user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        user.status === 'Suspended' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-400' :
                          user.status === 'Suspended' ? 'bg-amber-400' :
                          'bg-red-400'
                        }`} />
                        {user.status === 'Active' ? 'نشط' : user.status === 'Suspended' ? 'معلق مؤقتاً' : 'محظور نهائياً'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.plan === 'Premium' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.plan === 'Premium' && <Sparkles className="w-3 h-3" />}
                        {user.plan === 'Premium' ? 'باقة Premium' : 'الباقة المجانية'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400">{user.registeredAt}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{user.lastLogin}</td>
                    <td className="px-6 py-4 text-left">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                          title="عرض تفاصيل النشاط والجهاز"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPasswordInit(user)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        
                        {/* Toggle active/suspended status */}
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'Suspended')}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-all"
                            title="تعليق الحساب مؤقتاً"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'Active')}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all"
                            title="تنشيط الحساب"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(user.id, 'Banned')}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg transition-all"
                          title="حظر المستخدم نهائياً"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 rounded-lg transition-all border border-red-900/30"
                          title="حذف الحساب نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Sidebar or Modal for User Details & Activity History */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 h-full p-6 shadow-2xl border-r border-slate-800 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-black text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <div className="text-slate-500 font-semibold flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>الجهاز المستخدم</span>
                  </div>
                  <div className="text-white font-bold">{selectedUser.device}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>عنوان الـ IP</span>
                  </div>
                  <div className="text-white font-mono font-bold">{selectedUser.ipAddress}</div>
                </div>
                <div className="mt-3">
                  <div className="text-slate-500 font-semibold flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ التسجيل</span>
                  </div>
                  <div className="text-white font-bold">{selectedUser.registeredAt}</div>
                </div>
                <div className="mt-3">
                  <div className="text-slate-500 font-semibold flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>آخر دخول للمنصة</span>
                  </div>
                  <div className="text-white font-mono font-bold">{selectedUser.lastLogin}</div>
                </div>
              </div>

              {/* Spending Summary */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                  <div className="text-slate-400 text-xs font-semibold mb-1">مصروفات العائلة هذا الشهر</div>
                  <div className="text-base font-black text-indigo-400">{selectedUser.spentThisMonth.toLocaleString()} ج.م</div>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                  <div className="text-slate-400 text-xs font-semibold mb-1">إجمالي الحركات المصروفة تاريخياً</div>
                  <div className="text-base font-black text-emerald-400">{selectedUser.totalSpent.toLocaleString()} ج.m</div>
                </div>
              </div>

              {/* Interactive Status Changer in Sidebar */}
              <div className="mb-8 p-4 bg-slate-950/20 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-black text-slate-300 mb-3">تحديث صلاحية الدخول وتجميد الحساب:</h4>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'Active')}
                    className={`flex-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                      selectedUser.status === 'Active' 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    نشط وصالح
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'Suspended')}
                    className={`flex-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                      selectedUser.status === 'Suspended' 
                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    تعليق مؤقت
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'Banned')}
                    className={`flex-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                      selectedUser.status === 'Banned' 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    حظر نهائي
                  </button>
                </div>
              </div>

              {/* Activity Logs (Historical audit trail) */}
              <div>
                <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>تاريخ آخر حركات وأنشطة المستخدم:</span>
                </h4>
                <div className="space-y-3.5 relative border-r border-slate-800 pr-4 mr-1">
                  {selectedUser.activityHistory.map((act, index) => (
                    <div key={index} className="relative text-xs leading-relaxed">
                      <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-900" />
                      <div className="text-[10px] text-slate-400 font-mono mb-0.5">{act.date}</div>
                      <div className="font-bold text-slate-200">{act.action}</div>
                      <div className="text-slate-400 mt-0.5">{act.details}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <button
              onClick={() => {
                handleDeleteUser(selectedUser.id);
              }}
              className="w-full bg-red-950/40 hover:bg-red-900 border border-red-900/40 text-red-400 hover:text-white font-bold py-3.5 px-4 rounded-xl text-xs mt-8 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف حساب العائلة وكل بياناتهم تاريخياً</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right">
            <h3 className="text-base font-black text-white mb-3">إعادة تعيين كلمة مرور المستخدم</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              أنت على وشك فرض تعيين كلمة مرور مؤقتة للمستخدم <span className="text-white font-bold">{resettingUser.name}</span>. سيطلب النظام من المستخدم استبدالها فور تسجيل الدخول القادم.
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center mb-6">
              <span className="text-[10px] text-slate-500 block mb-1">كلمة المرور المؤقتة المقترحة:</span>
              <span className="font-mono text-sm text-indigo-400 font-bold tracking-wider select-all">{tempNewPassword}</span>
            </div>

            {passwordResetSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs rounded-2xl p-3 flex items-center justify-center gap-2 mb-6 font-bold">
                <Check className="w-4 h-4" />
                <span>تم تحديث كلمة المرور بنجاح وجاري إشعار المستخدم!</span>
              </div>
            ) : null}

            <div className="flex gap-3 justify-end text-xs">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl transition-all"
              >
                إلغاء الإجراء
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10"
              >
                تأكيد التحديث
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
