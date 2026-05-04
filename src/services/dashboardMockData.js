import { getProductStock, loadSavedProducts } from './productCatalogStore';

const fallbackProducts = [
  {
    id: 'prd-1001',
    productNameEn: 'Classic Oversized Tee',
    productNameAr: 'تيشيرت أوفرسايز كلاسيك',
    categoryId: 'cat-tee',
    categoryNameEn: 'T-Shirts',
    price: 34,
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
    productItems: [
      { sizes: { S: 8, M: 14, L: 12 }, colorName: 'Black' },
      { sizes: { S: 6, M: 10, L: 9 }, colorName: 'Off White' },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'prd-1002',
    productNameEn: 'Street Cargo Pants',
    productNameAr: 'بنطلون كارجو ستريت',
    categoryId: 'cat-pants',
    categoryNameEn: 'Pants',
    price: 59,
    thumbnail: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=300&q=80',
    productItems: [
      { sizes: { M: 7, L: 11, XL: 8 }, colorName: 'Olive' },
    ],
    createdAt: '2026-04-28T14:00:00.000Z',
  },
  {
    id: 'prd-1003',
    productNameEn: 'Minimal Zip Hoodie',
    productNameAr: 'هودي بسوستة',
    categoryId: 'cat-hoodie',
    categoryNameEn: 'Hoodies',
    price: 68,
    thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80',
    productItems: [
      { sizes: { M: 5, L: 4, XL: 6 }, colorName: 'Sand' },
    ],
    createdAt: '2026-04-24T09:30:00.000Z',
  },
  {
    id: 'prd-1004',
    productNameEn: 'Canvas Crossbody Bag',
    productNameAr: 'شنطة كروس قماش',
    categoryId: 'cat-bags',
    categoryNameEn: 'Bags',
    price: 44,
    thumbnail: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=300&q=80',
    productItems: [
      { sizes: { One: 17 }, colorName: 'Stone' },
    ],
    createdAt: '2026-04-21T09:30:00.000Z',
  },
];

const categories = [
  {
    id: 'cat-tee',
    categoryNameEn: 'T-Shirts',
    categoryDescriptionEn: 'Everyday cotton basics and oversized cuts.',
    categoryNameAr: 'تيشيرتات',
    categoryDescriptionAr: 'تيشيرتات يومية وقصات أوفرسايز.',
    imageUrl: '',
    categoryGender: 'UNISEX',
    parentCategoryId: null,
  },
  {
    id: 'cat-pants',
    categoryNameEn: 'Pants',
    categoryDescriptionEn: 'Cargo and straight fits.',
    categoryNameAr: 'بناطيل',
    categoryDescriptionAr: 'بناطيل كارجو وقصات مستقيمة.',
    imageUrl: '',
    categoryGender: 'MALE',
    parentCategoryId: null,
  },
  {
    id: 'cat-hoodie',
    categoryNameEn: 'Hoodies',
    categoryDescriptionEn: 'Fleece hoodies and zip layers.',
    categoryNameAr: 'هوديز',
    categoryDescriptionAr: 'هوديز وخامات فليس.',
    imageUrl: '',
    categoryGender: 'UNISEX',
    parentCategoryId: null,
  },
  {
    id: 'cat-bags',
    categoryNameEn: 'Bags',
    categoryDescriptionEn: 'Crossbody and utility pieces.',
    categoryNameAr: 'شنط',
    categoryDescriptionAr: 'شنط كروس وإكسسوارات عملية.',
    imageUrl: '',
    categoryGender: 'FEMALE',
    parentCategoryId: null,
  },
];

const recentOrders = [
  {
    orderId: 'ORD-2401',
    orderStatus: 'DELIVERED',
    totalPrice: 142,
    createdAt: '2026-05-03T11:30:00.000Z',
    customerEmail: 'mariam@stylehub.test',
    customerName: 'Mariam Hassan',
    paidAt: '2026-05-03T11:50:00.000Z',
    paymentMethod: 'Card',
    paymentStatus: 'PAID',
    shippingRecipientName: 'Mariam Hassan',
    shippingPhoneNumber: '+20123456789',
    shippingAddressLine1: 'Nasr City',
    shippingCity: 'Cairo',
    shippingCountry: 'Egypt',
    shippingPostalCode: '11765',
    estimatedDeliveryAt: '2026-05-05T12:00:00.000Z',
    timeline: [
      { eventType: 'CREATED', eventAt: '2026-05-03T11:30:00.000Z' },
      { eventType: 'PAID', eventAt: '2026-05-03T11:50:00.000Z' },
      { eventType: 'DELIVERED', eventAt: '2026-05-04T16:10:00.000Z' },
    ],
    items: [
      { productItemId: 'itm-1', productNameEn: 'Classic Oversized Tee', color: 'Black', sizeName: 'M', quantity: 2, price: 34, totalPrice: 68 },
      { productItemId: 'itm-2', productNameEn: 'Canvas Crossbody Bag', color: 'Stone', sizeName: 'One', quantity: 1, price: 44, totalPrice: 44 },
    ],
  },
  {
    orderId: 'ORD-2402',
    orderStatus: 'PROCESSING',
    totalPrice: 68,
    createdAt: '2026-05-03T16:20:00.000Z',
    customerEmail: 'omar@stylehub.test',
    customerName: 'Omar Adel',
    paymentMethod: 'Cash',
    paymentStatus: 'PENDING',
    shippingRecipientName: 'Omar Adel',
    shippingPhoneNumber: '+20111222333',
    shippingAddressLine1: 'Dokki',
    shippingCity: 'Giza',
    shippingCountry: 'Egypt',
    shippingPostalCode: '12611',
    estimatedDeliveryAt: '2026-05-06T12:00:00.000Z',
    timeline: [
      { eventType: 'CREATED', eventAt: '2026-05-03T16:20:00.000Z' },
      { eventType: 'PENDING', eventAt: '2026-05-03T16:40:00.000Z' },
    ],
    items: [
      { productItemId: 'itm-3', productNameEn: 'Minimal Zip Hoodie', color: 'Sand', sizeName: 'L', quantity: 1, price: 68, totalPrice: 68 },
    ],
  },
  {
    orderId: 'ORD-2403',
    orderStatus: 'SHIPPED',
    totalPrice: 93,
    createdAt: '2026-05-04T08:10:00.000Z',
    customerEmail: 'nour@stylehub.test',
    customerName: 'Nour Ali',
    paidAt: '2026-05-04T08:30:00.000Z',
    paymentMethod: 'Wallet',
    paymentStatus: 'PAID',
    shippingRecipientName: 'Nour Ali',
    shippingPhoneNumber: '+20109876543',
    shippingAddressLine1: 'Smouha',
    shippingCity: 'Alexandria',
    shippingCountry: 'Egypt',
    shippingPostalCode: '21500',
    estimatedDeliveryAt: '2026-05-06T16:00:00.000Z',
    timeline: [
      { eventType: 'CREATED', eventAt: '2026-05-04T08:10:00.000Z' },
      { eventType: 'PAID', eventAt: '2026-05-04T08:30:00.000Z' },
      { eventType: 'SHIPPED', eventAt: '2026-05-04T13:00:00.000Z' },
    ],
    items: [
      { productItemId: 'itm-4', productNameEn: 'Street Cargo Pants', color: 'Olive', sizeName: 'M', quantity: 1, price: 59, totalPrice: 59 },
      { productItemId: 'itm-5', productNameEn: 'Classic Oversized Tee', color: 'Off White', sizeName: 'S', quantity: 1, price: 34, totalPrice: 34 },
    ],
  },
  {
    orderId: 'ORD-2404',
    orderStatus: 'CANCELLED',
    totalPrice: 59,
    createdAt: '2026-05-04T09:45:00.000Z',
    customerEmail: 'youssef@stylehub.test',
    customerName: 'Youssef Magdy',
    paymentMethod: 'Card',
    paymentStatus: 'REFUNDED',
    shippingRecipientName: 'Youssef Magdy',
    shippingPhoneNumber: '+20112233445',
    shippingAddressLine1: 'Heliopolis',
    shippingCity: 'Cairo',
    shippingCountry: 'Egypt',
    shippingPostalCode: '11757',
    estimatedDeliveryAt: '2026-05-07T12:00:00.000Z',
    timeline: [
      { eventType: 'CREATED', eventAt: '2026-05-04T09:45:00.000Z' },
      { eventType: 'CANCELLED', eventAt: '2026-05-04T10:10:00.000Z' },
    ],
    items: [
      { productItemId: 'itm-6', productNameEn: 'Street Cargo Pants', color: 'Olive', sizeName: 'L', quantity: 1, price: 59, totalPrice: 59 },
    ],
  },
  {
    orderId: 'ORD-2405',
    orderStatus: 'PENDING',
    totalPrice: 102,
    createdAt: '2026-05-02T09:45:00.000Z',
    customerEmail: 'salma@stylehub.test',
    customerName: 'Salma Tamer',
    paymentMethod: 'Card',
    paymentStatus: 'PENDING',
    shippingRecipientName: 'Salma Tamer',
    shippingPhoneNumber: '+20106789123',
    shippingAddressLine1: 'Mansoura',
    shippingCity: 'Dakahlia',
    shippingCountry: 'Egypt',
    shippingPostalCode: '35511',
    estimatedDeliveryAt: '2026-05-07T12:00:00.000Z',
    timeline: [
      { eventType: 'CREATED', eventAt: '2026-05-02T09:45:00.000Z' },
      { eventType: 'PENDING', eventAt: '2026-05-02T10:05:00.000Z' },
    ],
    items: [
      { productItemId: 'itm-7', productNameEn: 'Classic Oversized Tee', color: 'Black', sizeName: 'L', quantity: 3, price: 34, totalPrice: 102 },
    ],
  },
];

const notifications = [
  {
    notificationId: 'ntf-1',
    title: 'Low stock on Minimal Zip Hoodie',
    message: 'One of the hoodie variants dropped under the safety stock level.',
    notificationType: 'Inventory',
    isRead: false,
    referenceId: 'prd-1003',
    createdAt: '2026-05-04T08:35:00.000Z',
  },
  {
    notificationId: 'ntf-2',
    title: 'New shipped order',
    message: 'Order ORD-2403 moved to shipped and is now on the way to the customer.',
    notificationType: 'Order',
    isRead: false,
    referenceId: 'ORD-2403',
    createdAt: '2026-05-04T13:10:00.000Z',
  },
  {
    notificationId: 'ntf-3',
    title: 'Payment pending review',
    message: 'Cash order ORD-2402 still needs confirmation before packing starts.',
    notificationType: 'Payment',
    isRead: true,
    referenceId: 'ORD-2402',
    createdAt: '2026-05-03T17:10:00.000Z',
  },
  {
    notificationId: 'ntf-4',
    title: 'Category sync completed',
    message: 'Brand categories were refreshed and are now available in the add product flow.',
    notificationType: 'Catalog',
    isRead: true,
    referenceId: 'cat-sync',
    createdAt: '2026-05-02T12:00:00.000Z',
  },
];

const calendarEvents = [
  { orderId: 'ORD-2401', eventDate: '2026-05-03T11:30:00.000Z', eventType: 'CREATED', title: 'Order created', currentOrderStatus: 'DELIVERED', customerEmail: 'mariam@stylehub.test', totalPrice: 142 },
  { orderId: 'ORD-2401', eventDate: '2026-05-04T16:10:00.000Z', eventType: 'DELIVERED', title: 'Delivered', currentOrderStatus: 'DELIVERED', customerEmail: 'mariam@stylehub.test', totalPrice: 142 },
  { orderId: 'ORD-2402', eventDate: '2026-05-03T16:20:00.000Z', eventType: 'PENDING', title: 'Awaiting confirmation', currentOrderStatus: 'PROCESSING', customerEmail: 'omar@stylehub.test', totalPrice: 68 },
  { orderId: 'ORD-2403', eventDate: '2026-05-04T13:00:00.000Z', eventType: 'SHIPPED', title: 'Shipment left hub', currentOrderStatus: 'SHIPPED', customerEmail: 'nour@stylehub.test', totalPrice: 93 },
  { orderId: 'ORD-2404', eventDate: '2026-05-04T10:10:00.000Z', eventType: 'CANCELLED', title: 'Order cancelled', currentOrderStatus: 'CANCELLED', customerEmail: 'youssef@stylehub.test', totalPrice: 59 },
  { orderId: 'ORD-2405', eventDate: '2026-05-02T10:05:00.000Z', eventType: 'PENDING', title: 'Pending payment', currentOrderStatus: 'PENDING', customerEmail: 'salma@stylehub.test', totalPrice: 102 },
];

const revenueSeries = [
  { label: 'Mon', revenue: 96, orders: 2 },
  { label: 'Tue', revenue: 124, orders: 3 },
  { label: 'Wed', revenue: 88, orders: 2 },
  { label: 'Thu', revenue: 142, orders: 3 },
  { label: 'Fri', revenue: 164, orders: 4 },
  { label: 'Sat', revenue: 118, orders: 3 },
  { label: 'Sun', revenue: 151, orders: 4 },
];

const brand = {
  id: 'brand-1',
  brandName: 'StyleHub',
  brandEmail: 'hello@stylehub.store',
  description: 'Minimal streetwear catalog for the dashboard workspace.',
  brandImageUrl: '',
};

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const normalizeSavedProduct = (product) => ({
  ...product,
  categoryNameEn: product.categoryNameEn || categories.find((category) => category.id === product.categoryId)?.categoryNameEn || 'Uncategorized',
  price: Number(product.price || 0),
  productItems: product.productItems || [],
});

const resolveProducts = () => {
  const savedProducts = typeof window !== 'undefined'
    ? loadSavedProducts().map(normalizeSavedProduct)
    : [];

  return savedProducts.length ? savedProducts : fallbackProducts;
};

export const getOrdersData = () => recentOrders;
export const getNotificationsData = () => notifications;
export const getCalendarEvents = () => calendarEvents;

export const getDashboardData = () => {
  const products = resolveProducts();
  const totalRevenue = recentOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalStock = products.reduce((sum, product) => sum + getProductStock(product), 0);
  const averagePrice = average(products.map((product) => Number(product.price || 0)));
  const lowStockProducts = products.filter((product) => getProductStock(product) < 20);
  const deliveredOrders = recentOrders.filter((order) => order.orderStatus === 'DELIVERED').length;
  const pendingOrders = recentOrders.filter((order) => ['PENDING', 'PROCESSING'].includes(order.orderStatus)).length;

  return {
    brand,
    availableEndpoints: [
      'POST/PATCH/DELETE /api/v1/brands/product',
      'POST /api/v1/brands/product/{productId}/colors',
      'POST /api/v1/brands/product/{productId}/colors/{colorId}/variants',
      'PATCH /api/v1/brands/product/{productId}/colors/{colorId}/variants/{variantId}/stock',
      'POST/PATCH/DELETE /api/v1/brands/categories',
      'GET /api/v1/categories/brands',
    ],
    summary: {
      totalProducts: products.length,
      totalCategories: categories.length,
      totalOrders: recentOrders.length,
      totalRevenue,
      totalStock,
      averagePrice,
      lowStockCount: lowStockProducts.length,
      deliveredOrders,
      pendingOrders,
    },
    analytics: {
      revenueSeries,
      orderStatus: [
        { label: 'Delivered', value: deliveredOrders },
        { label: 'Pending', value: pendingOrders },
        { label: 'Shipped', value: recentOrders.filter((order) => order.orderStatus === 'SHIPPED').length },
        { label: 'Cancelled', value: recentOrders.filter((order) => order.orderStatus === 'CANCELLED').length },
      ],
    },
    products: products
      .slice()
      .sort((first, second) => new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()),
    categories,
    recentOrders,
    notifications,
    calendarEvents,
    lowStockProducts,
  };
};
