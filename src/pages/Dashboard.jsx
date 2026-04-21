import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const EMPTY_SUMMARY = {
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  lowStockProductItems: 0,
  salesTimeline: [],
  recentOrders: [],
};

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(Number(value || 0));

const formatDay = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const statusTone = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900';
    case 'SHIPPED':
      return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900';
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900';
  }
};

const Dashboard = () => {
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-dashboard-summary'],
    queryFn: async () => EMPTY_SUMMARY,
  });

  const salesTimeline = useMemo(() => (
    (summary?.salesTimeline || []).map((point) => ({
      label: formatDay(point.date),
      revenue: Number(point.revenue || 0),
      orders: Number(point.ordersCount || 0),
    }))
  ), [summary?.salesTimeline]);

  const stats = [
    {
      label: 'Total revenue',
      value: money(summary?.totalRevenue),
      help: 'Confirmed sales volume',
      icon: BanknotesIcon,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Total orders',
      value: summary?.totalOrders ?? 0,
      help: 'Orders the brand has received',
      icon: ClipboardDocumentListIcon,
      accent: 'from-sky-500 to-indigo-500',
    },
    {
      label: 'Pending orders',
      value: summary?.pendingOrders ?? 0,
      help: 'Waiting for the next action',
      icon: TruckIcon,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Low stock items',
      value: summary?.lowStockProductItems ?? 0,
      help: 'Inventory to review soon',
      icon: ExclamationTriangleIcon,
      accent: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Loading dashboard summary...
        </div>
      ) : isError ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-semibold">We could not load the dashboard summary.</p>
          <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${stat.accent}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-xl font-bold text-slate-950 dark:text-white">Revenue</h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTimeline}>
                    <defs>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" fill="url(#salesArea)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Status snapshot</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ['Pending', summary?.pendingOrders ?? 0],
                    ['Delivered', summary?.deliveredOrders ?? 0],
                    ['Cancelled', summary?.cancelledOrders ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-950">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="text-lg font-bold text-slate-950 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Recent orders</h2>
                <div className="mt-5 space-y-3">
                  {(summary?.recentOrders || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Recent orders will appear here when the brand starts receiving them.
                    </div>
                  ) : summary.recentOrders.map((order) => (
                    <article key={order.orderId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950 dark:text-white">{String(order.orderId).slice(0, 8)}</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{order.customerEmail}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDay(order.createdAt)}</span>
                        <span>{money(order.totalPrice)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
