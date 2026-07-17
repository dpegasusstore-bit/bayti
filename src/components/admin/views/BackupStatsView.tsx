/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Database, RefreshCw, Users, Server, FilePieChart, TrendingUp } from 'lucide-react';

interface BackupStats {
  totalBackups: number;
  totalUsersWithBackups: number;
  averageBackupsPerUser: string | number;
  totalSizeKb: string | number;
  averageSizeKb: string | number;
  maxSizeKb: string | number;
  types: Array<{
    type: string;
    count: number;
    sizeKb: string | number;
  }>;
}

export default function BackupStatsView() {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBackupStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('bayti_admin_token') || localStorage.getItem('bayti_user_token') || '';
      const response = await fetch('/api/admin/backup-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'فشل تحميل إحصائيات النسخ الاحتياطي.');
      }
    } catch (err) {
      console.error('Error fetching backup stats:', err);
      setError('حدث خطأ أثناء الاتصال بالخادم لتحميل الإحصائيات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupStats();
  }, []);

  const getFriendlyTypeName = (type: string) => {
    switch (type) {
      case 'manual': return 'نسخ يدوي سحابي';
      case 'auto_daily': return 'نسخ تلقائي يومي';
      case 'auto_weekly': return 'نسخ تلقائي أسبوعي';
      case 'auto_monthly': return 'نسخ تلقائي شهري';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-500" />
            <span>رقابة وإحصائيات النسخ الاحتياطي السحابي</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold">
            شاشة تتبع وتحليل سعات تخزين وحالات تشفير النسخ الاحتياطية لجميع الحسابات والعائلات في النظام.
          </p>
        </div>
        <button
          onClick={fetchBackupStats}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/25 border border-red-900/40 rounded-2xl text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-slate-900/40 border border-slate-900/60 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400">جاري تجميع إحصائيات التخزين السحابي وحساب التوزيع الفعلي...</p>
        </div>
      ) : stats ? (
        <>
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Total backups card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-start justify-between relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">إجمالي الملفات السحابية</span>
                <h3 className="text-3xl font-black text-white">{stats.totalBackups}</h3>
                <p className="text-[10px] text-slate-500">مجموع النسخ اليدوية والتلقائية على الخادم</p>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl z-10">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Total Storage card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-start justify-between relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">مساحة التخزين الكلية</span>
                <h3 className="text-3xl font-black text-white">
                  {Number(stats.totalSizeKb) > 1024 
                    ? `${(Number(stats.totalSizeKb) / 1024).toFixed(2)} MB` 
                    : `${Number(stats.totalSizeKb).toFixed(1)} KB`
                  }
                </h3>
                <p className="text-[10px] text-slate-500">الحجم الفعلي المشفر بالكامل على قواعد البيانات</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl z-10">
                <Server className="w-5 h-5" />
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Active users card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-start justify-between relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">العائلات النشطة تخزينياً</span>
                <h3 className="text-3xl font-black text-white">{stats.totalUsersWithBackups}</h3>
                <p className="text-[10px] text-slate-500">متوسط {Number(stats.averageBackupsPerUser).toFixed(1)} نسخ لكل حساب مستخدم</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl z-10">
                <Users className="w-5 h-5" />
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          {/* Detailed Statistics & breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution chart card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <FilePieChart className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-white">توزيع النسخ حسب نوع العملية والجدولة</h4>
              </div>

              {stats.types.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد تفاصيل تصنيفية حالياً.</p>
              ) : (
                <div className="space-y-4">
                  {stats.types.map((t) => {
                    const percentage = stats.totalBackups > 0 ? (t.count / stats.totalBackups) * 100 : 0;
                    return (
                      <div key={t.type} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">{getFriendlyTypeName(t.type)}</span>
                          <span className="font-semibold text-slate-400">
                            {t.count} نسخ ({percentage.toFixed(0)}%) • {Number(t.sizeKb).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              t.type === 'manual' 
                                ? 'bg-indigo-500' 
                                : t.type === 'auto_daily' 
                                  ? 'bg-blue-500' 
                                  : t.type === 'auto_weekly' 
                                    ? 'bg-emerald-500' 
                                    : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Storage capacity parameters & health */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white">تحليل أحجام التخزين السحابي والموثوقية</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block">متوسط حجم الملف المشفر</span>
                  <span className="text-lg font-extrabold text-slate-200">{Number(stats.averageSizeKb).toFixed(1)} KB</span>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block">أقصى حجم تم تسجيله</span>
                  <span className="text-lg font-extrabold text-slate-200">{Number(stats.maxSizeKb).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/15 border border-indigo-900/30 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[10px] leading-relaxed text-slate-400">
                  <span className="font-bold text-slate-300 block mb-0.5">سلامة وتكامل التشفير: نشط بالكامل</span>
                  جميع البيانات المخزنة تستخدم مفتاح تشفير عالي القوة مستمد من توقيع الـ JWT الخاص بمستخدم بيت AI نفسه، مما يمنع حتى مسؤولي قواعد البيانات من قراءة البيانات الحساسة للمستخدمين بصورة غير مصرح بها.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
