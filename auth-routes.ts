import express from 'express';
import { 
  readDb, 
  writeDb, 
  hashPassword, 
  generateToken, 
  DbUser, 
  DbProfile, 
  DbSession, 
  DbLoginHistory, 
  DbOnboarding,
  DbExpense,
  DbFamilyMember,
  DbReminder,
  DbNotification
} from './db-store.js';

// Helper to extract token from Authorization header
export function getSessionFromRequest(req: express.Request): DbSession | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const db = readDb();
  const session = db.sessions.find(s => s.token === token && s.isActive);
  
  if (!session) return null;
  
  // Check if session has expired
  if (new Date(session.expiresAt) < new Date()) {
    session.isActive = false;
    writeDb(db);
    return null;
  }
  
  return session;
}

// Simple browser/OS detection
function parseUserAgent(userAgent: string = '') {
  let browser = 'Unknown Browser';
  let platform = 'Unknown Platform';
  let device = 'PC / Desktop';

  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) browser = 'Google Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('edge')) browser = 'Microsoft Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  if (ua.includes('iphone') || ua.includes('ipad')) {
    platform = 'iOS';
    device = ua.includes('ipad') ? 'Tablet (iPad)' : 'Mobile (iPhone)';
  } else if (ua.includes('android')) {
    platform = 'Android';
    device = 'Mobile (Android)';
  } else if (ua.includes('windows')) {
    platform = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    platform = 'macOS';
  } else if (ua.includes('linux')) {
    platform = 'Linux';
  }

  return { browser, platform, device };
}

export function registerAuthRoutes(app: express.Express) {
  
  // 1. User Registration
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, fullName, phone, country, currency, acceptTerms } = req.body;
      
      if (!email || !password || !fullName || !country || !currency) {
        return res.status(400).json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة لتسجيل الحساب.' });
      }

      if (!acceptTerms) {
        return res.status(400).json({ success: false, error: 'يجب الموافقة على الشروط والأحكام و سياسة الخصوصية للمتابعة.' });
      }

      const db = readDb();
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
        return res.status(400).json({ success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' });
      }

      const userId = 'usr_' + generateToken(12);
      const passwordHash = hashPassword(password);
      const verificationToken = generateToken(16);

      // Create User
      const newUser: DbUser = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        verified: false,
        verificationToken
      };

      // Create Profile
      const newProfile: DbProfile = {
        userId,
        fullName,
        phone: phone || '',
        country,
        currency,
        language: 'ar',
        subscription: 'Standard',
        profilePicture: '👨🏻‍💼',
        createdDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Create Onboarding State
      const newOnboarding: DbOnboarding = {
        userId,
        onboardingCompleted: false,
        salary: 0,
        otherIncome: 0,
        familyMembersCount: 1,
        ownsCar: false,
        paysInstallments: false,
        participatesInGroup: false,
        homeStatus: 'own',
        wantsGoals: true
      };

      db.users.push(newUser);
      db.profiles.push(newProfile);
      db.onboarding.push(newOnboarding);
      writeDb(db);

      res.status(201).json({ 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتنشيط الحساب.',
        userId,
        verificationToken // return token directly for simulation ease
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الحساب.' });
    }
  });

  // 2. User Login (Email & Password)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
      }

      const db = readDb();
      const normalizedEmail = email.toLowerCase().trim();
      const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
      }

      // Check if email is verified
      if (!user.verified) {
        return res.status(403).json({ 
          success: false, 
          error: 'يرجى تفعيل حسابك أولاً عن طريق رمز التحقق المرسل لبريدك الإلكتروني.',
          notVerified: true,
          email: user.email 
        });
      }

      // Extract device info
      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, platform, device } = parseUserAgent(userAgentStr);
      const ip = req.ip || '127.0.0.1';
      const countryCode = user.role === 'ADMIN' ? 'EG' : 'EG'; // default based on Egypt for cairo local context

      // Create Session
      const sessionToken = generateToken(32);
      const expiresInDays = rememberMe ? 30 : 1;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const session: DbSession = {
        id: 'sess_' + generateToken(12),
        userId: user.id,
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        device,
        platform,
        browser,
        ip,
        country: user.role === 'ADMIN' ? 'Egypt' : 'Egypt',
        isActive: true
      };

      // Add to Login History
      const historyItem: DbLoginHistory = {
        id: 'hist_' + generateToken(12),
        userId: user.id,
        loginDate: new Date().toISOString(),
        logoutDate: null,
        ip,
        country: 'Egypt',
        browser,
        device,
        platform
      };

      db.sessions.push(session);
      db.loginHistory.push(historyItem);
      
      // Update last login
      const profile = db.profiles.find(p => p.userId === user.id);
      if (profile) {
        profile.lastLogin = new Date().toISOString();
      }

      writeDb(db);

      const onboarding = db.onboarding.find(o => o.userId === user.id);

      res.json({
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified
        },
        profile,
        onboarding: onboarding || { onboardingCompleted: false }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة تسجيل الدخول.' });
    }
  });

  // 3. Simulated Google / Apple Authentication (OAuth)
  app.post('/api/auth/oauth-login', (req, res) => {
    try {
      const { email, fullName, provider, profilePicture } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ success: false, error: 'بيانات الاعتماد غير مكتملة.' });
      }

      const db = readDb();
      const normalizedEmail = email.toLowerCase().trim();
      let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
      let isFirstTime = false;

      if (!user) {
        isFirstTime = true;
        // Auto-create user via Google/Apple sign in
        const userId = 'usr_' + generateToken(12);
        user = {
          id: userId,
          email: normalizedEmail,
          passwordHash: hashPassword(generateToken(16)), // secure dummy pass
          role: 'USER',
          verified: true // OAuth implies verified
        };

        const newProfile: DbProfile = {
          userId,
          fullName,
          phone: '',
          country: 'مصر',
          currency: 'EGP',
          language: 'ar',
          subscription: 'Standard',
          profilePicture: profilePicture || '👨🏻‍💼',
          createdDate: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        const newOnboarding: DbOnboarding = {
          userId,
          onboardingCompleted: false,
          salary: 0,
          otherIncome: 0,
          familyMembersCount: 1,
          ownsCar: false,
          paysInstallments: false,
          participatesInGroup: false,
          homeStatus: 'own',
          wantsGoals: true
        };

        db.users.push(user);
        db.profiles.push(newProfile);
        db.onboarding.push(newOnboarding);
      }

      // Create Session
      const sessionToken = generateToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Google login defaults to 30 days session

      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, platform, device } = parseUserAgent(userAgentStr);
      const ip = req.ip || '127.0.0.1';

      const session: DbSession = {
        id: 'sess_' + generateToken(12),
        userId: user.id,
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        device,
        platform,
        browser,
        ip,
        country: 'Egypt',
        isActive: true
      };

      const historyItem: DbLoginHistory = {
        id: 'hist_' + generateToken(12),
        userId: user.id,
        loginDate: new Date().toISOString(),
        logoutDate: null,
        ip,
        country: 'Egypt',
        browser,
        device,
        platform
      };

      db.sessions.push(session);
      db.loginHistory.push(historyItem);

      // Update profile
      const profile = db.profiles.find(p => p.userId === user!.id);
      if (profile) {
        profile.lastLogin = new Date().toISOString();
      }

      writeDb(db);

      const onboarding = db.onboarding.find(o => o.userId === user!.id);

      res.json({
        success: true,
        token: sessionToken,
        isFirstTime,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified
        },
        profile,
        onboarding: onboarding || { onboardingCompleted: false }
      });
    } catch (error: any) {
      console.error('OAuth Login error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء المصادقة عبر الخدمة الخارجية.' });
    }
  });

  // 4. Verify Email Address
  app.post('/api/auth/verify-email', (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'رمز التحقق مطلوب.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.verificationToken === token);

      if (!user) {
        return res.status(400).json({ success: false, error: 'رمز التحقق من البريد غير صالح أو منتهي الصلاحية.' });
      }

      user.verified = true;
      user.verificationToken = undefined; // clear once used
      writeDb(db);

      res.json({ success: true, message: 'تهانينا! تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول.' });
    } catch (error: any) {
      console.error('Verify email error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تفعيل الحساب.' });
    }
  });

  // 5. Resend Verification Email
  app.post('/api/auth/resend-verification', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير مسجل.' });
      }

      if (user.verified) {
        return res.status(400).json({ success: false, error: 'هذا البريد تم تفعيله مسبقاً.' });
      }

      const verificationToken = generateToken(16);
      user.verificationToken = verificationToken;
      writeDb(db);

      res.json({ 
        success: true, 
        message: 'تم إعادة إرسال رابط تفعيل الحساب بنجاح لبريدك الإلكتروني.',
        token: verificationToken // simplify for simulator
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة إرسال رابط التفعيل.' });
    }
  });

  // 6. Forgot Password Request
  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب لإرسال رابط إعادة تعيين كلمة المرور.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(404).json({ success: false, error: 'البريد المدخل غير مسجل لدينا.' });
      }

      const resetToken = generateToken(16);
      user.resetToken = resetToken;
      writeDb(db);

      res.json({
        success: true,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح. يرجى مراجعة صندوق الوارد.',
        token: resetToken // simplify for UI verification
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة طلب استعادة كلمة المرور.' });
    }
  });

  // 7. Reset Password Submit
  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'الرمز وكلمة المرور الجديدة مطلوبان.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.resetToken === token);

      if (!user) {
        return res.status(400).json({ success: false, error: 'رمز تعيين كلمة المرور غير صالح أو منتهي الصلاحية.' });
      }

      user.passwordHash = hashPassword(newPassword);
      user.resetToken = undefined; // clear
      writeDb(db);

      res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول ببياناتك الجديدة.' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور.' });
    }
  });

  function checkSubscriptionReminders(db: any, profile: any) {
    if (profile.subscription !== 'Premium' || !profile.subscriptionExpiryDate) {
      return;
    }

    const expiryDate = new Date(profile.subscriptionExpiryDate);
    const now = new Date();
    
    // Calculate remaining time in days
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const userId = profile.userId;
    if (!db.notifications) {
      db.notifications = [];
    }

    const userNotifications = db.notifications.filter((n: any) => n.userId === userId);

    // Helper to check if a specific notification has already been sent
    const hasNotification = (keyword: string) => {
      return userNotifications.some((n: any) => n.title.includes(keyword));
    };

    if (diffDays <= 0) {
      // Subscription Expired! Downgrade user & notify
      if (!hasNotification('انتهت صلاحية باقة بريميوم')) {
        profile.subscription = 'Standard';
        profile.subscriptionExpiryDate = undefined;

        db.notifications.push({
          userId,
          id: 'not_' + generateToken(8),
          title: 'انتهت صلاحية باقة بريميوم 🔴',
          message: 'لقد انتهت فترة صلاحية عضويتك الممتازة للأسف وتمت إعادتك للباقة العادية. يرجى تجديد الاشتراك للاستمتاع مجدداً بكافة ميزات الذكاء الاصطناعي والمزامنة اللانهائية.',
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'high',
          category: 'System'
        });
      }
    } else if (diffDays === 1) {
      if (!hasNotification('يوم واحد متبقي')) {
        db.notifications.push({
          userId,
          id: 'not_' + generateToken(8),
          title: 'يوم واحد متبقي على انتهاء باقة بريميوم! ⚠️',
          message: 'تنبيه: ستنتهي صلاحية عضويتك بريميوم غداً. يرجى تجديد التحويل لتجنب توقف ميزات الذكاء الاصطناعي والمزامنة اللانهائية.',
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'high',
          category: 'System'
        });
      }
    } else if (diffDays <= 3 && diffDays > 1) {
      if (!hasNotification('٣ أيام متبقية')) {
        db.notifications.push({
          userId,
          id: 'not_' + generateToken(8),
          title: '٣ أيام متبقية على تجديد باقة بريميوم ⏳',
          message: `تنبيه: يتبقى ٣ أيام فقط على انتهاء اشتراك العائلة الممتازة في تطبيق بيت AI. تاريخ الانتهاء: ${expiryDate.toLocaleDateString('ar-EG')}.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'medium',
          category: 'System'
        });
      }
    } else if (diffDays <= 7 && diffDays > 3) {
      if (!hasNotification('٧ أيام متبقية')) {
        db.notifications.push({
          userId,
          id: 'not_' + generateToken(8),
          title: '٧ أيام متبقية على انتهاء اشتراكك الممتاز 🗓️',
          message: `نود تذكيرك بأن اشتراك باقة بريميوم الخاص بك سينتهي خلال أسبوع في تاريخ ${expiryDate.toLocaleDateString('ar-EG')}.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'medium',
          category: 'System'
        });
      }
    }
  }

  // 8. Get current active session user & profile details
  app.get('/api/auth/me', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة أو لم يتم تسجيل الدخول.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.id === session.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
      }

      const profile = db.profiles.find(p => p.userId === user.id);
      
      if (profile) {
        checkSubscriptionReminders(db, profile);
        writeDb(db);
      }

      const onboarding = db.onboarding.find(o => o.userId === user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified
        },
        profile,
        onboarding: onboarding || { onboardingCompleted: false }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
    }
  });

  // 9. Update profile information
  app.post('/api/auth/update-profile', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح للقيام بهذه العملية.' });
      }

      const { fullName, phone, country, currency, language, profilePicture, password } = req.body;
      const db = readDb();
      
      const profile = db.profiles.find(p => p.userId === session.userId);
      const user = db.users.find(u => u.id === session.userId);

      if (!profile || !user) {
        return res.status(404).json({ success: false, error: 'بيانات الحساب غير موجودة.' });
      }

      // Apply modifications
      if (fullName !== undefined) profile.fullName = fullName;
      if (phone !== undefined) profile.phone = phone;
      if (country !== undefined) profile.country = country;
      if (currency !== undefined) profile.currency = currency;
      if (language !== undefined) profile.language = language;
      if (profilePicture !== undefined) profile.profilePicture = profilePicture;
      
      // Password change
      if (password) {
        user.passwordHash = hashPassword(password);
      }

      writeDb(db);

      res.json({ 
        success: true, 
        message: 'تم تحديث البيانات الشخصية لحسابك المالي بنجاح.',
        profile 
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعديل الملف الشخصي.' });
    }
  });

  // 10. Sync User Expenses / Family Members
  app.post('/api/user/sync-data', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح بمزامنة البيانات.' });
      }

      const { expenses, familyMembers, reminders, notifications, onboarding } = req.body;
      const db = readDb();
      const userId = session.userId;

      // Update onboarding data if passed
      if (onboarding) {
        let ob = db.onboarding.find(o => o.userId === userId);
        if (!ob) {
          ob = { userId, onboardingCompleted: true, salary: 0, otherIncome: 0, familyMembersCount: 1, ownsCar: false, paysInstallments: false, participatesInGroup: false, homeStatus: 'own', wantsGoals: true };
          db.onboarding.push(ob);
        }
        ob.onboardingCompleted = onboarding.onboardingCompleted ?? ob.onboardingCompleted;
        ob.salary = onboarding.monthlySalary ?? onboarding.salary ?? ob.salary;
        ob.otherIncome = onboarding.otherIncome ?? ob.otherIncome;
        ob.familyMembersCount = onboarding.familyMembersCount ?? ob.familyMembersCount;
        ob.ownsCar = onboarding.ownsCar ?? ob.ownsCar;
        ob.paysInstallments = onboarding.paysInstallments ?? ob.paysInstallments;
        ob.participatesInGroup = onboarding.participatesInGroup ?? ob.participatesInGroup;
        ob.homeStatus = onboarding.homeStatus ?? ob.homeStatus;
        ob.wantsGoals = onboarding.wantsGoals ?? ob.wantsGoals;
      }

      // Sync Expenses
      if (expenses && Array.isArray(expenses)) {
        // Clear old expenses and write new ones
        db.expenses = db.expenses.filter(e => e.userId !== userId);
        expenses.forEach((exp: any) => {
          db.expenses.push({
            userId,
            id: exp.id || 'exp_' + generateToken(8),
            title: exp.title,
            amount: Number(exp.amount) || 0,
            date: exp.date,
            time: exp.time,
            category: exp.category,
            merchant: exp.merchant,
            paymentMethod: exp.paymentMethod,
            vat: Number(exp.vat) || 0,
            recordedBy: exp.recordedBy,
            notes: exp.notes || '',
            tags: exp.tags || []
          });
        });
      }

      // Sync Family Members
      if (familyMembers && Array.isArray(familyMembers)) {
        db.familyMembers = db.familyMembers.filter(m => m.userId !== userId);
        familyMembers.forEach((mem: any) => {
          db.familyMembers.push({
            userId,
            id: mem.id || 'mem_' + generateToken(8),
            name: mem.name,
            avatar: mem.avatar,
            monthlyBudget: Number(mem.monthlyBudget) || 0,
            spentThisMonth: Number(mem.spentThisMonth) || 0,
            role: mem.role
          });
        });
      }

      // Sync Reminders
      if (reminders && Array.isArray(reminders)) {
        db.reminders = db.reminders.filter(r => r.userId !== userId);
        reminders.forEach((rem: any) => {
          db.reminders.push({
            userId,
            id: rem.id || 'rem_' + generateToken(8),
            title: rem.title,
            amount: Number(rem.amount) || 0,
            dueDate: rem.dueDate,
            category: rem.category,
            priority: rem.priority || 'medium',
            status: rem.status || 'upcoming'
          });
        });
      }

      // Sync Notifications
      if (notifications && Array.isArray(notifications)) {
        db.notifications = db.notifications.filter(n => n.userId !== userId);
        notifications.forEach((notif: any) => {
          db.notifications.push({
            userId,
            id: notif.id || 'notif_' + generateToken(8),
            title: notif.title,
            message: notif.message,
            timestamp: notif.timestamp || new Date().toISOString(),
            isRead: !!notif.isRead,
            isArchived: !!notif.isArchived,
            priority: notif.priority || 'medium',
            category: notif.category || 'financial'
          });
        });
      }

      writeDb(db);

      res.json({
        success: true,
        message: 'تمت مزامنة كافة البيانات المالية السحابية بنجاح.',
        expenses: db.expenses.filter(e => e.userId === userId),
        familyMembers: db.familyMembers.filter(m => m.userId === userId),
        reminders: db.reminders.filter(r => r.userId === userId),
        notifications: db.notifications.filter(n => n.userId === userId)
      });
    } catch (error: any) {
      console.error('Sync data error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء حفظ ومزامنة البيانات.' });
    }
  });

  // Pull Cloud Data for login sync
  app.get('/api/user/pull-data', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const db = readDb();
      const userId = session.userId;

      res.json({
        success: true,
        expenses: db.expenses.filter(e => e.userId === userId),
        familyMembers: db.familyMembers.filter(m => m.userId === userId),
        reminders: db.reminders.filter(r => r.userId === userId),
        notifications: db.notifications.filter(n => n.userId === userId),
        onboarding: db.onboarding.find(o => o.userId === userId)
      });
    } catch (error: any) {
      console.error('Pull data error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء استيراد البيانات المالية.' });
    }
  });

  // 11. Delete Account
  app.post('/api/auth/delete-account', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const userId = session.userId;

      // Prevent admin deletion via client
      const user = db.users.find(u => u.id === userId);
      if (user?.role === 'ADMIN') {
        return res.status(403).json({ success: false, error: 'غير مسموح بحذف حساب مسؤول الإدارة الرئيسي.' });
      }

      // Cascade deletes for userId across all schemas
      db.users = db.users.filter(u => u.id !== userId);
      db.profiles = db.profiles.filter(p => p.userId !== userId);
      db.onboarding = db.onboarding.filter(o => o.userId !== userId);
      db.sessions = db.sessions.filter(s => s.userId !== userId);
      db.loginHistory = db.loginHistory.filter(h => h.userId !== userId);
      db.expenses = db.expenses.filter(e => e.userId !== userId);
      db.familyMembers = db.familyMembers.filter(m => m.userId !== userId);
      db.reminders = db.reminders.filter(r => r.userId !== userId);
      db.notifications = db.notifications.filter(n => n.userId !== userId);

      writeDb(db);

      res.json({ success: true, message: 'تم مسح وحذف حسابك المالي وكافة بياناتك السحابية نهائياً بنجاح.' });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء حذف الحساب.' });
    }
  });

  // 12. List Active Sessions and Device History
  app.get('/api/auth/sessions', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const db = readDb();
      const activeSessions = db.sessions.filter(s => s.userId === session.userId && s.isActive);
      const loginHistory = db.loginHistory.filter(h => h.userId === session.userId).slice(-10); // last 10 log-ins

      res.json({
        success: true,
        activeSessions,
        loginHistory
      });
    } catch (error: any) {
      console.error('Get sessions error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب الأجهزة النشطة.' });
    }
  });

  // 13. Logout current device
  app.post('/api/auth/logout', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (session) {
        const db = readDb();
        const activeSess = db.sessions.find(s => s.id === session.id);
        if (activeSess) {
          activeSess.isActive = false;
        }

        // Add logout date to history
        const hist = db.loginHistory.find(h => h.userId === session.userId && h.logoutDate === null);
        if (hist) {
          hist.logoutDate = new Date().toISOString();
        }

        writeDb(db);
      }
      res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج.' });
    }
  });

  // 14. Logout all other devices
  app.post('/api/auth/logout-all-devices', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت الصلاحية.' });
      }

      const db = readDb();
      // Set all sessions of this user inactive except the current active one
      db.sessions.forEach(s => {
        if (s.userId === session.userId && s.id !== session.id) {
          s.isActive = false;
        }
      });

      // Update logout dates for history
      db.loginHistory.forEach(h => {
        if (h.userId === session.userId && h.logoutDate === null) {
          h.logoutDate = new Date().toISOString();
        }
      });

      writeDb(db);

      res.json({ success: true, message: 'تم إنهاء كافة جلسات الأجهزة الأخرى بنجاح.' });
    } catch (error: any) {
      console.error('Logout all devices error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إنهاء الجلسات.' });
    }
  });

  // 15. Admin Login Route
  app.post('/api/admin/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
      }

      const db = readDb();
      const normalizedEmail = email.toLowerCase().trim();
      const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'));

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور الخاصة بالإدارة غير صحيحة.' });
      }

      // Generate verification code for 2FA (for simulation, constant '123456')
      res.json({
        success: true,
        message: 'تم التحقق بنجاح من بيانات الاعتماد، يرجى إدخال رمز التحقق الثنائي (2FA).',
        requires2FA: true,
        email: user.email
      });
    } catch (error: any) {
      console.error('Admin login check error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة تسجيل دخول الإدارة.' });
    }
  });

  // Verify Admin 2FA and issue Token
  app.post('/api/admin/auth/verify-2fa', (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'البريد والرمز مطلوبان.' });
      }

      if (code !== '123456') {
        return res.status(401).json({ success: false, error: 'رمز التحقق الثنائي غير صحيح. استخدم الرمز المجدول 123456.' });
      }

      const db = readDb();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'));

      if (!user) {
        return res.status(404).json({ success: false, error: 'المسؤول غير متواجد.' });
      }

      const sessionToken = generateToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 1 day session for admins

      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, platform, device } = parseUserAgent(userAgentStr);
      const ip = req.ip || '127.0.0.1';

      const session: DbSession = {
        id: 'sess_' + generateToken(12),
        userId: user.id,
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        device,
        platform,
        browser,
        ip,
        country: 'Egypt',
        isActive: true
      };

      db.sessions.push(session);
      writeDb(db);

      const profile = db.profiles.find(p => p.userId === user.id);

      res.json({
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        profile
      });
    } catch (error: any) {
      console.error('Verify 2fa error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة رمز الدخول.' });
    }
  });

  // 16. Admin Stats Dashboard API (Requires Admin Role Checking)
  app.get('/api/admin/stats', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const currentUser = db.users.find(u => u.id === session.userId);
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور! ليس لديك صلاحيات إدارية (403 Forbidden).' });
      }

      // Generate analytics from tables
      const totalUsersCount = db.users.filter(u => u.role === 'USER').length;
      const totalSubscribedUsersCount = db.profiles.filter(p => p.subscription === 'Premium').length;
      const totalRevenue = totalSubscribedUsersCount * 249; // e.g. 249 EGP per premium subscription
      const totalExpensesRecorded = db.expenses.length;
      const totalSpentAllUsers = db.expenses.reduce((sum, e) => sum + e.amount, 0);

      // List of users with profiles
      const usersList = db.users.filter(u => u.role === 'USER').map(u => {
        const prof = db.profiles.find(p => p.userId === u.id);
        const ob = db.onboarding.find(o => o.userId === u.id);
        const sessCount = db.sessions.filter(s => s.userId === u.id && s.isActive).length;
        const totalSpent = db.expenses.filter(e => e.userId === u.id).reduce((sum, e) => sum + e.amount, 0);

        return {
          id: u.id,
          email: u.email,
          verified: u.verified,
          fullName: prof?.fullName || 'مستخدم جديد',
          phone: prof?.phone || 'غير متوفر',
          country: prof?.country || 'مصر',
          currency: prof?.currency || 'EGP',
          language: prof?.language || 'ar',
          subscription: prof?.subscription || 'Standard',
          profilePicture: prof?.profilePicture || '👨🏻‍💼',
          createdDate: prof?.createdDate || new Date().toISOString(),
          lastLogin: prof?.lastLogin || new Date().toISOString(),
          onboardingCompleted: ob?.onboardingCompleted || false,
          activeSessionsCount: sessCount,
          totalExpensesSpent: totalSpent
        };
      });

      // System Activity Audit Logs
      const auditLogs = db.loginHistory.slice(-25).map(h => {
        const u = db.users.find(usr => usr.id === h.userId);
        const prof = db.profiles.find(p => p.userId === h.userId);
        return {
          id: h.id,
          email: u?.email || 'مجهول',
          fullName: prof?.fullName || 'مستخدم',
          role: u?.role || 'USER',
          loginDate: h.loginDate,
          ip: h.ip,
          country: h.country,
          browser: h.browser,
          device: h.device,
          platform: h.platform
        };
      }).reverse();

      res.json({
        success: true,
        stats: {
          totalUsers: totalUsersCount,
          totalSubscribed: totalSubscribedUsersCount,
          revenue: totalRevenue,
          expensesCount: totalExpensesRecorded,
          totalSpent: totalSpentAllUsers
        },
        users: usersList,
        logs: auditLogs,
        systemConfig: db.systemConfig,
        subscriptionRequests: db.subscriptionRequests || []
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب إحصائيات الإدارة.' });
    }
  });

  // Admin Change User Role / Subscription
  app.post('/api/admin/users/update', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const currentUser = db.users.find(u => u.id === session.userId);
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور.' });
      }

      const { targetUserId, role, subscription } = req.body;
      const targetUser = db.users.find(u => u.id === targetUserId);
      const targetProfile = db.profiles.find(p => p.userId === targetUserId);

      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على المستخدم المطلوب.' });
      }

      if (role) {
        targetUser.role = role;
      }
      if (subscription && targetProfile) {
        targetProfile.subscription = subscription;
      }

      writeDb(db);

      res.json({ success: true, message: 'تم تحديث صلاحيات واشتراك المستخدم بنجاح.' });
    } catch (error: any) {
      console.error('Update user from admin error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحديث بيانات المستخدم.' });
    }
  });

  // 17. Get System Price & Vodafone Cash Configurations
  app.get('/api/subscription/config', (req, res) => {
    try {
      const db = readDb();
      const session = getSessionFromRequest(req);
      let userRequests: any[] = [];
      let profile: any = null;
      
      if (session) {
        userRequests = (db.subscriptionRequests || []).filter(r => r.userId === session.userId);
        profile = db.profiles.find(p => p.userId === session.userId) || null;
      }

      res.json({
        success: true,
        monthlyPrice: db.systemConfig?.monthlyPrice || 99,
        yearlyPrice: db.systemConfig?.yearlyPrice || 599,
        vodafoneNumber: db.systemConfig?.vodafoneNumber || '01002345678',
        userRequests,
        profile
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب إعدادات الخادم.' });
    }
  });

  // 18. Submit Vodafone Cash Subscription Request
  app.post('/api/subscription/request', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const { billingCycle, amount, senderNumber, screenshotBase64 } = req.body;
      if (!billingCycle || !amount || !senderNumber || !screenshotBase64) {
        return res.status(400).json({ success: false, error: 'برجاء ملء جميع التفاصيل ورفع لقطة الشاشة لإثبات التحويل.' });
      }

      const db = readDb();
      const profile = db.profiles.find(p => p.userId === session.userId);
      const user = db.users.find(u => u.id === session.userId);

      const requestId = 'sub_req_' + generateToken(8);
      const newRequest = {
        id: requestId,
        userId: session.userId,
        userEmail: user?.email || '',
        fullName: profile?.fullName || 'عضو غير معروف',
        plan: 'Premium' as const,
        billingCycle: billingCycle as 'monthly' | 'yearly',
        amount: Number(amount),
        paymentMethod: 'Vodafone Cash',
        vodafoneNumberUsed: db.systemConfig?.vodafoneNumber || '01002345678',
        senderNumber,
        screenshotBase64,
        status: 'Pending' as const,
        requestDate: new Date().toISOString()
      };

      if (!db.subscriptionRequests) {
        db.subscriptionRequests = [];
      }
      db.subscriptionRequests.push(newRequest);

      // Create notification to confirm request is pending
      db.notifications.push({
        userId: session.userId,
        id: 'not_' + generateToken(8),
        title: 'طلب اشتراك بريميوم قيد المراجعة ⏳',
        message: `تم استلام طلب التحويل بقيمة ${amount} ج.م لترقية حسابك لباقة بريميوم. جاري تدقيق العملية والمراجعة وسيتم الرد خلال ساعات.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        isArchived: false,
        priority: 'medium',
        category: 'System'
      });

      writeDb(db);
      res.json({ success: true, message: 'تم إرسال طلب الاشتراك بنجاح وهو قيد المراجعة الفورية من قبل الإدارة.' });
    } catch (error: any) {
      console.error('Request subscription error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ في السيرفر أثناء معالجة الطلب.' });
    }
  });

  // 19. Cancel Active Premium Subscription
  app.post('/api/subscription/cancel', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const profile = db.profiles.find(p => p.userId === session.userId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود.' });
      }

      profile.subscription = 'Standard';
      profile.subscriptionExpiryDate = undefined;

      db.notifications.push({
        userId: session.userId,
        id: 'not_' + generateToken(8),
        title: 'تم إلغاء الاشتراك بنجاح 🔴',
        message: 'تم إلغاء اشتراك بريميوم الممتاز والعودة للباقة العادية Standard المحدودة المزايا.',
        timestamp: new Date().toISOString(),
        isRead: false,
        isArchived: false,
        priority: 'high',
        category: 'System'
      });

      writeDb(db);
      res.json({ success: true, message: 'تم إلغاء الاشتراك والعودة للباقة المجانية بنجاح.' });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ success: false, error: 'فشل إلغاء الاشتراك في السيرفر.' });
    }
  });

  // 20. Admin Approve/Reject Subscription Request
  app.post('/api/admin/subscription/action', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const currentUser = db.users.find(u => u.id === session.userId);
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور.' });
      }

      const { requestId, action, rejectionReason } = req.body;
      const request = db.subscriptionRequests?.find(r => r.id === requestId);
      if (!request) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على طلب الاشتراك المطلوب.' });
      }

      const targetProfile = db.profiles.find(p => p.userId === request.userId);
      if (!targetProfile) {
        return res.status(404).json({ success: false, error: 'الملف الشخصي لصاحب الطلب غير متوفر.' });
      }

      if (action === 'Approve') {
        request.status = 'Approved';
        request.actionDate = new Date().toISOString();
        targetProfile.subscription = 'Premium';
        
        // Calculate expiry date
        const exp = new Date();
        if (request.billingCycle === 'yearly') {
          exp.setFullYear(exp.getFullYear() + 1);
        } else {
          exp.setMonth(exp.getMonth() + 1);
        }
        targetProfile.subscriptionExpiryDate = exp.toISOString();

        // Create user confirmation notification
        db.notifications.push({
          userId: request.userId,
          id: 'not_' + generateToken(8),
          title: 'تفعيل اشتراك بريميوم بنجاح! 🌟',
          message: `تم التحقق بنجاح من عملية الدفع الخاصة بك وتفعيل باقة العائلة الممتازة بريميوم حتى تاريخ ${exp.toLocaleDateString('ar-EG')}. استمتع بكافة المزايا اللانهائية!`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'high',
          category: 'System'
        });
      } else {
        request.status = 'Rejected';
        request.actionDate = new Date().toISOString();
        request.rejectionReason = rejectionReason || 'صورة التحويل أو البيانات غير مطابقة للمبالغ المستلمة';

        db.notifications.push({
          userId: request.userId,
          id: 'not_' + generateToken(8),
          title: 'رفض طلب اشتراك بريميوم 🔴',
          message: `تم رفض لقطة الشاشة المقدمة. السبب: ${request.rejectionReason}. برجاء التأكد وإرسال الطلب مرة أخرى.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isArchived: false,
          priority: 'high',
          category: 'System'
        });
      }

      writeDb(db);
      res.json({ success: true, message: `تمت عملية ${action === 'Approve' ? 'الموافقة' : 'الرفض'} للطلب بنجاح.` });
    } catch (error: any) {
      console.error('Action on subscription request error:', error);
      res.status(500).json({ success: false, error: 'فشل معالجة الطلب في السيرفر.' });
    }
  });

  // 21. Admin Update Global Configurations
  app.post('/api/admin/config/update', (req, res) => {
    try {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const db = readDb();
      const currentUser = db.users.find(u => u.id === session.userId);
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور.' });
      }

      const { monthlyPrice, yearlyPrice, vodafoneNumber, featureFlags } = req.body;

      db.systemConfig = {
        monthlyPrice: monthlyPrice !== undefined ? Number(monthlyPrice) : (db.systemConfig?.monthlyPrice || 99),
        yearlyPrice: yearlyPrice !== undefined ? Number(yearlyPrice) : (db.systemConfig?.yearlyPrice || 599),
        vodafoneNumber: vodafoneNumber || (db.systemConfig?.vodafoneNumber || '01002345678'),
        featureFlags: featureFlags || (db.systemConfig?.featureFlags || {
          betaFeatures: false,
          maintenanceMode: false,
          forceUpdate: false,
          aiInsightsEngine: true,
          voiceInputPremium: false
        })
      };

      writeDb(db);
      res.json({ success: true, message: 'تم تحديث الإعدادات والأسعار وقنوات تحويل المبالغ بنجاح.' });
    } catch (error: any) {
      console.error('Update system config error:', error);
      res.status(500).json({ success: false, error: 'فشل حفظ الإعدادات في السيرفر.' });
    }
  });
}
