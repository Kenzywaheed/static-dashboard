import axios from 'axios';

export const AUTH_STORAGE_KEY = 'brandDashboardAuth';
export const AUTH_SESSION_UPDATED_EVENT = 'brand-dashboard-auth-updated';

const API_BASE_URL = 'https://ecommerce-app-e6303c36e118.herokuapp.com';
const BRAND_OWNER_CATEGORIES_BASE_URL = `${API_BASE_URL}/api/v1/brands/categories`;
const PUBLIC_BRAND_CATEGORIES_BASE_URL = `${API_BASE_URL}/api/v1/categories/brands`;
const OTP_BASE_URL = `${API_BASE_URL}/api/v1/public/otp`;
const PRODUCTS_BASE_URL = 'API_WAITING_FOR_BACKEND_PRODUCT_ROUTE';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const readStoredSession = () => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const writeStoredSession = (session) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem('token', session.accessToken || '');
  localStorage.setItem('refreshToken', session.refreshToken || '');
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT, { detail: session }));
};

const clearStoredSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT, { detail: null }));
};

const toFormData = (data, { keepEmptyStrings = false } = {}) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (value === '' && !keepEmptyStrings) {
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const session = readStoredSession();
  const accessToken = session?.accessToken || session?.token;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      throw error;
    }

    const session = readStoredSession();
    const refreshToken = session?.refreshToken;

    if (!refreshToken) {
      clearStoredSession();
      throw error;
    }

    if (!refreshPromise) {
      refreshPromise = axios.post(`${OTP_BASE_URL}/refresh`, { refreshToken })
        .then(({ data }) => {
          const nextSession = {
            ...session,
            accessToken: data?.accessToken || '',
            refreshToken: data?.refreshToken || refreshToken,
          };

          writeStoredSession(nextSession);
          return nextSession.accessToken;
        })
        .catch((refreshError) => {
          clearStoredSession();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const nextAccessToken = await refreshPromise;

    originalRequest._retry = true;
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return apiClient(originalRequest);
  },
);

export const categoriesAPI = {
  getAll: ({ brandId, page = 0, size = 10 }) => apiClient.get(PUBLIC_BRAND_CATEGORIES_BASE_URL, {
    params: { brandId, page, size },
  }),
  create: (data) => apiClient.post(BRAND_OWNER_CATEGORIES_BASE_URL, toFormData(data, { keepEmptyStrings: true })),
  update: (categoryId, data) => apiClient.patch(`${BRAND_OWNER_CATEGORIES_BASE_URL}/${categoryId}`, toFormData(data, { keepEmptyStrings: true })),
  remove: (categoryId) => apiClient.delete(`${BRAND_OWNER_CATEGORIES_BASE_URL}/${categoryId}`),
};

export const authAPI = {
  generateOtp: ({ email, recipient, purpose = 'EMAIL', channel = 'LOGIN', expiryMinutes }) => axios.post(
    `${OTP_BASE_URL}/generate`,
    toFormData({
      email,
      recipient,
      purpose,
      channel,
      expiryMinutes,
    }),
  ),

  verifyOtp: ({ recipient, purpose = 'EMAIL', otpCode }) => axios.post(
    `${OTP_BASE_URL}/verify`,
    toFormData({
      recipient,
      purpose,
      otpCode,
    }),
  ),

  refreshToken: (refreshToken) => axios.post(`${OTP_BASE_URL}/refresh`, { refreshToken }),
};

export const productsAPI = {
  create: () => Promise.reject(new Error(`Product API is not ready: ${PRODUCTS_BASE_URL}`)),
};
