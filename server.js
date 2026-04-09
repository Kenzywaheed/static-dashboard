import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'dashboard-secret-key-2024';

app.use(cors());
app.use(express.json());

// In-memory data stores
let users = [
  { id: 1, email: 'admin@localbrand.com', password: 'Admin123#', name: 'Admin User', role: 'admin' }
];

let orders = [
  { id: 'ORD-001', created: '2024-01-15', customer: 'John Doe', total: 250.00, profit: 50.00, status: 'completed' },
  { id: 'ORD-002', created: '2024-01-16', customer: 'Jane Smith', total: 180.00, profit: 35.00, status: 'processing' },
  { id: 'ORD-003', created: '2024-01-17', customer: 'Mike Johnson', total: 320.00, profit: 75.00, status: 'pending' },
  { id: 'ORD-004', created: '2024-01-18', customer: 'Sarah Williams', total: 450.00, profit: 100.00, status: 'completed' },
  { id: 'ORD-005', created: '2024-01-19', customer: 'Tom Brown', total: 200.00, profit: 40.00, status: 'cancelled' },
  { id: 'ORD-006', created: '2024-01-20', customer: 'Emily Davis', total: 550.00, profit: 120.00, status: 'processing' },
  { id: 'ORD-007', created: '2024-01-21', customer: 'Chris Wilson', total: 380.00, profit: 80.00, status: 'completed' },
  { id: 'ORD-008', created: '2024-01-22', customer: 'Amanda Taylor', total: 290.00, profit: 60.00, status: 'pending' },
];

let products = [
  { id: 1, name: 'Classic White T-Shirt', price: 29.99, gender: 'Unisex', description: 'Premium cotton t-shirt', sizes: ['S', 'M', 'L'], color: '#ffffff', image: 'https://via.placeholder.com/150' },
  { id: 2, name: 'Denim Jeans', price: 79.99, gender: 'Male', description: 'Classic fit denim jeans', sizes: ['M', 'L', 'XL'], color: '#1e3a8a', image: 'https://via.placeholder.com/150' },
  { id: 3, name: 'Summer Dress', price: 59.99, gender: 'Female', description: 'Light and breezy summer dress', sizes: ['S', 'M', 'L'], color: '#f472b6', image: 'https://via.placeholder.com/150' },
];

let notifications = [
  { id: 1, user: 'John Doe', avatar: 'JD', message: 'New order placed', type: 'order', read: false, time: '2 min ago' },
  { id: 2, user: 'Jane Smith', avatar: 'JS', message: 'Payment received', type: 'payment', read: true, time: '15 min ago' },
  { id: 3, user: 'Mike Johnson', avatar: 'MJ', message: 'Product out of stock', type: 'alert', read: false, time: '1 hour ago' },
  { id: 4, user: 'Sarah Williams', avatar: 'SW', message: 'New user registered', type: 'user', read: true, time: '2 hours ago' },
];

let calendarEvents = [
  { id: 1, title: 'Order Delivery', date: '2024-01-25', type: 'delivery', color: '#22c55e' },
  { id: 2, title: 'Order Processing', date: '2024-01-26', type: 'processing', color: '#3b82f6' },
  { id: 3, title: 'Order Delivery', date: '2024-01-28', type: 'delivery', color: '#22c55e' },
];

let paymentMethods = [
  { id: 1, type: 'visa', number: '**** **** **** 4242', expiry: '12/25', country: 'United States', postalCode: '10001' },
  { id: 2, type: 'mastercard', number: '**** **** **** 5555', expiry: '06/26', country: 'United Kingdom', postalCode: 'SW1A1AA' },
];

let modelRequirements = [
  { id: 1, name: 'Model A', requirements: 'Height: 5\'8", Age: 18-25', status: 'pending' },
  { id: 2, name: 'Model B', requirements: 'Height: 5\'10", Age: 20-30', status: 'pending' },
];

let approvedModels = [
  { id: 3, name: 'Model C', requirements: 'Height: 5\'9", Age: 22-28', status: 'approved' },
  { id: 4, name: 'Model D', requirements: 'Height: 5\'7", Age: 19-26', status: 'approved' },
];

let admins = [
  { id: 1, name: 'Admin User', email: 'admin@localbrand.com', role: 'super_admin', createdAt: '2024-01-01' },
  { id: 2, name: 'Manager User', email: 'manager@localbrand.com', role: 'manager', createdAt: '2024-01-05' },
  { id: 3, name: 'Editor User', email: 'editor@localbrand.com', role: 'editor', createdAt: '2024-01-10' },
];

let categories = [
  { id: 1, name: 'T-Shirts', gender: 'Unisex', details: 'All types of t-shirts', parentId: null },
  { id: 2, name: 'Jeans', gender: 'Male', details: 'Denim and casual jeans', parentId: null },
  { id: 3, name: 'Dresses', gender: 'Female', details: 'Casual and formal dresses', parentId: null },
  { id: 4, name: 'Casual Wear', gender: 'Unisex', details: 'Casual clothing items', parentId: null },
  { id: 5, name: 'Formal Wear', gender: 'Unisex', details: 'Formal clothing items', parentId: null },
];

let dashboardStats = {
  totalSales: 125000,
  totalCosts: 45000,
  discountedAmount: 12500,
  totalOrders: 1250,
  customers: 850,
  totalProducts: 156,
  stockProducts: 120,
  outOfStock: 36,
  revenue: 98500,
};

let topCategories = [
  { name: 'Electronics', value: 45000 },
  { name: 'Clothing', value: 32000 },
  { name: 'Home & Garden', value: 28000 },
  { name: 'Sports', value: 18000 },
  { name: 'Books', value: 12000 },
];

let usersStats = {
  perMinute: [
    { time: '10:00', users: 12 },
    { time: '10:05', users: 18 },
    { time: '10:10', users: 15 },
    { time: '10:15', users: 22 },
    { time: '10:20', users: 19 },
    { time: '10:25', users: 25 },
    { time: '10:30', users: 20 },
  ],
  countryDistribution: [
    { country: 'USA', users: 450 },
    { country: 'UK', users: 280 },
    { country: 'Germany', users: 180 },
    { country: 'France', users: 120 },
    { country: 'Canada', users: 90 },
  ],
};

let transactions = [
  { id: 'TXN-001', customer: 'John Doe', amount: 250.00, status: 'completed', date: '2024-01-15' },
  { id: 'TXN-002', customer: 'Jane Smith', amount: 180.00, status: 'completed', date: '2024-01-16' },
  { id: 'TXN-003', customer: 'Mike Johnson', amount: 320.00, status: 'pending', date: '2024-01-17' },
  { id: 'TXN-004', customer: 'Sarah Williams', amount: 450.00, status: 'completed', date: '2024-01-18' },
  { id: 'TXN-005', customer: 'Tom Brown', amount: 200.00, status: 'failed', date: '2024-01-19' },
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (user) {
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json(dashboardStats);
});

app.get('/api/dashboard/reports', (req, res) => {
  res.json({
    customers: dashboardStats.customers,
    totalProducts: dashboardStats.totalProducts,
    stockProducts: dashboardStats.stockProducts,
    outOfStock: dashboardStats.outOfStock,
    revenue: dashboardStats.revenue,
  });
});

app.get('/api/dashboard/users-stats', (req, res) => {
  res.json(usersStats);
});

app.get('/api/dashboard/top-categories', (req, res) => {
  res.json(topCategories);
});

app.get('/api/dashboard/transactions', (req, res) => {
  res.json(transactions);
});

// Orders routes
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    order.status = req.body.status;
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.delete('/api/orders/:id', authenticateToken, (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index > -1) {
    orders.splice(index, 1);
    res.json({ message: 'Order deleted' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.post('/api/orders', authenticateToken, (req, res) => {
  const newOrder = {
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    ...req.body,
  };
  orders.push(newOrder);
  res.json(newOrder);
});

// Products routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: products.length + 1,
    ...req.body,
  };
  products.push(newProduct);
  res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    Object.assign(product, req.body);
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index > -1) {
    products.splice(index, 1);
    res.json({ message: 'Product deleted' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Notifications routes
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.get('/api/notifications/stats', (req, res) => {
  const total = notifications.length;
  const unread = notifications.filter(n => !n.read).length;
  res.json({ total, unread });
});

app.get('/api/notifications/chart-data', (req, res) => {
  res.json([
    { day: 'Mon', notifications: 12 },
    { day: 'Tue', notifications: 19 },
    { day: 'Wed', notifications: 15 },
    { day: 'Thu', notifications: 22 },
    { day: 'Fri', notifications: 18 },
    { day: 'Sat', notifications: 10 },
    { day: 'Sun', notifications: 8 },
  ]);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notification = notifications.find(n => n.id === parseInt(req.params.id));
  if (notification) {
    notification.read = true;
    res.json(notification);
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

// Calendar routes
app.get('/api/calendar/events', (req, res) => {
  res.json(calendarEvents);
});

app.get('/api/calendar/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/calendar/events', authenticateToken, (req, res) => {
  const newEvent = {
    id: calendarEvents.length + 1,
    ...req.body,
  };
  calendarEvents.push(newEvent);
  res.json(newEvent);
});

app.put('/api/calendar/events/:id', authenticateToken, (req, res) => {
  const event = calendarEvents.find(e => e.id === parseInt(req.params.id));
  if (event) {
    Object.assign(event, req.body);
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
});

// Payment routes
app.get('/api/payment/methods', (req, res) => {
  res.json(paymentMethods);
});

app.post('/api/payment/methods', authenticateToken, (req, res) => {
  const newMethod = {
    id: paymentMethods.length + 1,
    ...req.body,
  };
  paymentMethods.push(newMethod);
  res.json(newMethod);
});

app.put('/api/payment/methods/:id', authenticateToken, (req, res) => {
  const method = paymentMethods.find(m => m.id === parseInt(req.params.id));
  if (method) {
    Object.assign(method, req.body);
    res.json(method);
  } else {
    res.status(404).json({ message: 'Payment method not found' });
  }
});

app.delete('/api/payment/methods/:id', authenticateToken, (req, res) => {
  const index = paymentMethods.findIndex(m => m.id === parseInt(req.params.id));
  if (index > -1) {
    paymentMethods.splice(index, 1);
    res.json({ message: 'Payment method deleted' });
  } else {
    res.status(404).json({ message: 'Payment method not found' });
  }
});

// Order Model routes
app.get('/api/model/requirements', (req, res) => {
  res.json(modelRequirements);
});

app.get('/api/model/approved', (req, res) => {
  res.json(approvedModels);
});

app.get('/api/model/pending', (req, res) => {
  res.json([...modelRequirements, ...approvedModels].filter(m => m.status === 'pending'));
});

app.put('/api/model/:id/approve', authenticateToken, (req, res) => {
  const model = [...modelRequirements, ...approvedModels].find(m => m.id === parseInt(req.params.id));
  if (model) {
    model.status = 'approved';
    res.json(model);
  } else {
    res.status(404).json({ message: 'Model not found' });
  }
});

app.put('/api/model/:id/reject', authenticateToken, (req, res) => {
  const model = [...modelRequirements, ...approvedModels].find(m => m.id === parseInt(req.params.id));
  if (model) {
    model.status = 'rejected';
    res.json(model);
  } else {
    res.status(404).json({ message: 'Model not found' });
  }
});

// Admin routes
app.get('/api/admins', (req, res) => {
  res.json(admins);
});

app.get('/api/admins/roles', (req, res) => {
  res.json(['super_admin', 'manager', 'editor', 'viewer']);
});

app.post('/api/admins', authenticateToken, (req, res) => {
  const newAdmin = {
    id: admins.length + 1,
    ...req.body,
    createdAt: new Date().toISOString().split('T')[0],
  };
  admins.push(newAdmin);
  res.json(newAdmin);
});

app.put('/api/admins/:id/role', authenticateToken, (req, res) => {
  const admin = admins.find(a => a.id === parseInt(req.params.id));
  if (admin) {
    admin.role = req.body.role;
    res.json(admin);
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
});

app.delete('/api/admins/:id', authenticateToken, (req, res) => {
  const index = admins.findIndex(a => a.id === parseInt(req.params.id));
  if (index > -1) {
    admins.splice(index, 1);
    res.json({ message: 'Admin deleted' });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
});

// Categories routes
app.get('/api/categories', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCategories = categories.slice(startIndex, endIndex);
  res.json({
    data: paginatedCategories,
    total: categories.length,
    page,
    totalPages: Math.ceil(categories.length / limit),
    totalCount: categories.length
  });
});

app.post('/api/categories', (req, res) => {
  const newCategory = {
    id: categories.length + 1,
    ...req.body,
  };
  categories.push(newCategory);
  res.json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const category = categories.find(c => c.id === parseInt(req.params.id));
  if (category) {
    Object.assign(category, req.body);
    res.json(category);
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (index > -1) {
    categories.splice(index, 1);
    res.json({ message: 'Category deleted' });
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

