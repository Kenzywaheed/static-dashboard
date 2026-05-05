import axios from 'axios';

export const AUTH_STORAGE_KEY = 'brandDashboardAuth';
export const AUTH_SESSION_UPDATED_EVENT = 'brand-dashboard-auth-updated';

const API_BASE_URL = 'https://ecommerce-app-e6303c36e118.herokuapp.com';
const BRAND_OWNER_CATEGORIES_BASE_URL = `${API_BASE_URL}/api/v1/brands/categories`;
const BRAND_CATEGORIES_BASE_URL = `${API_BASE_URL}/api/v1/categories/brands`;
const OTP_BASE_URL = `${API_BASE_URL}/api/v1/public/otp`;
const PRODUCTS_BASE_URL = `${API_BASE_URL}/api/v1/brands/product`;
const PUBLIC_PRODUCTS_BASE_URL = `${API_BASE_URL}/api/v1/products`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

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

const isTokenExpired = (token, bufferMs = 15000) => {
  const payload = parseJwtPayload(token);
  const expiresAt = Number(payload?.exp);

  if (!expiresAt) {
    return false;
  }

  return Date.now() >= (expiresAt * 1000) - bufferMs;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const loginHash = '#/login';

  if (window.location.hash !== loginHash) {
    window.location.hash = loginHash;
  }
};

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
  redirectToLogin();
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

const isFileLike = (value) => value instanceof Blob || value instanceof File;

const appendFormDataValue = (formData, key, value, { keepEmptyStrings = false } = {}) => {
  if (value === null || value === undefined) {
    return;
  }

  if (value === '' && !keepEmptyStrings) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item && typeof item === 'object' && !isFileLike(item) && !Array.isArray(item)) {
        Object.entries(item).forEach(([nestedKey, nestedValue]) => {
          appendFormDataValue(formData, `${key}[${index}].${nestedKey}`, nestedValue, { keepEmptyStrings });
        });
        return;
      }

      appendFormDataValue(formData, key, item, { keepEmptyStrings });
    });
    return;
  }

  if (value instanceof Date) {
    formData.append(key, value.toISOString());
    return;
  }

  if (value && typeof value === 'object' && !isFileLike(value)) {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendFormDataValue(formData, `${key}.${nestedKey}`, nestedValue, { keepEmptyStrings });
    });
    return;
  }

  formData.append(key, value);
};

const toNestedFormData = (data, { keepEmptyStrings = false } = {}) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    appendFormDataValue(formData, key, value, { keepEmptyStrings });
  });

  return formData;
};

const toProductColorFormData = (data) => {
  const formData = new FormData();

  appendFormDataValue(formData, 'colorCode', data.colorCode, { keepEmptyStrings: true });

  (data.images || data.productColorImages || []).forEach((file) => {
    appendFormDataValue(formData, 'images', file, { keepEmptyStrings: true });
  });

  return formData;
};

let refreshPromise = null;

const refreshAccessToken = async (session) => {
  const refreshToken = session?.refreshToken;

  if (!refreshToken) {
    clearStoredSession();
    throw new Error('No refresh token available');
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

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  const session = readStoredSession();
  const accessToken = session?.accessToken || session?.token;

  if (accessToken && isTokenExpired(accessToken) && session?.refreshToken) {
    const nextAccessToken = await refreshAccessToken(session);
    config.headers.Authorization = `Bearer ${nextAccessToken}`;
    return config;
  }

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
    const nextAccessToken = await refreshAccessToken(session);

    originalRequest._retry = true;
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return apiClient(originalRequest);
  },
);

export const categoriesAPI = {
  getAll: ({ brandId, page = 0, size = 10 } = {}) => apiClient.get(BRAND_CATEGORIES_BASE_URL, {
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
  getAll: ({
    minPrice,
    maxPrice,
    minRating,
    sort,
    categoryName,
    page = 0,
    size = 100,
  } = {}) => apiClient.get(PUBLIC_PRODUCTS_BASE_URL, {
    params: {
      minPrice,
      maxPrice,
      minRating,
      sort,
      categoryName,
      page,
      size,
    },
  }),
  getDetails: (productId) => apiClient.get(`${PUBLIC_PRODUCTS_BASE_URL}/${productId}`),
  create: (data) => apiClient.post(
    PRODUCTS_BASE_URL,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  update: (productId, data) => apiClient.patch(
    `${PRODUCTS_BASE_URL}/${productId}`,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  remove: (productId) => apiClient.delete(`${PRODUCTS_BASE_URL}/${productId}`),
  toggleVisibility: (productId, active) => apiClient.patch(`${PRODUCTS_BASE_URL}/${productId}/visibility`, null, {
    params: { active },
  }),
  toggleArchive: (productId, archived) => apiClient.patch(`${PRODUCTS_BASE_URL}/${productId}/archive`, null, {
    params: { archived },
  }),
  createColor: (productId, data) => apiClient.post(
    `${PRODUCTS_BASE_URL}/${productId}/colors`,
    toProductColorFormData(data),
  ),
  createVariant: (productId, colorId, data) => apiClient.post(
    `${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}/variants`,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  updateVariantStock: (productId, colorId, variantId, stock) => apiClient.patch(
    `${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}/variants/${variantId}/stock`,
    null,
    { params: { stock } },
  ),
};

export { apiClient, toFormData, toNestedFormData };
