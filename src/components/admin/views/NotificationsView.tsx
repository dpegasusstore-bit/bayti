/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FeedbackTicket, ContentItem } from '../seedData';
import { 
  Bell, Mail, MessageSquare, Plus, Check, X, ShieldAlert, Sparkles,
  Megaphone, AlertCircle, Trash2, Edit2, Send, HelpCircle, Eye, RefreshCw
} from 'lucide-react';

interface NotificationsViewProps {
  feedback: FeedbackTicket[];
  contentItems: ContentItem[];
  onUpdateFeedback: (updatedFeedback: FeedbackTicket[]) => void;
  onUpdateContent: (updatedContent: ContentItem[]) => void;
  onAddAuditLog: (action: string, severity: 'Info' | 'Warning' | 'Critical') => void;
}

export default function NotificationsView({
  feedback, contentItems, onUpdateFeedback, onUpdateContent, onAddAuditLog
}: NotificationsViewProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'broadcasts'>('tickets');
  
  // Feedback interactive state
  const [replyTicket, setReplyTicket] = useState<FeedbackTicket | null>(null);
  const [tempReplyText, setTempReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  // Broadcast creation state
  const [showAddBroadcast, setShowAddBroadcast] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'banner' | 'announcement' | 'tip' | 'news'>('banner');
  const [newTarget, setNewTarget] = useState('All Users');

  // Push Alert instant simulation
  const [instantPushTitle, setInstantPushTitle] = useState('');
  const [instantPushMsg, setInstantPushMsg] = useState('');
  const [pushSuccess, setPushSuccess] = useState(false);

  // Feedback filter
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Open' | 'Solved'>('All');
  const filteredTickets = feedback.filter(t => ticketFilter === 'All' || t.status === ticketFilter);

  // Send reply to support ticket
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicket || !tempReplyText.trim()) return;

    const updated = feedback.map((t) => {
      if (t.id === replyTicket.id) {
        return {
          ...t,
          status: 'Solved' as const,
          reply: tempReplyText
        };
      }
      return t;
    });

    onUpdateFeedback(updated);
    onAddAuditLog(`الرد على تذكرة الدعم الفني للمستخدم (${replyTicket.userEmail}) وإغلاق التذكرة`, 'Info');
    
    setReplySuccess(true);
    setTimeout(() => {
      setReplyTicket(null);
      setTempReplyText('');
      setReplySuccess(false);
    }, 2000);
  };

  // Add broad banner/tip
  const handleAddBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem: ContentItem = {
      id: 'cnt_' + Math.random().toString(36).substr(2, 9),
      type: newType,
      title: newTitle,
      content: newContent,
      target: newTarget,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onUpdateContent([newItem, ...contentItems]);
    onAddAuditLog(`إضافة محتوى إرشادي/إعلان جديد في لوحة مستخدمي التطبيق بعنوان: ${newTitle}`, 'Warning');
    
    setNewTitle('');
    setNewContent('');
    setShowAddBroadcast(false);
  };

  // Toggle broadcast status
  const handleToggleActive = (id: string) => {
    const updated = contentItems.map((item) => {
      if (item.id === id) {
        const nextState = !item.isActive;
        onAddAuditLog(`تغيير حالة الإعلان (${item.title}) إلى ${nextState ? 'نشط' : 'غير نشط'}`, 'Info');
        return { ...item, isActive: nextState };
      }
      return item;
    });
    onUpdateContent(updated);
  };

  // Delete broadcast item
  const handleDeleteContent = (id: string) => {
    const item = contentItems.find(c => c.id === id);
    if (!item) return;

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف هذا المحتوى (${item.title}) نهائياً؟`)) {
      const updated = contentItems.filter(c => c.id !== id);
      onUpdateContent(updated);
      onAddAuditLog(`حذف محتوى إعلاني من المنصة: ${item.title}`, 'Critical');
    }
  };

  // Simulated instant push message
  const handleSendInstantPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantPushTitle.trim() || !instantPushMsg.trim()) return;

    onAddAuditLog(`إرسال إشعار فوري (Push Alert) جماعي: ${instantPushTitle}`, 'Critical');
    setPushSuccess(true);
    
    // Save to simulated notifications storage if needed, or simply alert success
    setTimeout(() => {
      setInstantPushTitle('');
      setInstantPushMsg('');
      setPushSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Header View */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white font-sans">إدارة تذاكر الدعم والاتصالات</h2>
          <p className="text-xs text-slate-400 mt-1">الرد على استفسارات وبلاغات عائلات بيت AI، إضافة عروض ولافتات ترويجية في التطبيق، وإرسال تنبيهات فورية</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold font-sans">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'tickets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            تذاكر الدعم الفني ({feedback.filter(t=>t.status==='Open').length} معلق)
          </button>
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'broadcasts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            الإعلانات واللافتات النشطة
          </button>
        </div>
      </div>

      {activeTab === 'tickets' ? (
        <div className="space-y-6">
          {/* Support Ticket Filters */}
          <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">تصفية التذاكر:</span>
              {(['All', 'Open', 'Solved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTicketFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    ticketFilter === st 
                      ? 'bg-slate-800 text-white border border-slate-700' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'All' ? 'كل التذاكر' : st === 'Open' ? 'مفتوحة / جديدة' : 'محلولة ومغلقة'}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              إجمالي التذاكر: <span className="text-indigo-400 font-bold">{feedback.length} تذكرة</span>
            </div>
          </div>

          {/* Tickets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`bg-slate-900/40 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  ticket.status === 'Open' ? 'border-amber-500/30 bg-amber-500/[0.01]' : 'border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        ticket.type === 'Bug Report' ? 'bg-red-500/10 text-red-400' :
                        ticket.type === 'Feature Request' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {ticket.type === 'Bug Report' ? 'تقرير خطأ برمجي' : ticket.type === 'Feature Request' ? 'اقتراح ميزة جديدة' : 'رسالة دعم'}
                      </span>
                      <h4 className="text-xs font-black text-white mt-2 leading-relaxed">{ticket.subject}</h4>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      ticket.status === 'Open' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {ticket.status === 'Open' ? 'قيد الانتظار' : 'تم حلها'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-slate-950/40 border border-slate-800/40 p-3 rounded-xl mb-4">
                    {ticket.message}
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between mb-4">
                    <span>تاريخ البلاغ: {ticket.date}</span>
                    <span className="font-bold text-slate-400">{ticket.userEmail}</span>
                  </div>
                </div>

                {ticket.reply ? (
                  <div className="bg-slate-950 border border-indigo-950/80 p-3.5 rounded-xl text-xs text-indigo-300 leading-relaxed font-medium">
                    <span className="font-bold text-indigo-400 block mb-1">رد الإدارة المكتوب:</span>
                    {ticket.reply}
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyTicket(ticket)}
                    className="w-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>كتابة رد فني وإغلاق التذكرة</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Broadcasts Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-white">إدارة العروض الترويجية واللافتات الإرشادية</h3>
            <button
              onClick={() => setShowAddBroadcast(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/15"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان جديد للتطبيق</span>
            </button>
          </div>

          {/* Broadcast Items list */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-right text-slate-300">
              <thead className="text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-4">نوع المحتوى</th>
                  <th scope="col" className="px-6 py-4">العنوان الرئيسي</th>
                  <th scope="col" className="px-6 py-4">نص المحتوى</th>
                  <th scope="col" className="px-6 py-4">الشريحة المستهدفة</th>
                  <th scope="col" className="px-6 py-4">الحالة</th>
                  <th scope="col" className="px-6 py-4 text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {contentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'banner' ? 'bg-amber-500/10 text-amber-400' :
                        item.type === 'tip' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {item.type === 'banner' ? 'لافتة ترويجية' : item.type === 'tip' ? 'نصيحة اليوم' : 'تحديث جديد'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{item.title}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{item.content}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-300">{item.target || 'جميع عائلات المنصة'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                          item.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        {item.isActive ? 'نشط بالتطبيق' : 'متوقف مؤقتاً'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 rounded-lg transition-colors border border-red-900/30"
                        title="حذف المحتوى"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instant Push Notifications Panel */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
              <Megaphone className="w-4.5 h-4.5 text-amber-500" />
              <span>إرسال تنبيه جماعي فوري (Instant Push Notification)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">يرسل هذا الإجراء إشعاراً مباشراً يظهر على هواتف جميع عائلات بيت AI في نفس اللحظة للتحذيرات الهامة أو التحديثات الفورية.</p>

            <form onSubmit={handleSendInstantPush} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">عنوان الإشعار القصير</label>
                  <input
                    type="text"
                    required
                    value={instantPushTitle}
                    onChange={(e) => setInstantPushTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none"
                    placeholder="مثال: تحديث أمني هام لجميع العائلات 🔐"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">تفاصيل وجسم الإشعار</label>
                  <textarea
                    required
                    rows={3}
                    value={instantPushMsg}
                    onChange={(e) => setInstantPushMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none resize-none"
                    placeholder="اكتب تفاصيل الإشعار الذي سيظهر على شاشة الهاتف..."
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>تنبيه أمان مالي:</span>
                  </div>
                  <p className="leading-relaxed font-semibold">
                    جميع الإشعارات الفورية تخضع لقواعد الأمان والخصوصية ويتم تدوينها بالكامل في سجل الحركة الإداري لضمان حماية خصوصية المشتركين وتجنب الإزعاج.
                  </p>
                </div>

                {pushSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs rounded-xl p-2.5 flex items-center justify-center gap-1.5 font-bold animate-pulse">
                    <Check className="w-4 h-4" />
                    <span>تم إرسال الإشعار لـ 17,225 هاتف نشط بنجاح!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-indigo-600/10"
                >
                  <Send className="w-4 h-4" />
                  <span>بث وإرسال الإشعار الفوري الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Ticket Modal */}
      {replyTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right">
            <h3 className="text-base font-black text-white mb-2">إرسال رد على العميل</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              ردك سيصل فوراً إلى العميل <span className="text-white font-bold">{replyTicket.userEmail}</span> وسيتم تحويل حالة التذكرة إلى <span className="text-emerald-400 font-bold">تم حلها</span>.
            </p>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs leading-relaxed max-h-36 overflow-y-auto">
                <span className="text-slate-500 font-bold block mb-1">بلاغ العميل الأصلي:</span>
                <span className="text-slate-300 font-semibold">{replyTicket.message}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">اكتب رد الإدارة الفني</label>
                <textarea
                  required
                  rows={4}
                  value={tempReplyText}
                  onChange={(e) => setTempReplyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-3 text-xs text-white focus:outline-none"
                  placeholder="مرحباً أحمد، نشكرك على إبلاغنا... تم معالجة المشكلة بنجاح..."
                />
              </div>

              {replySuccess && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs rounded-2xl p-3 flex items-center justify-center gap-2 font-bold animate-pulse">
                  <Check className="w-4 h-4" />
                  <span>تم إرسال الرد وإغلاق التذكرة بنجاح!</span>
                </div>
              )}

              <div className="flex gap-3 justify-end text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTicket(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
                >
                  تأكيد وإرسال الرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Broadcast Item Modal */}
      {showAddBroadcast && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right">
            <h3 className="text-base font-black text-white mb-2">إنشاء محتوى إعلاني ترويجي</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              أضف لافتة ترويجية أو نصيحة مالية تظهر في الشاشة الرئيسية لجميع العائلات المسجلة.
            </p>

            <form onSubmit={handleAddBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">نوع ومكان المحتوى</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                >
                  <option value="banner">لافتة ترويجية علوية (Banner)</option>
                  <option value="tip">نصيحة اليوم المالية (Daily Tip)</option>
                  <option value="news">تحديث فني للمنصة (News/Updates)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">العنوان الرئيسي للمحتوى</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                  placeholder="مثال: خصم 50% على الباقة السنوية"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">نص وتفاصيل المحتوى</label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none resize-none"
                  placeholder="تفاصيل الإعلان أو النصيحة المكتوبة..."
                />
              </div>

              <div className="flex gap-3 justify-end text-xs pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBroadcast(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
                >
                  تأكيد ونشر الإعلان فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
