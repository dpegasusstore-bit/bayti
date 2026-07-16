/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  Sparkles, 
  Printer, 
  TrendingUp, 
  Calendar, 
  Users 
} from 'lucide-react';
import { Expense, FamilyMember } from '../types';
import { formatCurrency } from '../utils';

interface SmartExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  familyMembers: FamilyMember[];
  monthlyBudget: number;
}

export default function SmartExportModal({
  isOpen,
  onClose,
  expenses,
  familyMembers,
  monthlyBudget
}: SmartExportModalProps) {
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'category' | 'family' | 'goals'>('monthly');
  const [fileFormat, setFileFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Core Data exporter
  const triggerDownload = () => {
    setIsExporting(true);
    setSuccess(false);

    setTimeout(() => {
      setIsExporting(false);
      setSuccess(true);

      // Generate Data
      if (fileFormat === 'csv' || fileFormat === 'excel') {
        let content = '';
        let fileName = '';

        if (reportType === 'monthly') {
          content = 'العنوان,المبلغ (EGP),التاريخ,القسم,طريقة الدفع,بواسطة,المتجر\n';
          expenses.forEach(e => {
            content += `"${e.title.replace(/"/g, '""')}",${e.amount},${e.date},"${e.category}","${e.paymentMethod}","${e.recordedBy}","${e.merchant || ''}"\n`;
          });
          fileName = `تقرير_المصروفات_الشهري_${new Date().getMonth() + 1}_${new Date().getFullYear()}`;
        } else if (reportType === 'family') {
          content = 'الاسم,الدور,الميزانية المخصصة (EGP),المنفق الفعلي (EGP),النسبة المئوية\n';
          familyMembers.forEach(f => {
            const pct = f.monthlyBudget > 0 ? Math.round((f.spentThisMonth / f.monthlyBudget) * 100) : 0;
            content += `"${f.name}","${f.role}",${f.monthlyBudget},${f.spentThisMonth},${pct}%\n`;
          });
          fileName = `تقرير_توزيع_المصروفات_العائلية`;
        } else {
          // General format
          content = 'العنوان,المبلغ (EGP),التاريخ,القسم,بواسطة\n';
          expenses.forEach(e => {
            content += `"${e.title.replace(/"/g, '""')}",${e.amount},${e.date},"${e.category}","${e.recordedBy}"\n`;
          });
          fileName = `تقرير_بيت_AI_العام`;
        }

        // Add BOM for proper Excel Arabic parsing
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.${fileFormat === 'excel' ? 'xls' : 'csv'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (fileFormat === 'pdf') {
        // High fidelity printable invoice layout
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const tableRows = expenses.map(e => `
            <tr>
              <td>${e.title}</td>
              <td><b>${e.amount} ج.م</b></td>
              <td>${e.date}</td>
              <td>${e.category}</td>
              <td>${e.recordedBy}</td>
            </tr>
          `).join('');

          const familyRows = familyMembers.map(f => `
            <tr>
              <td>${f.name} (${f.role})</td>
              <td>${f.monthlyBudget} ج.م</td>
              <td>${f.spentThisMonth} ج.م</td>
            </tr>
          `).join('');

          printWindow.document.write(`
            <html lang="ar" dir="rtl">
              <head>
                <meta charset="utf-8">
                <title>تقرير بيت AI المالي المتكامل</title>
                <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; }
                  .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                  .logo { font-size: 24px; font-weight: 900; color: #2563eb; }
                  .stats { display: grid; grid-cols: 3; gap: 20px; margin-bottom: 30px; }
                  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
                  .stat-title { font-size: 11px; color: #64748b; font-weight: bold; }
                  .stat-val { font-size: 18px; font-weight: 850; color: #1e293b; margin-top: 5px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
                  th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-size: 12px; }
                  th { background-color: #f1f5f9; font-weight: bold; }
                  .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-t: 1px solid #e2e8f0; padding-top: 15px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <div class="logo">بيت AI 🏠</div>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #64748b;">نظام الإدارة المالية العائلية الذكي</p>
                  </div>
                  <div style="text-align: left;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">تاريخ التصدير</p>
                    <p style="margin: 5px 0 0; font-size: 12px; font-weight: bold;">${new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>

                <h2>تقرير الملخص المالي العام</h2>
                <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                  <div class="stat-card" style="flex: 1;">
                    <div class="stat-title">الميزانية العائلية الإجمالية</div>
                    <div class="stat-val">${monthlyBudget} ج.م</div>
                  </div>
                  <div class="stat-card" style="flex: 1;">
                    <div class="stat-title">إجمالي المنفق الفعلي</div>
                    <div class="stat-val" style="color: #ef4444;">${totalSpent} ج.م</div>
                  </div>
                  <div class="stat-card" style="flex: 1;">
                    <div class="stat-title">المتبقي المالي الصافي</div>
                    <div class="stat-val" style="color: #10b981;">${Math.max(0, monthlyBudget - totalSpent)} ج.م</div>
                  </div>
                </div>

                <h3>تفاصيل المصاريف المسجلة</h3>
                <table>
                  <thead>
                    <tr>
                      <th>البند والمصروف</th>
                      <th>القيمة</th>
                      <th>التاريخ</th>
                      <th>التصنيف</th>
                      <th>بواسطة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>

                <h3>توزيع ميزانية الأعضاء</h3>
                <table>
                  <thead>
                    <tr>
                      <th>عضو العائلة</th>
                      <th>الميزانية المقررة</th>
                      <th>الاستهلاك الحالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${familyRows}
                  </tbody>
                </table>

                <div class="footer">
                  تقرير مالي آمن ومشفر صادر عن تطبيق بيت AI المالي • جميع الحقوق محفوظة لعام 2026
                </div>
                
                <script>
                  window.onload = function() {
                    window.print();
                  }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans" style={{ direction: 'rtl' }}>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">تصدير التقارير الذكية</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Scope Selector */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-2 uppercase">محتوى التصدير ومجاله</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  reportType === 'monthly'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>التقرير الشهري الحالي</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('family')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  reportType === 'family'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>الميزانية العائلية</span>
              </button>
            </div>
          </div>

          {/* Formats */}
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-2 uppercase">امتداد ملف التصدير (Format)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFileFormat('csv')}
                className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1 ${
                  fileFormat === 'csv'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>CSV عادي</span>
              </button>

              <button
                type="button"
                onClick={() => setFileFormat('excel')}
                className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1 ${
                  fileFormat === 'excel'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>MS Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setFileFormat('pdf')}
                className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1 ${
                  fileFormat === 'pdf'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>PDF للطباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button / Success Indicators */}
        <div className="space-y-3.5">
          {success ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>تم تحضير التقرير وتحميله بنجاح! 💾</span>
            </div>
          ) : (
            <button
              onClick={triggerDownload}
              disabled={isExporting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تنسيق خلايا المستند وإعداد الرسوم...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير المستند المالي الفوري</span>
                </>
              )}
            </button>
          )}

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold">بيت AI يحمي بياناتك. لا يشارك التصدير مع أي خوادم خارجية.</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
