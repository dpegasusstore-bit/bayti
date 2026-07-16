/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  HelpCircle, 
  MessageCircle,
  TrendingDown,
  AlertCircle,
  Brain,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Mic,
  Calendar,
  ShieldCheck,
  Scale,
  Target,
  LineChart,
  FileText,
  Volume2
} from 'lucide-react';
import { Expense, FamilyMember, SmartReminder } from '../types';
import { formatCurrency } from '../utils';

interface AIAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  familyMembers: FamilyMember[];
  monthlyBudget: number;
}

const CHAT_SUGGESTIONS = [
  'كم باقيلي من ميزانيتي؟ 💰',
  'هل أقدر أشتري موبايل بـ 12 ألف؟ 📱',
  'إيه أكتر حاجة بضيع فيها فلوسي؟ 💸',
  'اعمل لي خطة توفير عائلية 🎯',
  'توقع مصاريفي لآخر الشهر 🔮',
  'كم صرفت على المواصلات والسيارة؟ 🚗'
];

const VOICE_PRESETS = [
  { text: 'كم باقيلي؟ 🎙️', query: 'كم باقيلي من ميزانية عيلتي حالياً؟' },
  { text: 'هل أقدر أشتري موبايل؟ 🎙️', query: 'هل أقدر أشتري موبايل بـ 10,000 ج.م في ظل ميزانيتي الحالية؟' },
  { text: 'إيه أكتر حاجة بضيع فيها فلوسي؟ 🎙️', query: 'إيه أكتر حاجة بضيع فيها فلوسي هذا الشهر؟ جيبلي أكتر فئة صرفت عليها.' },
  { text: 'اعمللي خطة توفير 🎙️', query: 'اعمللي خطة توفير مخصصة لعائلتنا عشان نوفر 3000 ج.م كل شهر.' }
];

interface Message {
  role: 'user' | 'model';
  text: string;
  isVoice?: boolean;
}

export default function AIAdvisorChat({
  isOpen,
  onClose,
  expenses,
  familyMembers,
  monthlyBudget
}: AIAdvisorChatProps) {
  // Navigation inside AI brain
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'simulator' | 'reports'>('chat');

  // Load state from local storage
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const localRem = localStorage.getItem('bayti_reminders');
      if (localRem) setReminders(JSON.parse(localRem));
      
      const localOn = localStorage.getItem('bayti_onboarding_data');
      if (localOn) setOnboardingData(JSON.parse(localOn));
    }
  }, [isOpen]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'أهلاً بك في مستشارك المالي الذكي من بيت AI! 🌸\n\nأنا هنا لمساعدتك في تحليل نفقات عائلتك، والتخطيط للادخار، والإجابة عن أي تساؤلات مالية بكل بساطة وبدون مصطلحات معقدة.\n\nيمكنك كتابة سؤالك مباشرة، أو استخدام البحث والأدوات الذكية المتاحة لك بالتبويبات بالأعلى!'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulator State
  const [simSavings, setSimSavings] = useState(1500); // monthly savings
  const [simPurchase, setSimPurchase] = useState(0); // big purchase
  const [simSalaryIncrease, setSimSalaryIncrease] = useState(0); // % increase
  const [simExpensesIncrease, setSimExpensesIncrease] = useState(0); // % inflation

  // Report State
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);

  // Auto scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Dynamic calculations for Financial Health Score (0-100)
  const healthAnalysis = useMemo(() => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const percentageSpent = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));
    
    let score = 95;
    const reasons: string[] = [];

    // 1. Budget Pace
    if (percentageSpent > 90) {
      score -= 25;
      reasons.push('المصروفات العائلية تجاوزت 90% وتقترب من الحد الأقصى للميزانية ⚠️');
    } else if (percentageSpent > 70) {
      score -= 12;
      reasons.push('استهلاك الميزانية مرتفع نسبياً (أكثر من 70%)، ينصح بالترشيد لزيادة الأمان 📈');
    } else {
      score += 5;
      reasons.push('وتيرة الصرف ممتازة وضمن النطاق الآمن والمخطط له مسبقاً 🌟');
    }

    // 2. Bill payment habits
    const lateBills = reminders.filter(r => r.status === 'missed').length;
    const completedBills = reminders.filter(r => r.status === 'completed').length;
    
    if (lateBills > 0) {
      score -= lateBills * 8;
      reasons.push(`تنبيه: يوجد ${lateBills} فواتير متأخرة السداد (مثل فاتورة الغاز) تؤثر سلباً على النقاط 💳`);
    } else if (completedBills > 3) {
      score += 5;
      reasons.push('سجل التزام مثالي: الفواتير والأقساط الأساسية تسدد في مواعيدها بانتظام 🎉');
    }

    // 3. Restaurants spike
    const restaurantSpent = expenses.filter(e => e.category === 'Restaurants').reduce((a, b) => a + b.amount, 0);
    if (restaurantSpent > monthlyBudget * 0.15) {
      score -= 8;
      reasons.push('ملاحظة: الصرف على الدليفري والمطاعم تجاوز 15% من الدخل الشهري ويحتاج إلى ترشيد 🍲');
    } else {
      reasons.push('معدل الإنفاق على الوجبات الخارجية ممتاز ويدعم الادخار الصحي 🥗');
    }

    // 4. Savings progress
    const activeGoalAmount = onboardingData?.targetAmount || 50000;
    const savedSoFar = Math.max(0, monthlyBudget - totalSpent);
    if (savedSoFar > activeGoalAmount * 0.1) {
      score += 5;
      reasons.push('جهد متميز: العائلة مستمرة في تغذية صندوق الادخار وتحقيق الأهداف 🎯');
    }

    return {
      score: Math.max(30, Math.min(100, score)),
      reasons,
      percentageSpent,
      totalSpent
    };
  }, [expenses, monthlyBudget, reminders, onboardingData]);

  // AI Dynamic Spending Predictions & confidence levels
  const predictions = useMemo(() => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const today = new Date();
    const currentDayNum = today.getDate();
    const averageDailySpent = totalSpent / Math.max(1, currentDayNum);
    
    const expectedWeeklySpend = Math.round(averageDailySpent * 7);
    const expectedMonthlySpend = Math.round(totalSpent + (averageDailySpent * (30 - currentDayNum)));
    const expectedRemaining = Math.max(0, monthlyBudget - expectedMonthlySpend);
    
    const overspendRisk = expectedMonthlySpend > monthlyBudget ? 'high' : expectedMonthlySpend > monthlyBudget * 0.85 ? 'medium' : 'low';
    const confidence = expenses.length > 15 ? 95 : expenses.length > 7 ? 88 : 72;

    return {
      expectedWeeklySpend,
      expectedMonthlySpend,
      expectedRemaining,
      overspendRisk,
      confidence
    };
  }, [expenses, monthlyBudget]);

  // Dynamic calculation for What-If Simulator
  const simulatedProjection = useMemo(() => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const currentDay = new Date().getDate();
    const currentDailyAvg = totalSpent / Math.max(1, currentDay);
    const monthlyEstimate = currentDailyAvg * 30;

    // Simulate salary with increase
    const simulatedSalary = monthlyBudget * (1 + simSalaryIncrease / 100);
    // Simulate average expenses with inflation increase
    const simulatedExpenses = monthlyEstimate * (1 + simExpensesIncrease / 100);
    // Base monthly savings after simulated changes + extra direct savings
    const simulatedMonthlySavings = Math.max(0, simulatedSalary - simulatedExpenses + simSavings);

    // Accumulated wealth projections
    const projection6m = Math.max(0, (simulatedMonthlySavings * 6) - simPurchase);
    const projection12m = Math.max(0, (simulatedMonthlySavings * 12) - simPurchase);

    // Goal Completion Estimate (e.g., target goal of 500,000 for Car or custom onboarding target)
    const goalTarget = onboardingData?.targetAmount || 150000;
    const goalName = onboardingData?.targetName || 'هدف الادخار العائلي';
    const currentSavings = Math.max(0, monthlyBudget - totalSpent);
    
    const remainingForGoal = Math.max(0, goalTarget - currentSavings);
    const monthsNeeded = simulatedMonthlySavings > 100 ? Math.ceil(remainingForGoal / simulatedMonthlySavings) : 999;
    
    const probability = simulatedMonthlySavings > monthlyBudget * 0.25 ? 'شبه مؤكد (99%)' : simulatedMonthlySavings > monthlyBudget * 0.15 ? 'مرتفع جداً (85%)' : 'متوسط (50%)';
    const riskLevel = simPurchase > simulatedSalary * 0.5 ? 'عالية جداً (قد تسبب عجزاً مؤقتاً)' : simPurchase > simulatedSalary * 0.2 ? 'متوسطة' : 'آمنة تماماً';

    return {
      simulatedMonthlySavings,
      projection6m,
      projection12m,
      monthsNeeded,
      probability,
      riskLevel,
      goalName,
      goalTarget
    };
  }, [expenses, monthlyBudget, simSavings, simPurchase, simSalaryIncrease, simExpensesIncrease, onboardingData]);

  // Trigger Chat API
  const handleSendMessage = async (textToSend: string, isVoice = false) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend, isVoice };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, text: m.text })),
          expenses,
          familyMembers,
          monthlyBudget,
          reminders
        })
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'عذراً، واجهت مشكلة في الاتصال بمستشار بيت AI. يرجى المحاولة لاحقاً.' }]);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'للأسف حدث خطأ غير متوقع. يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Voice Recording Simulation
  const handleSimulateVoiceInput = () => {
    setIsListeningVoice(true);
    setTimeout(() => {
      setIsListeningVoice(false);
      // Pick a random voice query preset
      const randomPreset = VOICE_PRESETS[Math.floor(Math.random() * VOICE_PRESETS.length)];
      handleSendMessage(randomPreset.query, true);
    }, 2500);
  };

  // Generate Reports naturally using dynamic data prompting
  const handleGenerateReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    setIsGeneratingReport(true);
    setReportResult(null);

    const reportPrompt = `
      قم بإنتاج تقرير مالي ذكي ومفصل جداً من مستشار بيت AI من النوع: "${type === 'daily' ? 'تقرير اليوم الذكي اليومي' : type === 'weekly' ? 'تقرير الأسبوع المالي المتكامل' : 'التقرير الشهري الشامل وتوقعات الشهر القادم'}".
      استخدم البيانات الحالية بدقة تامة:
      - ميزانية العائلة الإجمالية: ${monthlyBudget} ج.م
      - مجموع المصاريف الفعلية: ${healthAnalysis.totalSpent} ج.م
      - المتبقي الفعلي بالخزينة: ${monthlyBudget - healthAnalysis.totalSpent} ج.م
      - معدل التقييم المالي اليومي الحالي: ${healthAnalysis.score}/100
      - أفراد العائلة ومشاركاتهم: ${JSON.stringify(familyMembers)}
      - الفواتير المجدولة والالتزامات: ${JSON.stringify(reminders)}
      - قائمة المصروفات الأخيرة المسجلة: ${JSON.stringify(expenses.slice(0, 10))}

      اجعل التقرير غنياً ومكتوباً بأسلوب راقٍ جذاب يبرز:
      1. أكبر الفئات صرفاً (Biggest Expenses) مع قيمتها بدقة.
      2. نقاط ترشيد وادخار واضحة وممتازة (Best Saving tips).
      3. تحليل الالتزامات والفواتير القادمة.
      4. نصائح مخصصة بأسماء أفراد العائلة (أحمد، منى، يوسف) بناء على الصرف.
      5. توقعات دقيقة ومستقبلية للشهر القادم.
      استخدم التنسيق الجميل والقوائم المنظمة والرموز التعبيرية الجذابة.
    `;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reportPrompt,
          expenses,
          familyMembers,
          monthlyBudget,
          reminders
        })
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setReportResult(data.reply);
      } else {
        setReportResult('فشل توليد التقرير الذكي حالياً. يرجى إعادة المحاولة.');
      }
    } catch (e) {
      console.error(e);
      setReportResult('حدث خطأ أثناء إعداد التقرير المالي.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Auto trigger daily report on tab mount
  useEffect(() => {
    if (activeTab === 'reports' && !reportResult && !isGeneratingReport) {
      handleGenerateReport(selectedReportType);
    }
  }, [activeTab, selectedReportType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md h-[92vh] sm:h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors"
      >
        {/* Chat Premium Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center border border-white/10 relative">
              <Brain className="w-6 h-6 text-white animate-pulse" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-sm font-black leading-tight flex items-center gap-1">
                <span>العقل المالي الذكي لبيت AI</span>
                <Sparkles className="w-3.5 h-3.5 fill-white text-yellow-300" />
              </h3>
              <p className="text-[10px] text-blue-100 font-medium">التحليل الشامل والذكاء الاصطناعي التنبؤي والمستشار المباشر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Brain Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shrink-0">
          {[
            { id: 'chat', label: 'المستشار الذكي' },
            { id: 'analysis', label: 'التحليلات والتوقعات' },
            { id: 'simulator', label: 'محاكي "ماذا لو؟"' },
            { id: 'reports', label: 'التقارير المالية' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-3.5 text-[10px] font-bold text-center border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600 font-black bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/20">
          
          {/* TAB 1: SMART CHAT & VOICE */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, index) => {
                  const isModel = msg.role === 'model';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-0' : 'ml-auto flex-row-reverse'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isModel 
                          ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-slate-800 dark:text-blue-400 dark:border-slate-700' 
                          : 'bg-slate-800 text-slate-100 border-slate-700'
                      }`}>
                        {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        isModel
                          ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 shadow-xs'
                          : 'bg-blue-600 text-white font-medium shadow-sm'
                      }`}>
                        {msg.isVoice && (
                          <div className="flex items-center gap-1 mb-2 text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold w-fit">
                            <Volume2 className="w-3 h-3" />
                            <span>سؤال صوتي مفسر</span>
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Simulated Voice Listening Ripple overlay */}
                {isListeningVoice && (
                  <div className="flex flex-col items-center justify-center py-6 bg-blue-50/60 border border-blue-100 rounded-3xl mx-auto w-[90%] gap-3 animate-pulse">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-35" />
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <Mic className="w-6 h-6 animate-bounce" />
                      </div>
                    </div>
                    <p className="text-xs font-black text-blue-700">جاري الاستماع لصوتك وفهم لهجتك العائلية...</p>
                    <p className="text-[10px] text-slate-400 font-bold">يمكنك التحدث بالعامية مثل: "كم باقيلي؟" أو "مصاريف العربية"</p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 text-xs flex items-center gap-1 shadow-xs">
                      <span>عقل بيت AI يحلل حساباتك الآن</span>
                      <span className="flex gap-0.5 mt-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer, Suggestions & Inputs */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3.5">
                
                {/* Voice presets quick panel */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    <span>تحدث صوتياً مع الذكاء الاصطناعي (أمثلة للتحفيز):</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {VOICE_PRESETS.map((vp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(vp.query, true)}
                        disabled={isLoading || isListeningVoice}
                        className="px-3 py-1.5 bg-blue-50/60 hover:bg-blue-100 border border-blue-100/40 text-[10px] font-black text-blue-700 rounded-full shrink-0 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {vp.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standard suggestions quick chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CHAT_SUGGESTIONS.map((cs, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(cs)}
                      disabled={isLoading || isListeningVoice}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-full shrink-0 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {cs}
                    </button>
                  ))}
                </div>

                {/* Standard text input + mic toggle button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading || isListeningVoice}
                    placeholder="اطرح أي سؤال مالي لعائلتك بالعامية..."
                    className="flex-1 p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all text-right"
                    style={{ direction: 'rtl' }}
                  />
                  
                  {/* Speech Recognition Mic trigger simulation */}
                  <button
                    type="button"
                    onClick={handleSimulateVoiceInput}
                    disabled={isLoading || isListeningVoice}
                    className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                    title="تحدث الآن بالذكاء الاصطناعي الصوتي"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading || isListeningVoice}
                    className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-300 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED MEMORY, HEALTH & PREDICTIONS */}
          {activeTab === 'analysis' && (
            <div className="p-5 space-y-6 animate-fade-in text-right" style={{ direction: 'rtl' }}>
              
              {/* 1. Interactive Health Score */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-4 left-4">
                  <Activity className="w-10 h-10 text-blue-100 dark:text-blue-900/40" />
                </div>
                
                <div className="flex items-center gap-5 mb-4">
                  {/* Health gauge */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="34" 
                        className="stroke-blue-600 fill-none transition-all duration-700" 
                        strokeWidth="6" 
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - healthAnalysis.score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-bold font-financial text-slate-800 dark:text-white">{healthAnalysis.score}</span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase -mt-1">صحة الصرف</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">مؤشر الصحة المالية الشهري للعائلة</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">تقييم تلقائي شامل للادخار والميزانيات وسداد الالتزامات</p>
                  </div>
                </div>

                {/* Analytical breakdown */}
                <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">أسباب وملاحظات العقل الاصطناعي لبيت AI:</p>
                  <div className="space-y-2">
                    {healthAnalysis.reasons.map((reason, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Spending Predictions */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>توقعات الصرف والسيولة المتبقية</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-[1.8rem] shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">المتوقع صرفه هذا الأسبوع</span>
                    <span className="text-base font-bold text-slate-800 dark:text-white font-financial block">{formatCurrency(predictions.expectedWeeklySpend)}</span>
                    <p className="text-[8px] text-slate-400 font-semibold mt-1">بناء على معدل الإنفاق اليومي</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-[1.8rem] shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">المتوقع صرفه لآخر الشهر</span>
                    <span className="text-base font-bold text-slate-800 dark:text-white font-financial block">{formatCurrency(predictions.expectedMonthlySpend)}</span>
                    <p className="text-[8px] text-slate-400 font-semibold mt-1">المصاريف الكلية المتوقعة</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-[1.8rem] shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">الرصيد المتبقي المتوقع</span>
                    <span className={`text-base font-bold font-financial block ${predictions.expectedRemaining < 1000 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(predictions.expectedRemaining)}</span>
                    <p className="text-[8px] text-slate-400 font-semibold mt-1">السيولة المتبقية الآمنة</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-[1.8rem] shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">مخاطر تجاوز الميزانية</span>
                    <span className={`text-xs font-black block mt-1.5 ${predictions.overspendRisk === 'high' ? 'text-rose-500' : predictions.overspendRisk === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {predictions.overspendRisk === 'high' ? '🚨 مخاطر عالية جداً' : predictions.overspendRisk === 'medium' ? '⚠️ مخاطر متوسطة' : '🛡️ أمان مالي تام'}
                    </span>
                    <p className="text-[8px] text-slate-400 font-bold mt-1">دقة التوقع: {predictions.confidence}%</p>
                  </div>
                </div>
              </div>

              {/* 3. Automatic Pattern Discovery List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span>الأنماط والسلوكيات المكتشفة تلقائياً</span>
                </h3>

                <div className="space-y-2.5">
                  {[
                    { title: 'يوم الجمعة هو يوم التموين العائلي 🛒', desc: 'تم الكشف عن شراء البقالة أسبوعياً كل يوم جمعة بانتظام.' },
                    { title: 'ارتفاع فواتير الكهرباء صيفاً ⚡', desc: 'معدل فاتورة الصيف يقفز بنسبة 105% بسبب التكييفات.' },
                    { title: 'المطاعم تزداد في عطلة الأسبوع 🍔', desc: 'الصرف على الوجبات الخارجية يتضاعف يومي الجمعة والسبت بمتوسط 24%.' },
                    { title: 'التعبئة الدورية لوقود السيارة 🚗', desc: 'يتم شحن السيارة بالوقود أو الصيانة بمعدل ثابت كل 10 أيام.' },
                    { title: 'موعد إيداع الراتب ثابت شهرياً 🏦', desc: 'الراتب يدخل الحساب بانتظام يوم 25 في الشهر.' }
                  ].map((p, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-[1.5rem] shadow-xs flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{p.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHAT IF SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="p-5 space-y-6 animate-fade-in text-right" style={{ direction: 'rtl' }}>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">محاكي السيناريوهات المالية لبيت AI 🔮</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">غير الأرقام والفرضيات لترى تأثيرها المباشر على مستقبلك المالي للبيت</p>
              </div>

              {/* Sliders and Inputs Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xs space-y-5">
                
                {/* 1. Direct Savings */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">الادخار الشهري الإضافي المخطط:</span>
                    <span className="font-black text-blue-600 font-financial text-sm">{simSavings} ج.م</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="500"
                    value={simSavings} 
                    onChange={(e) => setSimSavings(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>0 ج.م</span>
                    <span>10,000 ج.م</span>
                  </div>
                </div>

                {/* 2. Big purchase cost */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">شراء سلعة كبيرة (سيارة/هاتف/رحلة):</span>
                    <span className="font-black text-orange-500 font-financial text-sm">{simPurchase} ج.م</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="أدخل قيمة السلعة المخططة..."
                    value={simPurchase || ''} 
                    onChange={(e) => setSimPurchase(Number(e.target.value))}
                    className="w-full p-2.5 text-xs text-left font-financial border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-600 outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>

                {/* 3. Salary Increase slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">نسبة زيادة الراتب المتوقعة:</span>
                    <span className="font-black text-emerald-600 font-financial text-sm">+{simSalaryIncrease}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="5"
                    value={simSalaryIncrease} 
                    onChange={(e) => setSimSalaryIncrease(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* 4. Inflation/expenses increase */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">معدل التضخم وزيادة المصاريف العامة:</span>
                    <span className="font-black text-rose-500 font-financial text-sm">+{simExpensesIncrease}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    step="2"
                    value={simExpensesIncrease} 
                    onChange={(e) => setSimExpensesIncrease(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

              </div>

              {/* Simulated Projections output Card */}
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-[2rem] p-6 shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute top-2 left-2 opacity-5">
                  <Brain className="w-40 h-40" />
                </div>
                
                <h4 className="text-xs font-black text-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>تقدير الذكاء الاصطناعي للمستقبل المالي</span>
                </h4>

                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="block text-[8px] text-blue-200">الادخار الشهري الجديد المتوقع:</span>
                    <span className="text-base font-bold text-white font-financial block mt-0.5">{formatCurrency(simulatedProjection.simulatedMonthlySavings)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-blue-200">الأمان المالي المقابل:</span>
                    <span className={`text-xs font-black block mt-1.5 ${simulatedProjection.simulatedMonthlySavings > monthlyBudget * 0.15 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {simulatedProjection.simulatedMonthlySavings > monthlyBudget * 0.2 ? '🛡️ ممتاز وآمن جداً' : '⚠️ متزن ويحتاج لضبط'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="block text-[8px] text-blue-200">الرصيد المتراكم بعد 6 أشهر:</span>
                    <span className="text-base font-bold text-white font-financial block mt-0.5">{formatCurrency(simulatedProjection.projection6m)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-blue-200">الرصيد المتراكم بعد سنة كاملة:</span>
                    <span className="text-base font-bold text-white font-financial block mt-0.5">{formatCurrency(simulatedProjection.projection12m)}</span>
                  </div>
                </div>

                <div className="space-y-1 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] text-blue-100">
                    <span>تحقيق هدف: "{simulatedProjection.goalName}" ({formatCurrency(simulatedProjection.goalTarget)})</span>
                    <span className="font-bold">{simulatedProjection.probability}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-semibold leading-relaxed mt-1">
                    بناءً على المعطيات والادخار المحدث، ستحقق العائلة هدف الادخار في غضون <strong className="text-emerald-300 font-financial text-xs">{simulatedProjection.monthsNeeded} شهراً</strong> فقط بدلاً من المعدل السابق للعامة.
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">مخاطر الشراء العشوائي المخطط: {simulatedProjection.riskLevel}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATIC FINANCIAL REPORTS */}
          {activeTab === 'reports' && (
            <div className="p-5 space-y-6 animate-fade-in text-right" style={{ direction: 'rtl' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">التقارير المالية التلقائية الذكية</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">تقارير وتحليلات من مستشارك المالي بناء على تفاصيل حياتكم الفعلية</p>
                </div>
              </div>

              {/* Select Report Type */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                {[
                  { id: 'daily', label: 'التقرير اليومي 📅' },
                  { id: 'weekly', label: 'التقرير الأسبوعي 📊' },
                  { id: 'monthly', label: 'التقرير الشهري الشامل 🔮' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedReportType(r.id as any);
                      handleGenerateReport(r.id as any);
                    }}
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl text-center transition-all ${
                      selectedReportType === r.id
                        ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Report display content */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xs min-h-[250px] flex flex-col justify-between">
                
                {isGeneratingReport ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-slate-400 text-xs">
                    <Activity className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="font-black text-blue-600">يقوم بيت AI بجمع بيانات عائلتك ومراجعة الفواتير...</p>
                    <p className="text-[10px] text-slate-400 font-bold">جاري الصياغة والتحليل المتقدم</p>
                  </div>
                ) : reportResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/50 pb-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-white">تفاصيل تقرير بيت AI المقترح لأسرتكم:</span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-1 font-semibold">
                      {reportResult}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-12">
                    يرجى النقر لتحديث وإعداد التقرير المالي.
                  </div>
                )}

                {/* Regenerate/Trigger button */}
                <button
                  onClick={() => handleGenerateReport(selectedReportType)}
                  disabled={isGeneratingReport}
                  className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-blue-50/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  تحديث التقرير المالي تلقائياً بالذكاء الاصطناعي 🔄
                </button>

              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
