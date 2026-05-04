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
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { getDashboardData } from '../services/dashboardMockData';

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
}).format(new Date(value));

const statusTone = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  PROCESSING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  SHIPPED: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const summaryCards = [
  { key: 'totalProducts', label: 'Products', icon: ShoppingBagIcon },
  { key: 'totalCategories', label: 'Categories', icon: FolderIcon },
  { key: 'totalOrders', label: 'Orders', icon: ArchiveBoxIcon },
  { key: 'totalRevenue', label: 'Revenue', icon: WalletIcon, format: money },
];

const cardClass = 'rounded-[26px] border border-[#e8e2d7] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f4_100%)] p-5 shadow-[0_24px_45px_-34px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_55px_-34px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]';

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-simple'],
    queryFn: async () => getDashboardData(),
  });

  if (isLoading) {
    return <div className={`${cardClass} text-sm text-slate-500 dark:text-slate-400`}>Loading dashboard...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-[var(--brand-primary)]">Home</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data.brand.brandName} home</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          A calmer front page for the day-to-day flow: orders, products, stock, and soft analytics that are easy to read.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const value = data.summary[item.key];
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Revenue this week</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Simple trend for revenue and order movement.</p>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.analytics.revenueSeries}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" fill="url(#dashboardRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Order status</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quick distribution of current order flow.</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.analytics.orderStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent products</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest catalog items with category, stock, and price.</p>
            </div>
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
                {data.products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800/70">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.thumbnail} alt={product.productNameEn} className="h-11 w-11 rounded-xl object-cover" />
                        <div>
                          <p className="font-medium text-slate-950 dark:text-white">{product.productNameEn}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{product.productNameAr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{product.categoryNameEn}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{money(product.price)}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {product.productItems.reduce((sum, item) => sum + Object.values(item.sizes || {}).reduce((inner, qty) => inner + Number(qty || 0), 0), 0)}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{formatDate(product.createdAt)}</td>
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
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{money(data.summary.averagePrice)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total stock</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.summary.totalStock}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending orders</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.summary.pendingOrders}</p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Store mood</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Delivered orders</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.summary.deliveredOrders}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">Low stock alerts</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.summary.lowStockCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">New notifications</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.notifications.filter((item) => !item.isRead).length}</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent orders</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest customer activity in one place.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.recentOrders.slice(0, 4).map((order) => (
              <article key={order.orderId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">{order.orderId}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.customerName}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[order.orderStatus] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>{formatDate(order.createdAt)}</span>
                  <span className="font-medium">{money(order.totalPrice)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Need attention</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Low stock and fresh notifications.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.lowStockProducts.slice(0, 2).map((product) => (
              <div key={product.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="font-medium text-slate-950 dark:text-white">{product.productNameEn}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.categoryNameEn}</p>
              </div>
            ))}
            {data.notifications.slice(0, 2).map((notification) => (
              <div key={notification.notificationId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-medium text-slate-950 dark:text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
