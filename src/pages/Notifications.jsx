import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BellAlertIcon,
  BellIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatDateTime = (value) => {
  if (!value) return 'Just now';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatRelativeDay = (value) => {
  if (!value) return 'Today';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Today';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const toTrendData = (notifications) => {
  const counts = notifications.reduce((accumulator, notification) => {
    const key = formatRelativeDay(notification.createdAt);
    accumulator.set(key, (accumulator.get(key) || 0) + 1);
    return accumulator;
  }, new Map());

  return Array.from(counts.entries())
    .map(([day, total]) => ({ day, total }))
    .slice(-7);
};

const getNotificationTone = (type) => {
  const normalizedType = (type || '').toLowerCase();

  if (normalizedType.includes('return')) {
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900';
  }

  if (normalizedType.includes('payment')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900';
  }

  if (normalizedType.includes('order')) {
    return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900';
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700';
};

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-notifications'],
    queryFn: async () => [],
  });

  const markReadMutation = { mutate: () => {} };

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
  const trendData = toTrendData(notifications);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[var(--brand-primary-soft)]/40 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">Alerts</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Notifications</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Keep an eye on order changes, payment updates, and anything the brand should react to quickly.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
            <BellAlertIcon className="h-5 w-5 text-[var(--brand-primary)]" />
            {unreadCount} unread
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total notifications</p>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{notifications.length}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
          <p className="mt-3 text-3xl font-bold text-[var(--brand-primary)]">{unreadCount}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Read</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{notifications.length - unreadCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, message, or type"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'unread', 'read'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    filter === option
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : isError ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <p className="font-semibold">We could not load notifications right now.</p>
              <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <BellIcon className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Nothing matches this filter</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try a different search term or switch between unread and read messages.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  type="button"
                  onClick={() => {
                    if (!notification.isRead) {
                      markReadMutation.mutate(notification.notificationId);
                    }
                  }}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    notification.isRead
                      ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
                      : 'border-[var(--brand-primary)]/20 bg-[var(--brand-primary-soft)]/30 dark:border-[var(--brand-primary)]/30 dark:bg-[var(--brand-primary)]/10'
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getNotificationTone(notification.notificationType)}`}>
                          {notification.notificationType || 'Notification'}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-[11px] font-bold text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-base font-bold text-slate-950 dark:text-white">{notification.title || 'Untitled notification'}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message || 'No details were provided for this notification.'}</p>
                      {notification.referenceId && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Ref: {notification.referenceId}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDateTime(notification.createdAt)}</span>
                      {notification.isRead && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                          <CheckCircleIcon className="h-4 w-4" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Notification trend</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              A quick read on how many alerts landed in the last few days.
            </p>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="notificationTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="var(--brand-primary)" fill="url(#notificationTrend)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">How this works</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>Unread notifications are highlighted so the urgent ones stand out without overwhelming the rest of the page.</p>
              <p>Unread notifications are highlighted here once the notifications API is enabled.</p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default Notifications;
