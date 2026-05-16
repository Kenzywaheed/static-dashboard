import axios from 'axios';

export const AUTH_STORAGE_KEY = 'brandDashboardAuth';
export const AUTH_SESSION_UPDATED_EVENT = 'brand-dashboard-auth-updated';
export const BRAND_OWNER_ROLE = 'ROLE_BRAND_OWNER';

export const API_BASE_URL = 'https://ecommerce-app-e6303c36e118.herokuapp.com';

const OTP_BASE_URL = `${API_BASE_URL}/api/v1/public/otp`;
const DASHBOARD_HOME_URL = '/api/v1/brands/dashboard/home';
const ORDERS_BASE_URL = '/api/v1/brands/orders';
const CALENDAR_BASE_URL = '/api/v1/brands/calendar';
const NOTIFICATIONS_BASE_URL = '/api/v1/dashboard/notifications';
const CATEGORIES_BASE_URL = '/api/v1/brands/categories';
const PRODUCTS_BASE_URL = '/api/v1/brands/product';
const MODELS_SEARCH_BASE_URL = '/api/v1/brands/models/search';
const MODEL_REQUESTS_BASE_URL = '/api/v1/brands/models/requests';
const MODEL_AGREEMENTS_BASE_URL = '/api/v1/brands/model-agreements';

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

export const normalizeRole = (role) => {
  if (!role) {
    return '';
  }

  const upperRole = String(role).trim().toUpperCase();

  if (!upperRole) {
    return '';
  }

  return upperRole.startsWith('ROLE_') ? upperRole : `ROLE_${upperRole}`;
};

export const extractTokenRoles = (tokenPayload = {}) => {
  const roleCandidates = [
    tokenPayload?.role,
    ...(Array.isArray(tokenPayload?.roles) ? tokenPayload.roles : []),
    ...(Array.isArray(tokenPayload?.authorities) ? tokenPayload.authorities : []),
    ...(Array.isArray(tokenPayload?.permissions) ? tokenPayload.permissions : []),
  ];

  return Array.from(new Set(
    roleCandidates
      .flatMap((entry) => {
        if (Array.isArray(entry)) {
          return entry;
        }

        if (typeof entry === 'string' && entry.includes(',')) {
          return entry.split(',');
        }

        return [entry];
      })
      .map(normalizeRole)
      .filter(Boolean),
  ));
};

export const hasBrandOwnerRole = (value) => {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return normalizeRole(value) === BRAND_OWNER_ROLE;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeRole).includes(BRAND_OWNER_ROLE);
  }

  const payloadRoles = extractTokenRoles(value);

  if (payloadRoles.length > 0) {
    return payloadRoles.includes(BRAND_OWNER_ROLE);
  }

  const userRoles = Array.isArray(value?.roles) ? value.roles : [];
  return userRoles.map(normalizeRole).includes(BRAND_OWNER_ROLE) || normalizeRole(value?.role) === BRAND_OWNER_ROLE;
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

export const readStoredSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

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

export const writeStoredSession = (session) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem('token', session?.accessToken || '');
  localStorage.setItem('refreshToken', session?.refreshToken || '');

  if (session?.user) {
    localStorage.setItem('user', JSON.stringify(session.user));
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT, { detail: session }));
};

export const clearStoredSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT, { detail: null }));
  redirectToLogin();
};

export const buildQueryParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }),
);

export const toFormData = (data, { keepEmptyStrings = false } = {}) => {
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

const toJsonPayload = (data = {}) => Object.fromEntries(
  Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== ''),
);

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

export const toNestedFormData = (data, { keepEmptyStrings = false } = {}) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    appendFormDataValue(formData, key, value, { keepEmptyStrings });
  });

  return formData;
};

const toProductColorFormData = (data) => {
  const formData = new FormData();

  appendFormDataValue(formData, 'colorCode', data.colorCode, { keepEmptyStrings: true });

  (data.colorImages || data.images || data.productColorImages || []).forEach((file) => {
    appendFormDataValue(formData, 'colorImages', file, { keepEmptyStrings: true });
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

    if (
      error.response?.status !== 401
      || originalRequest?._retry
      || String(originalRequest?.url || '').includes('/refresh')
    ) {
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

export const authAPI = {
  generateOtp: ({ email, recipient, purpose = 'EMAIL', channel = 'LOGIN', expiryMinutes }) => axios.post(
    `${OTP_BASE_URL}/generate`,
    toJsonPayload({
      email,
      recipient,
      purpose,
      channel,
      expiryMinutes,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ),

  verifyOtp: ({ recipient, purpose = 'EMAIL', otpCode }) => axios.post(
    `${OTP_BASE_URL}/verify`,
    toJsonPayload({
      recipient,
      purpose,
      otpCode,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ),

  refreshToken: (refreshToken) => axios.post(`${OTP_BASE_URL}/refresh`, { refreshToken }),
};

export const dashboardAPI = {
  getHome: ({ range = '7D' } = {}) => apiClient.get(DASHBOARD_HOME_URL, {
    params: buildQueryParams({ range }),
  }),
};

export const ordersAPI = {
  getAll: ({ page = 0, size = 10, search = '', status = '' } = {}) => apiClient.get(ORDERS_BASE_URL, {
    params: buildQueryParams({ page, size, search, status }),
  }),
  stats: () => apiClient.get(`${ORDERS_BASE_URL}/stats`),
  getById: (orderId) => apiClient.get(`${ORDERS_BASE_URL}/${orderId}`),
  ship: (orderId) => apiClient.post(`${ORDERS_BASE_URL}/${orderId}/ship`),
  deliver: (orderId) => apiClient.post(`${ORDERS_BASE_URL}/${orderId}/deliver`),
};

export const calendarAPI = {
  getMonth: ({ month } = {}) => apiClient.get(CALENDAR_BASE_URL, {
    params: buildQueryParams({ month }),
  }),
  getDay: ({ date } = {}) => apiClient.get(`${CALENDAR_BASE_URL}/day`, {
    params: buildQueryParams({ date }),
  }),
};

export const notificationsAPI = {
  getAll: ({ page = 0, size = 10, status = 'ALL', type = '', search = '' } = {}) => apiClient.get(NOTIFICATIONS_BASE_URL, {
    params: buildQueryParams({ page, size, status, type, search }),
  }),
  stats: () => apiClient.get(`${NOTIFICATIONS_BASE_URL}/stats`),
  markRead: (notificationId) => apiClient.post(`${NOTIFICATIONS_BASE_URL}/${notificationId}/read`),
  markAllRead: () => apiClient.post(`${NOTIFICATIONS_BASE_URL}/read-all`),
};

export const categoriesAPI = {
  getAll: ({ page = 0, size = 10, search = '', gender = '', hasParent } = {}) => apiClient.get(CATEGORIES_BASE_URL, {
    params: buildQueryParams({ page, size, search, gender, hasParent }),
  }),
  stats: () => apiClient.get(`${CATEGORIES_BASE_URL}/stats`),
  create: (data) => apiClient.post(CATEGORIES_BASE_URL, toFormData(data, { keepEmptyStrings: true })),
  update: (categoryId, data) => apiClient.patch(`${CATEGORIES_BASE_URL}/${categoryId}`, toFormData(data, { keepEmptyStrings: true })),
  remove: (categoryId) => apiClient.delete(`${CATEGORIES_BASE_URL}/${categoryId}`),
};

export const productsAPI = {
  getAll: ({ page = 0, size = 10, search = '', categoryId = '', gender = '' } = {}) => apiClient.get(PRODUCTS_BASE_URL, {
    params: buildQueryParams({ page, size, search, categoryId, gender }),
  }),
  create: (data) => apiClient.post(
    PRODUCTS_BASE_URL,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  update: (productId, data) => apiClient.patch(
    `${PRODUCTS_BASE_URL}/${productId}`,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  remove: (productId) => apiClient.delete(`${PRODUCTS_BASE_URL}/${productId}`),
  getColors: (productId) => apiClient.get(`${PRODUCTS_BASE_URL}/${productId}/colors`),
  createColor: (productId, data) => apiClient.post(
    `${PRODUCTS_BASE_URL}/${productId}/colors`,
    toProductColorFormData(data),
  ),
  removeColor: (productId, colorId) => apiClient.delete(`${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}`),
  getVariants: (productId, colorId) => apiClient.get(`${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}/variants`),
  createVariant: (productId, colorId, data) => apiClient.post(
    `${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}/variants`,
    toFormData(data, { keepEmptyStrings: true }),
  ),
  updateVariantStock: (productId, colorId, variantId, stock) => apiClient.patch(
    `${PRODUCTS_BASE_URL}/${productId}/colors/${colorId}/variants/${variantId}/stock`,
    { stock },
  ),
};

export const collaborationAPI = {
  searchModels: ({
    page = 0,
    size = 10,
    search = '',
    minAge,
    maxAge,
    minHeightCm,
    maxHeightCm,
    minWeightKg,
    maxWeightKg,
    availableFor = '',
    isAvailable,
  } = {}) => apiClient.get(MODELS_SEARCH_BASE_URL, {
    params: buildQueryParams({
      page,
      size,
      search,
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      minWeightKg,
      maxWeightKg,
      availableFor,
      isAvailable,
    }),
  }),
  getRequests: ({ page = 0, size = 10, status = '' } = {}) => apiClient.get(MODEL_REQUESTS_BASE_URL, {
    params: buildQueryParams({ page, size, status }),
  }),
  getRequestById: (requestId) => apiClient.get(`${MODEL_REQUESTS_BASE_URL}/${requestId}`),
  createRequest: (modelId, body) => apiClient.post(`/api/v1/brands/models/${modelId}/requests`, body),
  cancelRequest: (requestId) => apiClient.post(`${MODEL_REQUESTS_BASE_URL}/${requestId}/cancel`),
  getAgreements: ({ page = 0, size = 10, status = '' } = {}) => apiClient.get(MODEL_AGREEMENTS_BASE_URL, {
    params: buildQueryParams({ page, size, status }),
  }),
  getAgreementById: (agreementId) => apiClient.get(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}`),
  getSubmissions: (agreementId) => apiClient.get(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/submissions`),
  approveSubmission: (agreementId, submissionId) => apiClient.post(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/submissions/${submissionId}/approve`),
  requestRevision: (agreementId, submissionId, feedback) => apiClient.post(
    `${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/submissions/${submissionId}/request-revision`,
    { feedback },
  ),
  getPayment: (agreementId) => apiClient.get(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/payment`),
  markPaymentSuccess: (agreementId, body) => apiClient.post(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/payments/success`, body),
  markPaymentFailure: (agreementId, body) => apiClient.post(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/payments/failure`, body),
  getReview: (agreementId) => apiClient.get(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/review`),
  saveReview: (agreementId, body) => apiClient.post(`${MODEL_AGREEMENTS_BASE_URL}/${agreementId}/review`, body),
};

export { apiClient, parseJwtPayload };
