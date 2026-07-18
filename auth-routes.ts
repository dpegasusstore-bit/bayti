import express from 'express';
import jwt from 'jsonwebtoken';
import { 
  prisma, 
  hashPassword, 
  verifyPassword,
  generateToken 
} from './db-store.js';
import { uploadFile, deleteFile, replaceFile } from './server/storage-service.js';


const JWT_SECRET = process.env.JWT_SECRET || 'bayti-access-secret-key-2026-secure-default';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bayti-refresh-secret-key-2026-secure-default';

export function generateAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

export const COOKIE_OPTIONS: express.CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

// Helper to extract token from Cookies or Authorization header and verify session
export async function getSessionFromRequest(req: express.Request, res?: express.Response): Promise<any> {
  let accessToken = req.cookies?.access_token;
  
  if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    accessToken = req.headers.authorization.substring(7);
  }
  
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
      if (decoded && decoded.userId) {
        // Find an active session in SessionStore corresponding to this user
        const session = await prisma.sessionStore.findFirst({
          where: { userId: decoded.userId, isActive: true },
          orderBy: { createdAt: 'desc' }
        });
        if (session) {
          return session;
        }
      }
    } catch (err: any) {
      // Access token is expired or invalid. Fallback to refresh token if available in cookies.
    }
  }
  
  // Check for refresh token in cookies
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      if (decodedRefresh && decodedRefresh.userId) {
        // Find active session in database matching the refresh token
        const session = await prisma.sessionStore.findFirst({
          where: { token: refreshToken, userId: decodedRefresh.userId, isActive: true },
        });
        
        if (session && new Date(session.expiresAt) > new Date()) {
          // Refresh token is valid! Generate a brand new access token
          const user = await prisma.user.findUnique({
            where: { id: decodedRefresh.userId }
          });
          
          if (user) {
            const newAccessToken = generateAccessToken({
              id: user.id,
              email: user.email,
              role: user.role
            });
            
            // Set the new access token in cookies
            if (res) {
              res.cookie('access_token', newAccessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000 // 15 minutes
              });
            }
            
            return session;
          }
        }
      }
    } catch (refreshErr) {
      console.error('[Session Error] Refresh token verification failed:', refreshErr);
    }
  }
  
  return null;
}

// Middleware to protect routes that require authentication
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(401).json({ success: false, error: 'غير مصرح. يرجى تسجيل الدخول للوصول إلى هذا الجزء.' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'المستخدم غير موجود.' });
    }

    (req as any).user = user;
    (req as any).session = session;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة المصادقة.' });
  }
}

// Middleware to protect routes that require admin role
export function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ success: false, error: 'غير مسموح. هذه الميزة مخصصة لإدارة النظام فقط.' });
  }
  next();
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

export function extractKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes('/api/storage/file/')) {
    const parts = url.split('/api/storage/file/');
    if (parts[1]) {
      return parts[1].split('?')[0];
    }
  }
  if (url.includes('amazonaws.com') || url.includes('.run.app')) {
    const parts = url.split('/');
    if (parts.length >= 2) {
      const key = parts.slice(-2).join('/');
      return key.split('?')[0];
    }
  }
  return null;
}

export function registerAuthRoutes(app: express.Express) {
  
  // 1. User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, fullName, phone, country, currency, acceptTerms } = req.body;
      
      if (!email || !password || !fullName || !country || !currency) {
        return res.status(400).json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة لتسجيل الحساب.' });
      }

      if (!acceptTerms) {
        return res.status(400).json({ success: false, error: 'يجب الموافقة على الشروط والأحكام و سياسة الخصوصية للمتابعة.' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(400).json({ success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' });
      }

      const userId = 'usr_' + generateToken(12);
      const passwordHash = hashPassword(password);
      const verificationToken = generateToken(16);

      // Create User with relations inside a safe transaction
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: userId,
            email: normalizedEmail,
            role: 'USER', // Always register as USER, never ADMIN
            emailVerified: false,
            passwordHash,
          },
        }),
        prisma.profile.create({
          data: {
            userId,
            fullName,
            phone: phone || '',
            country,
            currency,
            language: 'ar',
            subscription: 'Standard',
            profilePicture: '👨🏻‍💼',
          },
        }),
        prisma.onboarding.create({
          data: {
            userId,
            onboardingCompleted: false,
            salary: 0,
            otherIncome: 0,
            familyMembersCount: 1,
            ownsCar: false,
            paysInstallments: false,
            participatesInGroup: false,
            homeStatus: 'own',
            wantsGoals: true,
          },
        }),
        prisma.settings.create({
          data: {
            userId,
            theme: 'light',
            enableNotifications: true,
            betaFeatures: false,
          },
        }),
        prisma.aIUsage.create({
          data: {
            userId,
            requestsCount: 0,
            tokensCount: 0,
            monthlyLimit: 20,
            limitResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
        }),
      ]);

      // Return token directly for simulation/onboarding ease, saving in postgres session
      await prisma.sessionStore.create({
        data: {
          token: verificationToken,
          userId,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          isActive: true,
        },
      });

      res.status(201).json({ 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتنشيط الحساب.',
        userId,
        verificationToken // return token directly for seamless client activation
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الحساب.' });
    }
  });

  // 2. User Login (Email & Password)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { profile: true, onboarding: true, settings: true },
      });

      let verifiedPass = false;
      if (user) {
        verifiedPass = verifyPassword(password, user.passwordHash || '');
      }

      if (!user || !verifiedPass) {
        return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
      }

      if (!user.emailVerified) {
        return res.status(200).json({
          success: false,
          notVerified: true,
          error: 'يرجى تفعيل حسابك أولاً. تم إرسال كود التفعيل لبريدك الإلكتروني.',
        });
      }

      // Extract device info
      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, platform, device } = parseUserAgent(userAgentStr);
      const ip = req.ip || '127.0.0.1';

      // Create tokens
      const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
      
      const expiresInDays = rememberMe ? 30 : 1;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await prisma.sessionStore.create({
        data: {
          token: refreshToken, // Store the Refresh Token in the database
          userId: user.id,
          expiresAt,
          isActive: true,
          device,
          platform,
          browser,
          ip,
          country: 'Egypt',
        },
      });

      // Update last login in profile
      await prisma.profile.update({
        where: { userId: user.id },
        data: { lastLogin: new Date() },
      });

      // Set cookies with SameSite=None and Secure for iframe safety
      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: expiresInDays * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        token: accessToken, // Return access token to keep full compatibility with localStorage/Bearer header
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.emailVerified,
        },
        profile: user.profile,
        onboarding: user.onboarding || { onboardingCompleted: false },
        settings: user.settings || { theme: 'light', enableNotifications: true },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة تسجيل الدخول.' });
    }
  });

  // 3. Simulated Google / Apple Authentication (OAuth)
  app.post('/api/auth/oauth-login', async (req, res) => {
    try {
      const { email, fullName, provider, profilePicture } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ success: false, error: 'بيانات الاعتماد غير مكتملة.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { profile: true, onboarding: true, settings: true },
      });

      let isFirstTime = false;

      if (!user) {
        isFirstTime = true;
        const userId = 'usr_' + generateToken(12);
        
        await prisma.$transaction([
          prisma.user.create({
            data: {
              id: userId,
              email: normalizedEmail,
              role: 'USER', // Always register as USER, never ADMIN
              emailVerified: true, // OAuth implies verified
            },
          }),
          prisma.profile.create({
            data: {
              userId,
              fullName,
              phone: '',
              country: 'مصر',
              currency: 'EGP',
              language: 'ar',
              subscription: 'Standard',
              profilePicture: profilePicture || '👨🏻‍💼',
            },
          }),
          prisma.onboarding.create({
            data: {
              userId,
              onboardingCompleted: false,
              salary: 0,
              otherIncome: 0,
              familyMembersCount: 1,
              ownsCar: false,
              paysInstallments: false,
              participatesInGroup: false,
              homeStatus: 'own',
              wantsGoals: true,
            },
          }),
          prisma.settings.create({
            data: {
              userId,
              theme: 'light',
              enableNotifications: true,
              betaFeatures: false,
            },
          }),
          prisma.aIUsage.create({
            data: {
              userId,
              requestsCount: 0,
              tokensCount: 0,
              monthlyLimit: 20,
              limitResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            },
          }),
        ]);

        user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true, onboarding: true, settings: true },
        }) as any;
      }

      if (!user) {
        throw new Error('User creation failed');
      }

      // Extract device info
      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, platform, device } = parseUserAgent(userAgentStr);
      const ip = req.ip || '127.0.0.1';

      // Create tokens
      const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Google login defaults to 30 days remember

      await prisma.sessionStore.create({
        data: {
          token: refreshToken, // Store the Refresh Token in the database
          userId: user.id,
          expiresAt,
          isActive: true,
          device,
          platform,
          browser,
          ip,
          country: 'Egypt',
        },
      });

      // Update last login
      await prisma.profile.update({
        where: { userId: user.id },
        data: { lastLogin: new Date() },
      });

      // Set cookies with SameSite=None and Secure for iframe safety
      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        token: accessToken, // Return access token to keep full compatibility with localStorage/Bearer header
        isFirstTime,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: true,
        },
        profile: user.profile,
        onboarding: user.onboarding || { onboardingCompleted: false },
        settings: user.settings || { theme: 'light', enableNotifications: true },
      });
    } catch (error: any) {
      console.error('OAuth Login error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الدخول بحساب Google.' });
    }
  });

  // 4. Email Verification Activation
  app.post('/api/auth/verify-email', async (req, res) => {
    try {
      const { token, userId } = req.body;
      if (!token && !userId) {
        return res.status(400).json({ success: false, error: 'كود التفعيل غير صالح.' });
      }

      // Check session or direct token matching
      const session = await prisma.sessionStore.findFirst({
        where: { token, isActive: true },
      });

      const actualUserId = userId || session?.userId;
      if (!actualUserId) {
        return res.status(400).json({ success: false, error: 'كود التفعيل منتهي أو غير صحيح.' });
      }

      await prisma.user.update({
        where: { id: actualUserId },
        data: { emailVerified: true },
      });

      res.json({
        success: true,
        message: 'تم تفعيل وتنشيط حسابك بنجاح! يمكنك الآن الاستمتاع بجميع ميزات "بيت AI".',
      });
    } catch (error: any) {
      console.error('Verify email error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تفعيل الحساب.' });
    }
  });

  // 5. Resend Email Verification Token
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني.' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'البريد الإلكتروني المدخل غير مسجل لدينا.' });
      }

      const verificationToken = generateToken(16);
      await prisma.sessionStore.create({
        data: {
          token: verificationToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          isActive: true,
        },
      });

      res.json({
        success: true,
        message: 'تم إعادة إرسال كود التفعيل بنجاح للبريد الإلكتروني المرفق.',
        verificationToken, // return for easy simulation
        token: verificationToken, // compatibility fallback for frontend
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة إرسال كود التفعيل.' });
    }
  });

  // 6. Forgot Password (Request link)
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني.' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'البريد الإلكتروني المدخل غير مسجل في النظام.' });
      }

      const resetToken = generateToken(32);
      await prisma.sessionStore.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
          isActive: true,
        },
      });

      res.json({
        success: true,
        message: 'تم إرسال تعليمات استعادة كلمة المرور لبريدك الإلكتروني بنجاح.',
        resetToken, // output for simulation
        token: resetToken, // compatibility fallback for frontend
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة طلب استعادة كلمة المرور.' });
    }
  });

  // 7. Reset Password (Apply change)
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'البيانات المرسلة غير صالحة.' });
      }

      const session = await prisma.sessionStore.findFirst({
        where: { token, isActive: true },
      });

      if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(400).json({ success: false, error: 'رابط استعادة كلمة المرور منتهي الصلاحية أو غير صالح.' });
      }

      // Update the user password securely
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash: hashPassword(newPassword) },
      });

      // Mark token session as inactive
      await prisma.sessionStore.update({
        where: { id: session.id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور لحسابك بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعيين كلمة المرور الجديدة.' });
    }
  });

  // 7.1 Logout (Current Device)
  app.post('/api/auth/logout', async (req, res) => {
    try {
      // Clear cookies
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        await prisma.sessionStore.updateMany({
          where: { token: refreshToken },
          data: { isActive: false },
        });
      }
      
      res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج.' });
    }
  });

  // 7.2 Logout All (All Devices)
  app.post('/api/auth/logout-all', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Deactivate all active sessions for this user in database
      await prisma.sessionStore.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
      
      // Clear cookies
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      
      res.json({ success: true, message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح.' });
    } catch (error: any) {
      console.error('Logout all error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج من جميع الأجهزة.' });
    }
  });

  // 8. Fetch My Information (Auto Login Session Check)
  app.get('/api/auth/me', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { profile: true, onboarding: true, settings: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.emailVerified,
        },
        profile: user.profile,
        onboarding: user.onboarding || { onboardingCompleted: false },
        settings: user.settings || { theme: 'light', enableNotifications: true },
      });
    } catch (error: any) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب بيانات الجلسة.' });
    }
  });

  // 9. Update User Profile Info
  app.post('/api/auth/update-profile', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const { 
        fullName, 
        phone, 
        country, 
        currency, 
        language, 
        profilePicture, 
        password,
        theme, 
        enableNotifications,
        isPasscodeEnabled,
        isFaceIdEnabled,
        hideFinancialValues,
        hideNotificationsContent
      } = req.body;
      const userId = session.userId;

      // Update Profile
      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          fullName: fullName !== undefined ? fullName : undefined,
          phone: phone !== undefined ? phone : undefined,
          country: country !== undefined ? country : undefined,
          currency: currency !== undefined ? currency : undefined,
          language: language !== undefined ? language : undefined,
          profilePicture: profilePicture !== undefined ? profilePicture : undefined,
        },
      });

      // If password is changed, hash and update it
      if (password) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash: hashPassword(password),
          },
        });
      }

      // Update Settings
      await prisma.settings.upsert({
        where: { userId },
        create: {
          userId,
          theme: theme || 'light',
          enableNotifications: enableNotifications !== false,
          isPasscodeEnabled: !!isPasscodeEnabled,
          isFaceIdEnabled: !!isFaceIdEnabled,
          hideFinancialValues: !!hideFinancialValues,
          hideNotificationsContent: !!hideNotificationsContent,
        },
        update: {
          theme: theme !== undefined ? theme : undefined,
          enableNotifications: enableNotifications !== undefined ? enableNotifications : undefined,
          isPasscodeEnabled: isPasscodeEnabled !== undefined ? !!isPasscodeEnabled : undefined,
          isFaceIdEnabled: isFaceIdEnabled !== undefined ? !!isFaceIdEnabled : undefined,
          hideFinancialValues: hideFinancialValues !== undefined ? !!hideFinancialValues : undefined,
          hideNotificationsContent: hideNotificationsContent !== undefined ? !!hideNotificationsContent : undefined,
        },
      });

      // Fetch the updated settings to return
      const settings = await prisma.settings.findUnique({
        where: { userId }
      });

      res.json({
        success: true,
        message: 'تم تحديث البيانات الشخصية لحسابك المالي بنجاح.',
        profile,
        settings,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعديل الملف الشخصي.' });
    }
  });

  // 9b. Upload Custom Profile Picture to Cloud Storage with Compression & Replacing
  app.post('/api/auth/upload-profile-picture', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: 'لم يتم إرسال الصورة.' });
      }

      // Check current profile picture to delete/replace the old file
      const profile = await prisma.profile.findUnique({
        where: { userId: session.userId },
      });

      const oldKey = extractKeyFromUrl(profile?.profilePicture);

      // Decode base64
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      console.log(`[Profile Pic] Optimizing and uploading profile picture for user: ${session.userId}`);
      
      // Upload, optimize/compress, and replace the old file
      const uploadRes = await replaceFile(
        oldKey,
        buffer,
        'profile_pic.jpg',
        'image/jpeg',
        session.userId
      );

      // Update user's profile with the new secure cloud URL
      const updatedProfile = await prisma.profile.update({
        where: { userId: session.userId },
        data: { profilePicture: uploadRes.url },
      });

      // Also update the core User image field
      await prisma.user.update({
        where: { id: session.userId },
        data: { image: uploadRes.url },
      });

      res.json({
        success: true,
        profilePicture: uploadRes.url,
        profile: updatedProfile,
        message: 'تم تحديث صورتك الشخصية بنجاح!',
      });
    } catch (error: any) {
      console.error('[Upload Profile Picture Error]:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء رفع صورتك الشخصية.' });
    }
  });

  // 9c. Delete Custom Profile Picture from Cloud Storage & Reset to Emoji
  app.post('/api/auth/delete-profile-picture', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const profile = await prisma.profile.findUnique({
        where: { userId: session.userId },
      });

      const oldKey = extractKeyFromUrl(profile?.profilePicture);
      if (oldKey) {
        console.log(`[Profile Pic] Deleting custom profile picture key: ${oldKey}`);
        await deleteFile(oldKey);
      }

      // Reset to default emoji
      const updatedProfile = await prisma.profile.update({
        where: { userId: session.userId },
        data: { profilePicture: '👨🏻‍💼' },
      });

      await prisma.user.update({
        where: { id: session.userId },
        data: { image: null },
      });

      res.json({
        success: true,
        profilePicture: '👨🏻‍💼',
        profile: updatedProfile,
        message: 'تم إزالة الصورة الشخصية والعودة للافتراضية بنجاح!',
      });
    } catch (error: any) {
      console.error('[Delete Profile Picture Error]:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء حذف الصورة الشخصية.' });
    }
  });

  // 10. Sync User Expenses / Family Members / Reminders / Notifications
  app.post('/api/user/sync-data', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح بمزامنة البيانات.' });
      }

      const { expenses, familyMembers, reminders, notifications, onboarding } = req.body;
      const userId = session.userId;

      // Update onboarding data if passed
      if (onboarding) {
        await prisma.onboarding.upsert({
          where: { userId },
          create: {
            userId,
            onboardingCompleted: onboarding.onboardingCompleted || false,
            salary: Number(onboarding.monthlySalary ?? onboarding.salary) || 0,
            otherIncome: Number(onboarding.otherIncome) || 0,
            familyMembersCount: Number(onboarding.familyMembersCount) || 1,
            ownsCar: !!onboarding.ownsCar,
            paysInstallments: !!onboarding.paysInstallments,
            participatesInGroup: !!onboarding.participatesInGroup,
            homeStatus: onboarding.homeStatus || 'own',
            wantsGoals: onboarding.wantsGoals !== false,
          },
          update: {
            onboardingCompleted: onboarding.onboardingCompleted ?? undefined,
            salary: onboarding.monthlySalary !== undefined ? Number(onboarding.monthlySalary) : (onboarding.salary !== undefined ? Number(onboarding.salary) : undefined),
            otherIncome: onboarding.otherIncome !== undefined ? Number(onboarding.otherIncome) : undefined,
            familyMembersCount: onboarding.familyMembersCount !== undefined ? Number(onboarding.familyMembersCount) : undefined,
            ownsCar: onboarding.ownsCar ?? undefined,
            paysInstallments: onboarding.paysInstallments ?? undefined,
            participatesInGroup: onboarding.participatesInGroup ?? undefined,
            homeStatus: onboarding.homeStatus ?? undefined,
            wantsGoals: onboarding.wantsGoals ?? undefined,
          },
        });
      }

      // Sync Expenses (Safe drop-and-replace for the specific authenticated user)
      if (expenses && Array.isArray(expenses)) {
        await prisma.expense.deleteMany({ where: { userId } });
        
        if (expenses.length > 0) {
          // Prepare create records
          const dataToInsert = expenses.map((exp: any) => {
            let notesVal = exp.notes || '';
            if (exp.items && Array.isArray(exp.items) && exp.items.length > 0) {
              notesVal += `\n__items_json__:${JSON.stringify(exp.items)}`;
            }
            return {
              id: exp.id || 'exp_' + generateToken(8),
              userId,
              title: exp.title || 'مصروف',
              amount: Number(exp.amount) || 0,
              date: exp.date || new Date().toISOString().split('T')[0],
              time: exp.time || '12:00 م',
              category: exp.category || 'Home',
              merchant: exp.merchant || 'غير محدد',
              paymentMethod: exp.paymentMethod || 'Cash',
              vat: Number(exp.vat) || 0,
              recordedBy: exp.recordedBy || 'أحمد',
              notes: notesVal,
              tags: exp.tags || [],
            };
          });

          // Process batch create safely
          for (const item of dataToInsert) {
            await prisma.expense.create({ data: item });
          }
        }
      }

      // Sync Family Members (Safe drop-and-replace for the specific authenticated user)
      if (familyMembers && Array.isArray(familyMembers)) {
        await prisma.familyMember.deleteMany({ where: { userId } });

        if (familyMembers.length > 0) {
          const membersToInsert = familyMembers.map((mem: any) => ({
            id: mem.id || 'mem_' + generateToken(8),
            userId,
            name: mem.name || 'عضو العائلة',
            avatar: mem.avatar || '👨🏻‍💼',
            monthlyBudget: Number(mem.monthlyBudget) || 0,
            spentThisMonth: Number(mem.spentThisMonth) || 0,
            role: mem.role || 'Member',
          }));

          for (const item of membersToInsert) {
            await prisma.familyMember.create({ data: item });
          }
        }
      }

      // Sync Reminders (Safe drop-and-replace for the specific authenticated user)
      if (reminders && Array.isArray(reminders)) {
        await prisma.reminderEvent.deleteMany({ where: { userId } });

        if (reminders.length > 0) {
          const remindersToInsert = reminders.map((rem: any) => ({
            id: rem.id || 'rem_' + generateToken(8),
            userId,
            title: rem.title || 'تنبيه جديد',
            amount: Number(rem.amount) || 0,
            dueDate: rem.dueDate || new Date().toISOString().split('T')[0],
            category: rem.category || 'Bills',
            priority: rem.priority || 'medium',
            status: rem.status || 'upcoming',
          }));

          for (const item of remindersToInsert) {
            await prisma.reminderEvent.create({ data: item });
          }
        }
      }

      // Sync Notifications (Safe drop-and-replace for the specific authenticated user)
      if (notifications && Array.isArray(notifications)) {
        await prisma.notification.deleteMany({ where: { userId } });

        if (notifications.length > 0) {
          const notificationsToInsert = notifications.map((notif: any) => ({
            id: notif.id || 'notif_' + generateToken(8),
            userId,
            title: notif.title || 'إشعار مالي',
            message: notif.message || '',
            timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
            isRead: !!notif.isRead,
            isArchived: !!notif.isArchived,
            priority: notif.priority || 'medium',
            category: notif.category || 'System',
          }));

          for (const item of notificationsToInsert) {
            await prisma.notification.create({ data: item });
          }
        }
      }

      res.json({ success: true, message: 'تم حفظ ومزامنة بياناتك المالية السحابية بنجاح بنظام PostgreSQL السحابي.' });
    } catch (error: any) {
      console.error('Sync data error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء حفظ ومزامنة البيانات.' });
    }
  });

  // Pull Cloud Data for login sync
  app.get('/api/user/pull-data', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const userId = session.userId;

      const [expenses, familyMembers, reminders, notifications, onboarding] = await prisma.$transaction([
        prisma.expense.findMany({ where: { userId } }),
        prisma.familyMember.findMany({ where: { userId } }),
        prisma.reminderEvent.findMany({ where: { userId } }),
        prisma.notification.findMany({ where: { userId } }),
        prisma.onboarding.findUnique({ where: { userId } }),
      ]);

      const processedExpenses = expenses.map((exp: any) => {
        let notes = exp.notes || '';
        let items = [];
        if (notes.includes('\n__items_json__:\n') || notes.includes('\n__items_json__:')) {
          const delimiter = notes.includes('\n__items_json__:\n') ? '\n__items_json__:\n' : '\n__items_json__:';
          const parts = notes.split(delimiter);
          notes = parts[0];
          try {
            items = JSON.parse(parts[1]);
          } catch (e) {
            console.error('Failed to parse items from notes:', e);
          }
        }
        return {
          ...exp,
          notes,
          items,
        };
      });

      res.json({
        success: true,
        expenses: processedExpenses,
        familyMembers,
        reminders,
        notifications,
        onboarding: onboarding || { onboardingCompleted: false },
      });
    } catch (error: any) {
      console.error('Pull data error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء استيراد البيانات المالية.' });
    }
  });

  // 11. Delete Account
  app.post('/api/auth/delete-account', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const userId = session.userId;

      // Prevent admin deletion via client
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role === 'ADMIN') {
        return res.status(403).json({ success: false, error: 'غير مسموح بحذف حساب مسؤول الإدارة الرئيسي.' });
      }

      // Drop user from PostgreSQL (onDelete Cascade handles Profile, Onboarding, sessions, expenses, familyMembers, reminders etc.)
      await prisma.user.delete({ where: { id: userId } });

      res.json({ success: true, message: 'تم مسح وحذف حسابك المالي وكافة بياناتك السحابية نهائياً بنجاح.' });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء حذف الحساب.' });
    }
  });

  // 12. Retrieve Active Sessions
  app.get('/api/auth/sessions', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const activeSessions = await prisma.sessionStore.findMany({
        where: { userId: session.userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      const allSessions = await prisma.sessionStore.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const formatSession = (s: any) => ({
        id: s.id,
        token: s.token === session.token ? 'current' : 'hidden', // don't expose other plain tokens
        device: s.device || 'متصفح',
        platform: s.platform || 'غير معروف',
        browser: s.browser || 'غير معروف',
        ip: s.ip || '127.0.0.1',
        country: s.country || 'مصر',
        createdAt: s.createdAt.toISOString(),
        isActive: s.isActive && new Date(s.expiresAt) > new Date(),
      });

      res.json({
        success: true,
        sessions: activeSessions.map(formatSession), // compatibility
        activeSessions: activeSessions.map(formatSession),
        loginHistory: allSessions.map(formatSession),
      });
    } catch (error: any) {
      console.error('Get sessions error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب الجلسات النشطة.' });
    }
  });

  // 12.1 Export Account Data
  app.get('/api/auth/export-account', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      const userId = session.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          settings: true,
          onboarding: true,
          expenses: { where: { isDeleted: false } },
          familyMembers: true,
          reminderEvents: true,
          notifications: true,
          sessions: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        profile: user.profile,
        settings: user.settings,
        onboarding: user.onboarding,
        expenses: user.expenses,
        familyMembers: user.familyMembers,
        reminders: user.reminderEvents,
        notifications: user.notifications,
        sessionsCount: user.sessions.length,
      };

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error: any) {
      console.error('Export account error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تصدير البيانات.' });
    }
  });

  // 13. Logout Session
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (session) {
        await prisma.sessionStore.update({
          where: { id: session.id },
          data: { isActive: false },
        });
      }
      res.json({ success: true, message: 'تم تسجيل الخروج وإلغاء تنشيط الجلسة بنجاح.' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج.' });
    }
  });

  // 14. Logout from all devices
  app.post('/api/auth/logout-all-devices', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'غير مصرح.' });
      }

      await prisma.sessionStore.updateMany({
        where: { userId: session.userId },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'تم تسجيل الخروج من جميع الأجهزة والمتصفحات النشطة بنجاح.' });
    } catch (error: any) {
      console.error('Logout all devices error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج الكلي.' });
    }
  });

  // 15. Admin Login Entry Point
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني الإداري ورمز المرور.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        }
      });

      if (!user) {
        return res.status(401).json({ success: false, error: 'صلاحيات الإدارة غير صحيحة أو الحساب غير معتمد.' });
      }

      let isPasswordCorrect = false;
      if (user.passwordHash) {
        isPasswordCorrect = verifyPassword(password, user.passwordHash);
      } else {
        // Fallback for default seed admin if they have no passwordHash stored in DB
        const fallbackAdminEmail = process.env.ADMIN_EMAIL || 'admin@bayti-ai.com';
        const fallbackAdminPassword = process.env.ADMIN_PASSWORD || 'Admin@Bayti2026';
        if (normalizedEmail === fallbackAdminEmail.toLowerCase().trim() && password === fallbackAdminPassword) {
          isPasswordCorrect = true;
        }
      }

      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, error: 'صلاحيات الإدارة غير صحيحة أو رمز المرور خاطئ.' });
      }

      // Simple simulated 2FA code
      const code2fa = '123456';
      res.json({
        success: true,
        require2FA: true,
        message: 'تم التحقق من الحساب الإداري بنجاح. يرجى إدخال رمز التحقق الثنائي (2FA) المكون من 6 أرقام المرسل لهاتفك الموثق.',
        simulatedCode: code2fa, // for simple simulation ease
      });
    } catch (error: any) {
      console.error('Admin auth login error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء المصادقة الإدارية.' });
    }
  });

  // Admin 2FA Code Verification
  app.post('/api/admin/auth/verify-2fa', async (req, res) => {
    try {
      const { email, code } = req.body;
      if (code !== '123456') {
        return res.status(400).json({ success: false, error: 'رمز التحقق الثنائي (2FA) غير صحيح، يرجى المحاولة مجدداً.' });
      }

      const adminEmail = email || process.env.ADMIN_EMAIL || 'admin@bayti-ai.com';
      
      let user = await prisma.user.findFirst({
        where: { 
          email: { equals: adminEmail, mode: 'insensitive' }, 
          role: { in: ['ADMIN', 'SUPER_ADMIN'] } 
        },
        include: { profile: true },
      });

      if (!user) {
        // Fallback seed admin
        const adminId = 'usr_admin_default';
        await prisma.$transaction([
          prisma.user.upsert({
            where: { email: adminEmail.toLowerCase().trim() },
            create: { id: adminId, email: adminEmail.toLowerCase().trim(), role: 'ADMIN', emailVerified: true },
            update: { role: 'ADMIN' },
          }),
          prisma.profile.upsert({
            where: { userId: adminId },
            create: { userId: adminId, fullName: 'مدير النظام (Admin)', phone: '+201000000000', subscription: 'Premium' },
            update: { subscription: 'Premium' },
          }),
        ]);

        user = await prisma.user.findFirst({
          where: { 
            email: { equals: adminEmail, mode: 'insensitive' }, 
            role: { in: ['ADMIN', 'SUPER_ADMIN'] } 
          },
          include: { profile: true },
        });
      }

      const sessionToken = 'sess_admin_' + generateToken(24);
      await prisma.sessionStore.create({
        data: {
          token: sessionToken,
          userId: user!.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isActive: true,
          device: 'PC Admin Portal',
          platform: 'Linux Server',
        },
      });

      res.json({
        success: true,
        token: sessionToken,
        user: {
          id: user!.id,
          email: user!.email,
          role: user!.role,
        },
        profile: user!.profile,
      });
    } catch (error: any) {
      console.error('Verify 2fa error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة رمز الدخول الثنائي.' });
    }
  });

  // 16. Admin Stats Dashboard API (Requires Admin Role Checking)
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور! ليس لديك صلاحيات إدارية (403 Forbidden).' });
      }

      // Generate analytics from tables in PostgreSQL
      const totalUsersCount = await prisma.user.count({ where: { role: 'USER' } });
      const totalSubscribedUsersCount = await prisma.profile.count({ where: { subscription: 'Premium' } });
      const totalRevenue = totalSubscribedUsersCount * 249; // standard EGP price conversion for statistics
      
      const totalExpensesRecorded = await prisma.expense.count();
      const expensesSum = await prisma.expense.aggregate({
        _sum: { amount: true },
      });
      const totalSpentAllUsers = expensesSum._sum.amount || 0;

      // List of users with profiles
      const dbUsers = await prisma.user.findMany({
        where: { role: 'USER' },
        include: { profile: true, onboarding: true },
      });

      const usersList = [];
      for (const u of dbUsers) {
        const sessCount = await prisma.sessionStore.count({ where: { userId: u.id, isActive: true } });
        const userExpensesSum = await prisma.expense.aggregate({
          where: { userId: u.id },
          _sum: { amount: true },
        });

        usersList.push({
          id: u.id,
          email: u.email,
          verified: u.emailVerified,
          fullName: u.profile?.fullName || 'مستخدم جديد',
          phone: u.profile?.phone || 'غير متوفر',
          country: u.profile?.country || 'مصر',
          currency: u.profile?.currency || 'EGP',
          language: u.profile?.language || 'ar',
          subscription: u.profile?.subscription || 'Standard',
          profilePicture: u.profile?.profilePicture || '👨🏻‍💼',
          createdDate: u.profile?.createdDate.toISOString() || new Date().toISOString(),
          lastLogin: u.profile?.lastLogin?.toISOString() || new Date().toISOString(),
          onboardingCompleted: u.onboarding?.onboardingCompleted || false,
          activeSessionsCount: sessCount,
          totalExpensesSpent: userExpensesSum._sum.amount || 0,
        });
      }

      // System Activity Audit Logs (using sessionStore records as login history audit)
      const sessionsLogs = await prisma.sessionStore.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
      });

      const auditLogs = [];
      for (const h of sessionsLogs) {
        const u = await prisma.user.findUnique({ where: { id: h.userId }, include: { profile: true } });
        auditLogs.push({
          id: h.id,
          email: u?.email || 'مجهول',
          fullName: u?.profile?.fullName || 'مستخدم',
          role: u?.role || 'USER',
          loginDate: h.createdAt.toISOString(),
          ip: h.ip || '127.0.0.1',
          country: h.country || 'مصر',
          browser: h.browser || 'غير معروف',
          device: h.device || 'متصفح',
          platform: h.platform || 'غير معروف',
        });
      }

      // Fetch system configuration
      let systemConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } });
      if (!systemConfig) {
        systemConfig = await prisma.systemConfig.create({
          data: {
            id: 1,
            monthlyPrice: 99,
            yearlyPrice: 599,
            vodafoneNumber: '01002345678',
            betaFeatures: false,
            maintenanceMode: false,
            forceUpdate: false,
            aiInsightsEngine: true,
            voiceInputPremium: false,
          },
        });
      }

      // Fetch billing/upgrade payment proofs requests
      const subscriptionRequests = await prisma.paymentProof.findMany({
        orderBy: { requestDate: 'desc' },
      });

      res.json({
        success: true,
        stats: {
          totalUsers: totalUsersCount,
          totalSubscribed: totalSubscribedUsersCount,
          revenue: totalRevenue,
          expensesCount: totalExpensesRecorded,
          totalSpent: totalSpentAllUsers,
        },
        users: usersList,
        logs: auditLogs,
        systemConfig,
        subscriptionRequests: subscriptionRequests.map(r => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          fullName: r.fullName,
          plan: r.plan,
          billingCycle: r.billingCycle,
          amount: r.amount,
          paymentMethod: r.paymentMethod,
          vodafoneNumberUsed: r.vodafoneNumberUsed,
          senderNumber: r.senderNumber,
          screenshotBase64: r.screenshotBase64,
          status: r.status,
          requestDate: r.requestDate.toISOString(),
          actionDate: r.actionDate?.toISOString() || null,
          rejectionReason: r.rejectionReason,
        })),
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب إحصائيات الإدارة.' });
    }
  });

  // Admin Change User Role / Subscription
  app.post('/api/admin/users/update', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'الدخول محظور! ليس لديك صلاحيات إدارية.' });
      }

      const { userId, role, subscription } = req.body;

      if (role) {
        await prisma.user.update({
          where: { id: userId },
          data: { role },
        });
      }

      if (subscription) {
        await prisma.profile.update({
          where: { userId },
          data: { subscription },
        });
      }

      res.json({ success: true, message: 'تم تحديث صلاحيات واشتراك المستخدم بنجاح.' });
    } catch (error: any) {
      console.error('Admin update user error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحديث بيانات العضو.' });
    }
  });

  // 17. Subscription configurations (Prices / Vodafone wallet numbers)
  app.get('/api/subscription/config', async (req, res) => {
    try {
      let systemConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } });
      if (!systemConfig) {
        systemConfig = await prisma.systemConfig.create({
          data: {
            id: 1,
            monthlyPrice: 99,
            yearlyPrice: 599,
            vodafoneNumber: '01002345678',
            betaFeatures: false,
            maintenanceMode: false,
            forceUpdate: false,
            aiInsightsEngine: true,
            voiceInputPremium: false,
          },
        });
      }

      res.json({
        success: true,
        monthlyPrice: systemConfig.monthlyPrice,
        yearlyPrice: systemConfig.yearlyPrice,
        vodafoneNumber: systemConfig.vodafoneNumber,
        featureFlags: {
          betaFeatures: systemConfig.betaFeatures,
          maintenanceMode: systemConfig.maintenanceMode,
          forceUpdate: systemConfig.forceUpdate,
          aiInsightsEngine: systemConfig.aiInsightsEngine,
          voiceInputPremium: systemConfig.voiceInputPremium,
        },
      });
    } catch (error: any) {
      console.error('Get subscription config error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب إعدادات الدفع.' });
    }
  });

  // 18. User Submits Premium Payment Upgrade Request (Receipt Photo Upload)
  app.post('/api/subscription/request', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const { plan, billingCycle, amount, paymentMethod, vodafoneNumberUsed, senderNumber, screenshotBase64 } = req.body;
      if (!screenshotBase64) {
        return res.status(400).json({ success: false, error: 'يجب إرفاق صورة لرسالة تحويل الدفع أو إيصال السداد لتأكيد طلب الترقية.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { profile: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير مسجل.' });
      }

      // Optimize, compress and upload the payment screenshot to object storage
      console.log(`[Payment Proof] Uploading and compressing payment proof screenshot for user: ${user.id}`);
      let secureUrl = '';
      try {
        const cleanBase64 = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const uploadRes = await uploadFile(
          buffer,
          `payment_proof_${Date.now()}.jpg`,
          'image/jpeg',
          user.id
        );
        secureUrl = uploadRes.url;
      } catch (err: any) {
        console.error('[Payment Proof] Failed to upload screenshot to cloud, using original base64 as fallback:', err);
        secureUrl = screenshotBase64;
      }

      await prisma.paymentProof.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          fullName: user.profile?.fullName || 'عضو غير مسمى',
          plan: plan || 'Premium',
          billingCycle: billingCycle || 'monthly',
          amount: Number(amount) || 99,
          paymentMethod: paymentMethod || 'Vodafone Cash',
          vodafoneNumberUsed: vodafoneNumberUsed || '',
          senderNumber: senderNumber || '',
          screenshotBase64: secureUrl,
          status: 'Pending',
          requestDate: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'تم إرسال طلب الترقية وإثبات السداد بنجاح! سيقوم فريق الإدارة بمراجعة طلبك وتنشيط حسابك خلال دقائق معدودة.',
      });
    } catch (error: any) {
      console.error('Subscription request error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إرسال طلب تأكيد الدفع.' });
    }
  });

  // 19. Cancel Subscription (Downgrade to Free tier)
  app.post('/api/subscription/cancel', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      // Demote subscription status inside Profile
      await prisma.profile.update({
        where: { userId: session.userId },
        data: { subscription: 'Standard' },
      });

      res.json({
        success: true,
        message: 'تم إلغاء ميزات الترقية بنجاح وتم تحويل ميزات حسابك المالي للباقة العادية (Standard) فوراً.',
      });
    } catch (error: any) {
      console.error('Subscription cancel error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء إلغاء الاشتراك.' });
    }
  });

  // 20. Admin Action on Upgrade Requests (Approve or Reject Payment Proofs)
  app.post('/api/admin/subscription/action', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'غير مسموح لك بإجراء تعديلات إدارية.' });
      }

      const { requestId, action, rejectionReason } = req.body;
      
      const proof = await prisma.paymentProof.findUnique({ where: { id: requestId } });
      if (!proof) {
        return res.status(404).json({ success: false, error: 'طلب إثبات السداد غير موجود.' });
      }

      if (action === 'Approve') {
        // Update request proof status
        await prisma.paymentProof.update({
          where: { id: requestId },
          data: { status: 'Approved', actionDate: new Date() },
        });

        // Demote previous subscriptions if any and create new active Subscription record
        await prisma.subscription.create({
          data: {
            userId: proof.userId,
            plan: proof.plan,
            status: 'Active',
            paymentMethod: proof.paymentMethod,
            startDate: new Date(),
            endDate: new Date(Date.now() + (proof.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
          },
        });

        // Upgrade User's Profile
        await prisma.profile.update({
          where: { userId: proof.userId },
          data: { subscription: 'Premium' },
        });
      } else {
        // Rejection
        await prisma.paymentProof.update({
          where: { id: requestId },
          data: { status: 'Rejected', actionDate: new Date(), rejectionReason: rejectionReason || 'الإيصال المرفق غير واضح أو البيانات خاطئة' },
        });
      }

      res.json({
        success: true,
        message: action === 'Approve' ? 'تم الموافقة على الدفع وتفعيل الميزات الممتازة للمستخدم.' : 'تم رفض السداد بنجاح وإرسال تعليل الرفض للمستخدم.',
      });
    } catch (error: any) {
      console.error('Subscription action error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحديث حالة الطلب.' });
    }
  });

  // 21. Admin Update Global Configurations
  app.post('/api/admin/config/update', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(419).json({ success: false, error: 'انتهت صلاحية الجلسة.' });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ success: false, error: 'غير مسموح لك بإجراء تعديلات إدارية.' });
      }

      const { monthlyPrice, yearlyPrice, vodafoneNumber, featureFlags } = req.body;

      await prisma.systemConfig.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          monthlyPrice: Number(monthlyPrice) || 99,
          yearlyPrice: Number(yearlyPrice) || 599,
          vodafoneNumber: vodafoneNumber || '01002345678',
          betaFeatures: !!featureFlags?.betaFeatures,
          maintenanceMode: !!featureFlags?.maintenanceMode,
          forceUpdate: !!featureFlags?.forceUpdate,
          aiInsightsEngine: !!featureFlags?.aiInsightsEngine,
          voiceInputPremium: !!featureFlags?.voiceInputPremium,
        },
        update: {
          monthlyPrice: monthlyPrice !== undefined ? Number(monthlyPrice) : undefined,
          yearlyPrice: yearlyPrice !== undefined ? Number(yearlyPrice) : undefined,
          vodafoneNumber: vodafoneNumber ?? undefined,
          betaFeatures: featureFlags?.betaFeatures ?? undefined,
          maintenanceMode: featureFlags?.maintenanceMode ?? undefined,
          forceUpdate: featureFlags?.forceUpdate ?? undefined,
          aiInsightsEngine: featureFlags?.aiInsightsEngine ?? undefined,
          voiceInputPremium: featureFlags?.voiceInputPremium ?? undefined,
        },
      });

      res.json({ success: true, message: 'تم تحديث الإعدادات الإدارية العامة للنظام بنجاح.' });
    } catch (error: any) {
      console.error('Update config error:', error);
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعديل الإعدادات العامة للنظام.' });
    }
  });
}
