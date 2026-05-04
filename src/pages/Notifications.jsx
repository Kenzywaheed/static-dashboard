import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BellIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { getNotificationsData } from '../services/dashboardMockData';

const PAGE_SIZE = 5;

const formatDateTime = (value) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value));

const typeTone = {
  Inventory: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  Order: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  Payment: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  Catalog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: notifications = [] } = useQuery({
    queryKey: ['brand-notifications'],
    queryFn: async () => getNotificationsData(),
  });

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch = !normalizedSearch || [
        notification.title,
        notification.message,
        notification.notificationType,
      ].some((value) => (value || '').toLowerCase().includes(normalizedSearch));

      const matchesFilter = filter === 'all'
        || (filter === 'unread' && !notification.isRead)
        || (filter === 'read' && notification.isRead);

      return matchesSearch && matchesFilter;
    });
  }, [filter, notifications, searchTerm]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const totalPages = Math.max(Math.ceil(filteredNotifications.length / PAGE_SIZE), 1);
  const visibleNotifications = filteredNotifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className={cardClass}>
        <p className="text-sm font-medium text-[var(--brand-primary)]">Updates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Notifications</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          A simple inbox for order, inventory, payment, and catalog updates.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total notifications</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{notifications.length}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{unreadCount}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Read</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{notifications.length - unreadCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search notifications"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'unread', 'read'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFilter(option);
                    setPage(1);
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    filter === option
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {visibleNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                <BellIcon className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No notifications match the current filter.</p>
              </div>
            ) : visibleNotifications.map((notification) => (
              <article key={notification.notificationId} className={`rounded-xl border p-4 ${notification.isRead ? 'border-slate-200 dark:border-slate-800' : 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]/20 dark:border-[var(--brand-primary)]/20 dark:bg-slate-800/60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeTone[notification.notificationType] || typeTone.Catalog}`}>
                        {notification.notificationType}
                      </span>
                      {!notification.isRead && <span className="text-xs font-medium text-[var(--brand-primary)]">Unread</span>}
                    </div>
                    <p className="mt-3 font-medium text-slate-950 dark:text-white">{notification.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{notification.message}</p>
                  </div>
                  {notification.isRead && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatDateTime(notification.createdAt)}</span>
                  <span>{notification.referenceId}</span>
                </div>
              </article>
            ))}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                  Previous
                </button>
                <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page === totalPages} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">What needs focus</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>Unread items stay highlighted until the real notifications API is connected.</p>
              <p>Inventory and order changes are intentionally easier to scan than secondary catalog updates.</p>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Latest types</h2>
            <div className="mt-4 space-y-3">
              {['Inventory', 'Order', 'Payment', 'Catalog'].map((type) => (
                <div key={type} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{type}</span>
                  <span className="font-medium text-slate-950 dark:text-white">
                    {notifications.filter((notification) => notification.notificationType === type).length}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default Notifications;
