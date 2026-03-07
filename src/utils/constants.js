export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

export const GENDERS = ['Male', 'Female', 'Unisex'];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const PAYMENT_TYPES = ['visa', 'mastercard', 'amex', 'discover'];

export const ADMIN_ROLES = ['super_admin', 'manager', 'editor', 'viewer'];

export const SIDEBAR_MENU = [
  { name: 'Dashboard', path: '/', icon: 'HomeIcon' },
  { name: 'Order Management', path: '/orders', icon: 'ShoppingCartIcon' },
  { name: 'Notifications', path: '/notifications', icon: 'BellIcon' },
  { name: 'Calendar', path: '/calendar', icon: 'CalendarIcon' },
  { name: 'Payment Way', path: '/payment', icon: 'CreditCardIcon' },
  { name: 'Order Model', path: '/model', icon: 'UserGroupIcon' },
  { name: 'Products', path: '/products', icon: 'CubeIcon', children: [
    { name: 'Add Products', path: '/products/add' },
  ]},
  { name: 'Admin Roles', path: '/admin', icon: 'ShieldCheckIcon' },
];

export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

