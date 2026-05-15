import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArchiveBoxIcon,
  FolderIcon,
  ShoppingBagIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardAPI } from '../services/endpoints';

const RANGE_OPTIONS = ['7D', '30D'];

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatShortDay = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const statusTone = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  PAID: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200',
  SHIPPED: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const summaryCards = [
  { key: 'productsCount', label: 'Products', icon: ShoppingBagIcon },
  { key: 'categoriesCount', label: 'Categories', icon: FolderIcon },
  { key: 'ordersCount', label: 'Orders', icon: ArchiveBoxIcon },
  { key: 'revenue', label: 'Revenue', icon: WalletIcon, format: money },
];

const defaultHomeData = {
  brandName: 'Brand dashboard',
  range: '7D',
  summary: {
    productsCount: 0,
    categoriesCount: 0,
    ordersCount: 0,
    revenue: 0,
  },
  revenueSeries: [],
  orderStatusDistribution: [],
  recentProducts: [],
  todayAtGlance: {
    averagePrice: 0,
    totalStock: 0,
    pendingOrders: 0,
  },
  storeMood: {
    deliveredOrders: 0,
    lowStockAlerts: 0,
    newNotifications: 0,
  },
  recentOrders: [],
  needAttention: [],
};

const cardClass = 'rounded-[26px] border border-[#e8e2d7] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f4_100%)] p-5 shadow-[0_24px_45px_-34px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_55px_-34px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]';

const normalizeDashboardHome = (home = {}, range) => ({
  brandName: home.brandName || 'Brand dashboard',
  range: home.range || range,
  summary: {
    productsCount: Number(home.summary?.productsCount || 0),
    categoriesCount: Number(home.summary?.categoriesCount || 0),
    ordersCount: Number(home.summary?.ordersCount || 0),
    revenue: Number(home.summary?.revenue || 0),
  },
  revenueSeries: (home.revenueSeries || []).map((entry) => ({
    label: formatShortDay(entry.day),
    revenue: Number(entry.revenue || 0),
  })),
  orderStatusDistribution: (home.orderStatusDistribution || []).map((entry) => ({
    label: entry.status || 'UNKNOWN',
    value: Number(entry.count || 0),
  })),
  recentProducts: home.recentProducts || [],
  todayAtGlance: {
    averagePrice: Number(home.todayAtGlance?.averagePrice || 0),
    totalStock: Number(home.todayAtGlance?.totalStock || 0),
    pendingOrders: Number(home.todayAtGlance?.pendingOrders || 0),
  },
  storeMood: {
    deliveredOrders: Number(home.storeMood?.deliveredOrders || 0),
    lowStockAlerts: Number(home.storeMood?.lowStockAlerts || 0),
    newNotifications: Number(home.storeMood?.newNotifications || 0),
  },
  recentOrders: home.recentOrders || [],
  needAttention: home.needAttention || [],
});

const useDashboardBoxQuery = (range, select) => useQuery({
  queryKey: ['brand-dashboard-home', range],
  queryFn: async () => {
    const response = await dashboardAPI.getHome({ range });
    return normalizeDashboardHome(response.data || {}, range);
  },
  select,
});

const EmptyBlock = ({ message }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
    {message}
  </div>
);

const Dashboard = () => {
  const [range, setRange] = useState('7D');

  const brandQuery = useDashboardBoxQuery(range, (data) => ({
    brandName: data.brandName,
    range: data.range,
  }));
  const summaryQuery = useDashboardBoxQuery(range, (data) => data.summary);
  const revenueSeriesQuery = useDashboardBoxQuery(range, (data) => data.revenueSeries);
  const orderStatusQuery = useDashboardBoxQuery(range, (data) => data.orderStatusDistribution);
  const recentProductsQuery = useDashboardBoxQuery(range, (data) => data.recentProducts);
  const todayAtGlanceQuery = useDashboardBoxQuery(range, (data) => data.todayAtGlance);
  const storeMoodQuery = useDashboardBoxQuery(range, (data) => data.storeMood);
  const recentOrdersQuery = useDashboardBoxQuery(range, (data) => data.recentOrders);
  const needAttentionQuery = useDashboardBoxQuery(range, (data) => data.needAttention);

  const queries = [
    brandQuery,
    summaryQuery,
    revenueSeriesQuery,
    orderStatusQuery,
    recentProductsQuery,
    todayAtGlanceQuery,
    storeMoodQuery,
    recentOrdersQuery,
    needAttentionQuery,
  ];

  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const refetch = () => brandQuery.refetch();

  const brand = brandQuery.data || {
    brandName: defaultHomeData.brandName,
    range,
  };
  const summary = summaryQuery.data || defaultHomeData.summary;
  const revenueSeries = revenueSeriesQuery.data || defaultHomeData.revenueSeries;
  const orderStatusDistribution = orderStatusQuery.data || defaultHomeData.orderStatusDistribution;
  const recentProducts = recentProductsQuery.data || defaultHomeData.recentProducts;
  const todayAtGlance = todayAtGlanceQuery.data || defaultHomeData.todayAtGlance;
  const storeMood = storeMoodQuery.data || defaultHomeData.storeMood;
  const recentOrders = recentOrdersQuery.data || defaultHomeData.recentOrders;
  const needAttention = needAttentionQuery.data || defaultHomeData.needAttention;

  if (isLoading) {
    return <div className={`${cardClass} text-sm text-slate-500 dark:text-slate-400`}>Loading dashboard...</div>;
  }

  if (isError) {
    return (
      <div className={`${cardClass} space-y-4`}>
        <p className="text-sm text-rose-600 dark:text-rose-300">We could not load the dashboard right now.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--brand-primary)]">Home</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{brand.brandName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Brand performance, order flow, recent catalog activity, and the items that need your attention first.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  range === option
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const value = summary[item.key];
          const formattedValue = item.format ? item.format(value) : value;

          return (
            <article key={item.key} className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formattedValue}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <item.icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Revenue trend</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Revenue over the selected range.</p>
          </div>
          <div className="mt-5 h-72">
            {revenueSeries.length === 0 ? (
              <EmptyBlock message="No revenue data was returned for this range yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => money(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" fill="url(#dashboardRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Order status</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Distribution across current order states.</p>
          <div className="mt-5 h-72">
            {orderStatusDistribution.length === 0 ? (
              <EmptyBlock message="No order status distribution is available yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent products</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Newest catalog additions from the dashboard API.</p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No recent products were returned.
                    </td>
                  </tr>
                ) : recentProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 dark:border-slate-800/70">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.productNameEn} className="h-11 w-11 rounded-xl object-cover" />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        )}
                        <div>
                          <p className="font-medium text-slate-950 dark:text-white">{product.productNameEn || product.productNameAr}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{product.productNameAr || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{product.categoryNameEn || product.categoryNameAr || '-'}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{money(product.price)}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{Number(product.totalStock || 0)}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{formatDateTime(product.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Today at a glance</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Average price</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{money(todayAtGlance.averagePrice)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total stock</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{todayAtGlance.totalStock}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending orders</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{todayAtGlance.pendingOrders}</p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Store mood</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Delivered orders</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{storeMood.deliveredOrders}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Low stock alerts</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{storeMood.lowStockAlerts}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">New notifications</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{storeMood.newNotifications}</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent orders</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest orders returned by the home endpoint.</p>
          </div>

          <div className="mt-5 space-y-3">
            {recentOrders.length === 0 ? (
              <EmptyBlock message="No recent orders were returned." />
            ) : recentOrders.map((order) => (
              <article key={order.orderId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">{order.orderNumber || order.orderId}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.customerName || order.customerEmail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[order.orderStatus] || statusTone.PENDING}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span className="font-medium">{money(order.totalPrice)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Need attention</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Unread operational items surfaced by the dashboard.</p>
          </div>

          <div className="mt-5 space-y-3">
            {needAttention.length === 0 ? (
              <EmptyBlock message="Nothing needs attention right now." />
            ) : needAttention.map((notification) => (
              <div key={notification.notificationId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950 dark:text-white">{notification.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {notification.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
                <p className="mt-3 text-xs text-slate-400">{formatDateTime(notification.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
