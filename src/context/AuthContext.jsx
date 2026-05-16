import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AUTH_SESSION_UPDATED_EVENT,
  AUTH_STORAGE_KEY,
  BRAND_OWNER_ROLE,
  authAPI,
  clearStoredSession,
  extractTokenRoles,
  hasBrandOwnerRole,
  parseJwtPayload,
  readStoredSession,
  writeStoredSession,
} from '../services/endpoints';

const AuthContext = createContext(null);

const BRAND_OWNER_ONLY_ERROR = 'Only brand owners can sign in to this dashboard';

const createBrandUser = (email, tokenPayload = {}, currentUser = {}) => {
  const roles = Array.from(new Set([
    ...extractTokenRoles(tokenPayload),
    ...(Array.isArray(currentUser?.roles) ? currentUser.roles : []),
    currentUser?.role,
  ].filter(Boolean)));

  const normalizedRole = roles[0] || BRAND_OWNER_ROLE;

  return {
    id: tokenPayload?.sub || tokenPayload?.subject || currentUser?.id || email,
    email,
    name: tokenPayload?.name || tokenPayload?.preferred_username || currentUser?.name || email.split('@')[0] || 'Brand Owner',
    role: normalizedRole,
    roles,
  };
};

const getTokenExpiry = (token) => {
  const payload = parseJwtPayload(token);
  const expiresAt = Number(payload?.exp);

  if (!expiresAt) {
    return null;
  }

  return expiresAt * 1000;
};

const isTokenExpired = (token, bufferMs = 15000) => {
  const expiresAt = getTokenExpiry(token);

  if (!expiresAt) {
    return false;
  }

  return Date.now() >= expiresAt - bufferMs;
};

const extractAuthErrorMessage = (error, fallbackMessage) => {
  const status = Number(error?.response?.status || 0);
  const responseData = error?.response?.data;

  if (status >= 500) {
    return 'service unavailable';
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || error?.message || fallbackMessage;
};

const normalizeStoredSession = (storedSession) => {
  if (!storedSession) {
    return null;
  }

  const accessToken = storedSession?.accessToken || storedSession?.token;
  const refreshToken = storedSession?.refreshToken || '';
  const tokenPayload = parseJwtPayload(accessToken) || {};
  const email = tokenPayload?.email || storedSession?.user?.email;

  if (!accessToken || !email || (!hasBrandOwnerRole(tokenPayload) && !hasBrandOwnerRole(storedSession?.user))) {
    return null;
  }

  return {
    ...storedSession,
    accessToken,
    refreshToken,
    user: createBrandUser(email, tokenPayload, storedSession?.user),
  };
};

const readNormalizedSession = () => {
  const session = normalizeStoredSession(readStoredSession());

  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return session;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readNormalizedSession);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingOtpCode, setPendingOtpCode] = useState('');

  useEffect(() => {
    const syncSession = () => {
      setSession(readNormalizedSession());
    };

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setPendingEmail('');
    setPendingOtpCode('');
  }, []);

  const saveSession = useCallback((nextSession) => {
    const normalizedSession = normalizeStoredSession({
      ...nextSession,
      accessToken: nextSession?.accessToken || nextSession?.token || '',
      refreshToken: nextSession?.refreshToken || '',
    });

    if (!normalizedSession) {
      throw new Error(BRAND_OWNER_ONLY_ERROR);
    }

    writeStoredSession(normalizedSession);
    setSession(normalizedSession);
  }, []);

  const refreshSession = useCallback(async (storedSession) => {
    const refreshToken = storedSession?.refreshToken || '';

    if (!refreshToken) {
      logout();
      return null;
    }

    const { data } = await authAPI.refreshToken(refreshToken);
    const nextAccessToken = data?.accessToken || '';
    const nextRefreshToken = data?.refreshToken || refreshToken;

    if (!nextAccessToken) {
      throw new Error('Refresh response did not include an access token');
    }

    const tokenPayload = parseJwtPayload(nextAccessToken) || {};
    const email = tokenPayload?.email || storedSession?.user?.email;

    if (!email) {
      throw new Error('Unable to resolve user email from refreshed session');
    }

    if (!hasBrandOwnerRole(tokenPayload)) {
      throw new Error(BRAND_OWNER_ONLY_ERROR);
    }

    const nextSession = {
      ...storedSession,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: createBrandUser(email, tokenPayload, storedSession?.user),
    };

    saveSession(nextSession);
    return nextSession;
  }, [logout, saveSession]);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const storedSession = readNormalizedSession();

      if (!storedSession) {
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      const shouldRefresh = !storedSession.accessToken || isTokenExpired(storedSession.accessToken);

      if (!shouldRefresh) {
        if (isMounted) {
          setSession(storedSession);
          setLoading(false);
        }
        return;
      }

      try {
        const nextSession = await refreshSession(storedSession);

        if (isMounted) {
          setSession(nextSession);
        }
      } catch (error) {
        console.warn('Unable to refresh session during auth bootstrap:', error);

        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [logout, refreshSession]);

  const requestBrandOtp = useCallback(async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data } = await authAPI.generateOtp({
        email: normalizedEmail,
        recipient: normalizedEmail,
        purpose: 'EMAIL',
        channel: 'EMAIL_VERIFICATION',
      });

      setPendingEmail(normalizedEmail);
      setPendingOtpCode(data?.otpCodeForTesting || '');

      return {
        success: true,
        email: normalizedEmail,
        otpCodeForTesting: data?.otpCodeForTesting || '',
      };
    } catch (error) {
      return {
        success: false,
        error: extractAuthErrorMessage(error, 'Failed to send OTP'),
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

      if (!hasBrandOwnerRole(tokenPayload)) {
        return {
          success: false,
          error: BRAND_OWNER_ONLY_ERROR,
        };
      }

      const user = createBrandUser(tokenPayload?.email || normalizedEmail, tokenPayload);

      saveSession({
        accessToken,
        refreshToken,
        user,
        authenticatedAt: new Date().toISOString(),
      });

      setPendingEmail('');
      setPendingOtpCode('');

      return {
        success: true,
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: extractAuthErrorMessage(error, 'Failed to verify OTP'),
        remainingAttempts: error?.response?.data?.remainingAttempts,
      };
    }
  }, [saveSession]);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.accessToken || '',
    accessToken: session?.accessToken || '',
    refreshToken: session?.refreshToken || '',
    session,
    loading,
    pendingEmail,
    pendingOtpCode,
    requestBrandOtp,
    verifyBrandOtp,
    logout,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
    isBrandOwner: hasBrandOwnerRole(session?.user),
  }), [loading, logout, pendingEmail, pendingOtpCode, requestBrandOtp, session, verifyBrandOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
