import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { normalizePaginatedResponse } from '../services/apiResponseUtils';
import { ordersAPI } from '../services/endpoints';

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

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || error?.message || fallbackMessage;
};

const buildTimeline = (order) => (
  [
    { label: 'Created', eventAt: order?.createdAt },
    { label: 'Paid', eventAt: order?.paidAt },
    { label: 'Shipped', eventAt: order?.shippedAt },
    { label: 'Delivered', eventAt: order?.deliveredAt },
    { label: 'Cancelled', eventAt: order?.cancelledAt },
  ].filter((entry) => entry.eventAt)
);

const formatShippingAddress = (shippingAddress) => {
  if (!shippingAddress) {
    return 'No shipping address available';
  }

  return [
    shippingAddress?.formattedAddressEn,
    [
      shippingAddress?.buildingNumber,
      shippingAddress?.streetEn,
      shippingAddress?.cityEn,
    ].filter(Boolean).join(', '),
  ].find(Boolean) || 'No shipping address available';
};

const canShipOrder = (order) => ['PENDING', 'PAID'].includes(String(order?.orderStatus || '').toUpperCase());
const canDeliverOrder = (order) => String(order?.orderStatus || '').toUpperCase() === 'SHIPPED';

export default function OrderManagementLite() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [page, setPage] = useState(0);

  const {
    data: ordersPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-orders', page, statusFilter, searchQuery],
    queryFn: async () => {
      const response = await ordersAPI.getAll({
        page,
        size: 10,
        search: searchQuery.trim(),
        status: statusFilter === 'all' ? '' : statusFilter,
      });

      return normalizePaginatedResponse(response.data, { fallbackPage: page, fallbackSize: 10 });
    },
  });

  const {
    data: dashboardSummary,
  } = useQuery({
    queryKey: ['brand-order-stats'],
    queryFn: async () => {
      const response = await ordersAPI.stats();
      return response.data || {};
    },
  });

  const {
    data: selectedOrder,
    isLoading: loadingSelectedOrder,
  } = useQuery({
    queryKey: ['brand-order-detail', selectedOrderId],
    enabled: Boolean(selectedOrderId),
    queryFn: async () => {
      const response = await ordersAPI.getById(selectedOrderId);
      return response.data || null;
    },
  });

  const refreshOrderQueries = async (orderId) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand-orders'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-order-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-dashboard-home'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-calendar-month'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-calendar-day'] }),
      orderId ? queryClient.invalidateQueries({ queryKey: ['brand-order-detail', orderId] }) : Promise.resolve(),
    ]);
  };

  const shipMutation = useMutation({
    mutationFn: (orderId) => ordersAPI.ship(orderId),
    onSuccess: async ({ data: response }) => {
      toast.success(response?.message || 'Order marked as shipped');
      await refreshOrderQueries(response?.orderId || selectedOrderId);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to mark order as shipped'));
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId) => ordersAPI.deliver(orderId),
    onSuccess: async ({ data: response }) => {
      toast.success(response?.message || 'Order marked as delivered');
      await refreshOrderQueries(response?.orderId || selectedOrderId);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to mark order as delivered'));
    },
  });

  const orders = ordersPage?.items || [];
  const totalPages = Math.max(ordersPage?.totalPages || 0, 1);
  const currentPage = Number(ordersPage?.page || 0);

  const statCards = [
    { label: 'Revenue', value: money(dashboardSummary?.revenue), help: 'Revenue returned by order stats' },
    { label: 'Total orders', value: dashboardSummary?.totalOrders ?? ordersPage?.totalElements ?? 0, help: 'Across the current brand account' },
    { label: 'Pending', value: dashboardSummary?.pendingOrders ?? 0, help: 'Still waiting on the next step' },
    { label: 'Delivered', value: dashboardSummary?.deliveredOrders ?? 0, help: 'Completed successfully' },
  ];

  const selectedOrderTimeline = useMemo(() => buildTimeline(selectedOrder), [selectedOrder]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[var(--brand-primary-soft)]/40 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">Brand operations</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Order Management</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Review paginated orders, inspect full customer and shipping details, and move orders through shipping and delivery.
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
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search by order number, customer name, or email"
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-950">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
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
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-bold text-slate-950 dark:text-white">No orders match right now</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try another status filter or clear the search box.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Order</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Customer</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Created</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Total</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Order status</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Payment</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-950 dark:text-white">{order.orderNumber || String(order.orderId).slice(0, 8)}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {String(order.orderId).slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-200">{order.customerName || 'Customer'}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.customerEmail || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950 dark:text-white">{money(order.totalPrice)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-2 text-xs font-bold ring-1 ${statusTone(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{order.paymentStatus || '-'}</td>
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

      {orders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage + 1} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={!ordersPage?.hasPrevious}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!ordersPage?.hasNext}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-[80] transition ${selectedOrderId ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          aria-hidden="true"
          onClick={() => setSelectedOrderId('')}
          className={`absolute inset-0 bg-slate-950/35 transition ${selectedOrderId ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside className={`absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-slate-200 bg-white shadow-2xl transition duration-300 dark:border-slate-800 dark:bg-slate-950 ${selectedOrderId ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Order details</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {selectedOrder?.orderNumber || selectedOrderId || 'Loading...'}
              </h2>
            </div>
            <button type="button" onClick={() => setSelectedOrderId('')} className="rounded-2xl border border-slate-300 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {loadingSelectedOrder ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading order details...</div>
          ) : !selectedOrder ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No order details are available.</div>
          ) : (
            <div className="space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Customer" value={selectedOrder.customerName || selectedOrder.customerEmail} />
                <InfoTile label="Order status" value={selectedOrder.orderStatus} />
                <InfoTile label="Payment" value={`${selectedOrder.paymentMethod || 'N/A'} / ${selectedOrder.paymentStatus || 'N/A'}`} />
                <InfoTile label="Total" value={money(selectedOrder.totalPrice)} />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!canShipOrder(selectedOrder) || shipMutation.isPending || deliverMutation.isPending}
                  onClick={() => shipMutation.mutate(selectedOrder.orderId)}
                  className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shipMutation.isPending ? 'Shipping...' : 'Mark as shipped'}
                </button>
                <button
                  type="button"
                  disabled={!canDeliverOrder(selectedOrder) || shipMutation.isPending || deliverMutation.isPending}
                  onClick={() => deliverMutation.mutate(selectedOrder.orderId)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {deliverMutation.isPending ? 'Delivering...' : 'Mark as delivered'}
                </button>
              </div>

              <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Customer</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>{selectedOrder.customerName || 'Customer not available'}</p>
                  <p>{selectedOrder.customerEmail || 'Email not available'}</p>
                  <p>{selectedOrder.customerPhoneNumber || 'Phone not available'}</p>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Shipping</h3>
                {selectedOrder.shippingAddress ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    <p>{formatShippingAddress(selectedOrder.shippingAddress)}</p>
                    {selectedOrder.shippingAddress?.formattedAddressAr ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedOrder.shippingAddress?.formattedAddressAr}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    No shipping address available
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Timeline</h3>
                <div className="mt-4 space-y-3">
                  {selectedOrderTimeline.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Timeline events are not available for this order yet.
                    </div>
                  ) : selectedOrderTimeline.map((event) => (
                    <div key={`${event.label}-${event.eventAt}`} className="flex gap-3">
                      <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand-primary)]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{event.label}</p>
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
                    <article key={item.orderItemId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-950 dark:text-white">{item.productNameEn || item.productNameAr}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{item.colorCode || '-'} / {item.size || '-'}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.sku || '-'}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-950 dark:text-white">{money(item.totalPrice)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>Qty {item.quantity}</span>
                        <span>{money(item.unitPrice)} each</span>
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
