import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const statusTone = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900';
    case 'SHIPPED':
      return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900';
    case 'PAID':
      return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900';
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900';
  }
};

export default function OrderManagementLite() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-orders', statusFilter],
    queryFn: async () => [],
  });

  const {
    data: dashboardSummary,
  } = useQuery({
    queryKey: ['brand-dashboard-summary'],
    queryFn: async () => ({
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
    }),
  });

  const updateStatusMutation = { isPending: false, mutate: () => {} };

  const visibleOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        order.orderId,
        order.customerEmail,
        order.orderStatus,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    });
  }, [orders, searchQuery]);

  const statCards = [
    { label: 'Revenue', value: money(dashboardSummary?.totalRevenue), help: 'Delivered and paid flow' },
    { label: 'Total orders', value: dashboardSummary?.totalOrders ?? orders.length, help: 'Across the brand dashboard' },
    { label: 'Pending', value: dashboardSummary?.pendingOrders ?? orders.filter((order) => order.orderStatus === 'PENDING').length, help: 'Still waiting on the next step' },
    { label: 'Delivered', value: dashboardSummary?.deliveredOrders ?? orders.filter((order) => order.orderStatus === 'DELIVERED').length, help: 'Completed successfully' },
  ];

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderId === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[var(--brand-primary-soft)]/40 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">Brand operations</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Order Management</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Review orders, change fulfillment status, and open the full delivery and payment trail when the order APIs are enabled.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{card.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{card.help}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by order id, customer email, or status"
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-950">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-transparent py-3 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Loading orders...</div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-700 dark:text-red-200">
            <p className="font-semibold">We could not load the orders list.</p>
            <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
              Try again
            </button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-bold text-slate-950 dark:text-white">No orders match right now</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try another status filter or clear the search box.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Order</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Customer</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Created</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Total</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.orderId} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-950 dark:text-white">{String(order.orderId).slice(0, 8)}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Paid: {order.paidAt ? formatDate(order.paidAt) : 'Not yet'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{order.customerEmail}</td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950 dark:text-white">{money(order.totalPrice)}</td>
                    <td className="px-4 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(event) => updateStatusMutation.mutate({
                          orderId: order.orderId,
                          orderStatus: event.target.value,
                        })}
                        disabled={updateStatusMutation.isPending}
                        className={`rounded-full px-3 py-2 text-xs font-bold ring-1 ${statusTone(order.orderStatus)} disabled:opacity-60`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.orderId)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className={`fixed inset-0 z-[80] transition ${selectedOrderId ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          aria-hidden="true"
          onClick={() => setSelectedOrderId('')}
          className={`absolute inset-0 bg-slate-950/35 transition ${selectedOrderId ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside className={`absolute right-0 top-0 h-full w-full max-w-[540px] border-l border-slate-200 bg-white shadow-2xl transition duration-300 dark:border-slate-800 dark:bg-slate-950 ${selectedOrderId ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Order details</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {selectedOrder ? String(selectedOrder.orderId).slice(0, 8) : 'Loading...'}
              </h2>
            </div>
            <button type="button" onClick={() => setSelectedOrderId('')} className="rounded-2xl border border-slate-300 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {!selectedOrder ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading order details...</div>
          ) : (
            <div className="space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Customer" value={selectedOrder.customerEmail} />
                <InfoTile label="Status" value={selectedOrder.orderStatus} />
                <InfoTile label="Total" value={money(selectedOrder.totalPrice)} />
                <InfoTile label="Payment" value={`${selectedOrder.paymentMethod || 'N/A'} / ${selectedOrder.paymentStatus || 'N/A'}`} />
              </div>

              <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Shipping</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>{selectedOrder.shippingRecipientName || 'Recipient not available'}</p>
                  <p>{selectedOrder.shippingPhoneNumber || 'Phone not available'}</p>
                  <p>{selectedOrder.shippingAddressLine1 || ''} {selectedOrder.shippingAddressLine2 || ''}</p>
                  <p>{selectedOrder.shippingCity || ''} {selectedOrder.shippingCountry || ''} {selectedOrder.shippingPostalCode || ''}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Estimated delivery: {formatDate(selectedOrder.estimatedDeliveryAt)}</p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Timeline</h3>
                <div className="mt-4 space-y-3">
                  {(selectedOrder.timeline || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Timeline events are not available for this order yet.
                    </div>
                  ) : selectedOrder.timeline.map((event, index) => (
                    <div key={`${event.eventType}-${event.eventAt}-${index}`} className="flex gap-3">
                      <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand-primary)]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{event.eventType}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(event.eventAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Items</h3>
                <div className="mt-4 space-y-3">
                  {(selectedOrder.items || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No line items were returned for this order.
                    </div>
                  ) : selectedOrder.items.map((item) => (
                    <article key={`${item.productItemId}-${item.sizeName}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950 dark:text-white">{item.productNameEn}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{item.color} / {item.sizeName}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-950 dark:text-white">{money(item.totalPrice)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>Qty {item.quantity}</span>
                        <span>{money(item.price)} each</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-sm text-slate-900 dark:text-white">{value || 'Not available'}</p>
  </div>
);
