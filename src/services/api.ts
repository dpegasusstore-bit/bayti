/**
 * Bayti AI - Unified Client-side API Service
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('bayti_user_token') || localStorage.getItem('bayti_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- USER AUTHENTICATION & PROFILE ---
  async register(data: any) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data: any) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.token) {
      localStorage.setItem('bayti_user_token', result.token);
    }
    return result;
  },

  async oauthLogin(data: any) {
    const res = await fetch('/api/auth/oauth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.token) {
      localStorage.setItem('bayti_user_token', result.token);
    }
    return result;
  },

  async verifyEmail(token: string) {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return res.json();
  },

  async resendVerification(email: string) {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(data: any) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteAccount() {
    const res = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      localStorage.clear();
    }
    return result;
  },

  async getSessions() {
    const res = await fetch('/api/auth/sessions', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async exportAccount() {
    const res = await fetch('/api/auth/export-account', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error('Logout err:', e);
    }
    localStorage.removeItem('bayti_user_token');
    localStorage.removeItem('bayti_user_session');
  },

  async logoutAllDevices() {
    const res = await fetch('/api/auth/logout-all-devices', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- DATA SYNCHRONIZATION ---
  async syncData(data: {
    expenses?: any[];
    familyMembers?: any[];
    reminders?: any[];
    notifications?: any[];
    onboarding?: any;
  }) {
    const res = await fetch('/api/user/sync-data', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async pullData() {
    const res = await fetch('/api/user/pull-data', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- ADMINISTRATOR OPERATIONS ---
  async adminLogin(data: any) {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async adminVerify2fa(data: any) {
    const res = await fetch('/api/admin/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.token) {
      localStorage.setItem('bayti_admin_token', result.token);
    }
    return result;
  },

  async verifyAdminPasscode(passcode: string) {
    const res = await fetch('/api/admin/auth/verify-passcode', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ passcode })
    });
    const result = await res.json();
    if (result.success) {
      // Set the admin session locally to mirror the verified state
      const session = {
        email: result.user.email,
        loggedInAt: new Date().toISOString(),
        role: result.user.role
      };
      localStorage.setItem('bayti_admin_session', JSON.stringify(session));
      // Also copy the user token to admin token so admin APIs work if needed
      const userToken = localStorage.getItem('bayti_user_token');
      if (userToken) {
        localStorage.setItem('bayti_admin_token', userToken);
      }
    }
    return result;
  },

  async getAdminStats() {
    const res = await fetch('/api/admin/stats', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async adminUpdateUser(data: any) {
    const res = await fetch('/api/admin/users/update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- SUBSCRIPTIONS & CONFIGS ---
  async getSubscriptionConfig() {
    const res = await fetch('/api/subscription/config', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async submitSubscriptionRequest(data: any) {
    const res = await fetch('/api/subscription/request', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async adminActionSubscription(data: any) {
    const res = await fetch('/api/admin/subscription/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async adminUpdateConfig(data: any) {
    const res = await fetch('/api/admin/config/update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
