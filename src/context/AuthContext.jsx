import { createContext, useCallback, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'brandDashboardAuth';
const DEV_OTP_CODE = '123456';

const AuthContext = createContext(null);

const createMockToken = (email) => {
  const payload = {
    email,
    issuedAt: new Date().toISOString(),
  };

  return `mock-brand-token.${btoa(JSON.stringify(payload))}`;
};

const createBrandUser = (email) => ({
  id: email,
  email,
  name: email.split('@')[0] || 'Local Brand',
  role: 'LOCAL_BRAND',
});

const readStoredSession = () => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession);

    if (!session?.token || !session?.user?.email) {
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);
  const [loading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [lastOtp, setLastOtp] = useState(DEV_OTP_CODE);

  const saveSession = useCallback((nextSession) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    localStorage.setItem('token', nextSession.token);
    setSession(nextSession);
  }, []);

  const requestBrandOtp = useCallback(async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    // TODO: replace this block with the real "send OTP to brand email" endpoint.
    setPendingEmail(normalizedEmail);
    setLastOtp(DEV_OTP_CODE);

    return {
      success: true,
      email: normalizedEmail,
      developmentOtp: DEV_OTP_CODE,
    };
  }, []);

  const verifyBrandOtp = useCallback(async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    // TODO: replace this condition with the real "verify OTP" endpoint.
    if (normalizedOtp !== lastOtp && normalizedOtp !== DEV_OTP_CODE) {
      return {
        success: false,
        error: 'Invalid OTP',
      };
    }

    const user = createBrandUser(normalizedEmail);
    const token = createMockToken(normalizedEmail);

    saveSession({
      token,
      user,
      authenticatedAt: new Date().toISOString(),
    });

    setPendingEmail('');

    return {
      success: true,
      token,
      user,
    };
  }, [lastOtp, saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession(null);
    setPendingEmail('');
  }, []);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || '',
    session,
    loading,
    pendingEmail,
    requestBrandOtp,
    verifyBrandOtp,
    logout,
    isAuthenticated: Boolean(session?.token && session?.user),
  }), [loading, logout, pendingEmail, requestBrandOtp, session, verifyBrandOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
