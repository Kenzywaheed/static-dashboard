import api from './api';

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getReports: () => api.get('/dashboard/reports'),
  getUsersStats: () => api.get('/dashboard/users-stats'),
  getTopCategories: () => api.get('/dashboard/top-categories'),
  getTransactions: () => api.get('/dashboard/transactions'),
};

// Orders APIs
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Products APIs
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Notifications APIs
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getStats: () => api.get('/notifications/stats'),
  getChartData: () => api.get('/notifications/chart-data'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Calendar APIs
export const calendarAPI = {
  getEvents: () => api.get('/calendar/events'),
  getOrders: () => api.get('/calendar/orders'),
  createEvent: (data) => api.post('/calendar/events', data),
  updateEvent: (id, data) => api.put(`/calendar/events/${id}`, data),
};

// Payment APIs
export const paymentAPI = {
  getMethods: () => api.get('/payment/methods'),
  createMethod: (data) => api.post('/payment/methods', data),
  updateMethod: (id, data) => api.put(`/payment/methods/${id}`, data),
  deleteMethod: (id) => api.delete(`/payment/methods/${id}`),
};

// Model APIs
export const modelAPI = {
  getRequirements: () => api.get('/model/requirements'),
  getApproved: () => api.get('/model/approved'),
  getPending: () => api.get('/model/pending'),
  approve: (id) => api.put(`/model/${id}/approve`),
  reject: (id) => api.put(`/model/${id}/reject`),
};

// Admin APIs
export const adminAPI = {
  getAll: () => api.get('/admins'),
  getRoles: () => api.get('/admins/roles'),
  create: (data) => api.post('/admins', data),
  updateRole: (id, role) => api.put(`/admins/${id}/role`, { role }),
  delete: (id) => api.delete(`/admins/${id}`),
};

// Categories APIs
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

