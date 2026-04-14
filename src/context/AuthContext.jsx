import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_UPDATED_EVENT, AUTH_STORAGE_KEY, authAPI } from '../services/endpoints';

const AuthContext = createContext(null);

const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const createBrandUser = (email, tokenPayload = {}) => ({
  id: tokenPayload.sub || tokenPayload.subject || email,
  email,
  name: email.split('@')[0] || 'Local Brand',
  role: tokenPayload.role || 'BRAND_OWNER',
});

const readStoredSession = () => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession);
    const accessToken = session?.accessToken || session?.token;
    const refreshToken = session?.refreshToken || '';
    const tokenPayload = parseJwtPayload(accessToken) || {};
    const email = tokenPayload.email || session?.user?.email;

    if (!accessToken || !email) {
      return null;
    }

    return {
      ...session,
      accessToken,
      refreshToken,
      user: createBrandUser(email, tokenPayload),
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);
  const [loading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    const syncSession = () => {
      setSession(readStoredSession());
    };

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const saveSession = useCallback((nextSession) => {
    const normalizedSession = {
      ...nextSession,
      accessToken: nextSession.accessToken || nextSession.token || '',
      refreshToken: nextSession.refreshToken || '',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession));
    localStorage.setItem('token', normalizedSession.accessToken);
    localStorage.setItem('refreshToken', normalizedSession.refreshToken);
    localStorage.setItem('user', JSON.stringify(normalizedSession.user));
    setSession(normalizedSession);
  }, []);

  const requestBrandOtp = useCallback(async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      await authAPI.generateOtp({
        email: normalizedEmail,
        recipient: normalizedEmail,
        purpose: 'EMAIL',
        channel: 'LOGIN',
      });

      setPendingEmail(normalizedEmail);

      return {
        success: true,
        email: normalizedEmail,
      };
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || 'Failed to send OTP';

      return {
        success: false,
        error: message,
      };
    }
  }, []);

  const verifyBrandOtp = useCallback(async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    try {
      const { data } = await authAPI.verifyOtp({
        recipient: normalizedEmail,
        purpose: 'EMAIL',
        otpCode: normalizedOtp,
      });

      if (!data?.verified) {
        return {
          success: false,
          error: data?.message || 'Invalid OTP',
          remainingAttempts: data?.remainingAttempts,
        };
      }

      const accessToken = data?.accessToken || '';
      const refreshToken = data?.refreshToken || '';
      const tokenPayload = parseJwtPayload(accessToken) || {};
      const user = createBrandUser(tokenPayload.email || normalizedEmail, tokenPayload);

      saveSession({
        accessToken,
        refreshToken,
        user,
        authenticatedAt: new Date().toISOString(),
      });

      setPendingEmail('');

      return {
        success: true,
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      const responseData = error?.response?.data;

      return {
        success: false,
        error: responseData?.message || error?.message || 'Failed to verify OTP',
        remainingAttempts: responseData?.remainingAttempts,
      };
    }
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setSession(null);
    setPendingEmail('');
  }, []);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.accessToken || '',
    accessToken: session?.accessToken || '',
    refreshToken: session?.refreshToken || '',
    session,
    loading,
    pendingEmail,
    requestBrandOtp,
    verifyBrandOtp,
    logout,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
  }), [loading, logout, pendingEmail, requestBrandOtp, session, verifyBrandOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
