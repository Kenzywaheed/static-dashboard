import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { normalizePaginatedResponse } from '../services/apiResponseUtils';
import { notificationsAPI } from '../services/endpoints';

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['ALL', 'UNREAD', 'READ'];

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

const typeTone = {
  INVENTORY: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  ORDER: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  PAYMENT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  CATALOG: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  MODEL_REQUEST: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-200',
  AGREEMENT: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
  SUBMISSION: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
};

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || error?.message || fallbackMessage;
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  const {
    data: notificationsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-notifications', page, statusFilter, typeFilter, searchTerm],
    queryFn: async () => {
      const response = await notificationsAPI.getAll({
        page,
        size: PAGE_SIZE,
        status: statusFilter,
        type: typeFilter,
        search: searchTerm.trim(),
      });

      return normalizePaginatedResponse(response.data, { fallbackPage: page, fallbackSize: PAGE_SIZE });
    },
  });

  const {
    data: stats,
  } = useQuery({
    queryKey: ['brand-notification-stats'],
    queryFn: async () => {
      const response = await notificationsAPI.stats();
      return response.data || {};
    },
  });

  const refreshNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-notification-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-dashboard-home'] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => notificationsAPI.markRead(notificationId),
    onSuccess: async () => {
      await refreshNotifications();
      toast.success('Notification marked as read');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update notification'));
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: async ({ data }) => {
      await refreshNotifications();
      toast.success(`Marked ${data?.markedAsReadCount || 0} notifications as read`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to mark notifications as read'));
    },
  });

  const notifications = notificationsPage?.items || [];
  const countsByType = useMemo(() => stats?.countsByType || [], [stats?.countsByType]);
  const typeOptions = useMemo(() => countsByType.map((entry) => entry.type).filter(Boolean), [countsByType]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--brand-primary)]">Updates</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Notifications</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Search, filter, and mark operational notifications as read from the shared dashboard inbox.
            </p>
          </div>

          <button
            type="button"
            disabled={markAllReadMutation.isPending || Number(stats?.unread || 0) === 0}
            onClick={() => markAllReadMutation.mutate()}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? 'Updating...' : 'Mark all as read'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total notifications</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stats?.totalNotifications ?? notificationsPage?.totalElements ?? 0}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stats?.unread ?? 0}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Read</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stats?.read ?? 0}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(0);
                }}
                placeholder="Search notifications"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option);
                      setPage(0);
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      statusFilter === option
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(0);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">All types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <p className="font-semibold">We could not load notifications.</p>
                <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                <BellIcon className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No notifications match the current filter.</p>
              </div>
            ) : notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 ${notification.isRead ? 'border-slate-200 dark:border-slate-800' : 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]/20 dark:border-[var(--brand-primary)]/20 dark:bg-slate-800/60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeTone[notification.type] || typeTone.CATALOG}`}>
                        {notification.type}
                      </span>
                      {!notification.isRead && <span className="text-xs font-medium text-[var(--brand-primary)]">Unread</span>}
                    </div>
                    <p className="mt-3 font-medium text-slate-950 dark:text-white">{notification.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{notification.message}</p>
                  </div>
                  {notification.isRead ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <button
                      type="button"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(notification.id)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatDateTime(notification.createdAt)}</span>
                  <span className="truncate">{notification.referenceCode || notification.referenceType || notification.referenceId || '-'}</span>
                </div>
              </article>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Page {(notificationsPage?.page || 0) + 1} of {Math.max(notificationsPage?.totalPages || 0, 1)}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  disabled={!notificationsPage?.hasPrevious}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!notificationsPage?.hasNext}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Counts by type</h2>
            <div className="mt-4 space-y-3">
              {countsByType.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                  No type statistics are available yet.
                </div>
              ) : countsByType.map((entry) => (
                <div key={entry.type} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{entry.type}</span>
                  <span className="font-medium text-slate-950 dark:text-white">{entry.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Inbox notes</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>Unread notifications stay visually highlighted until the API confirms they are read.</p>
              <p>Search and filters are sent to the backend, so the list stays aligned with the paginated response.</p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default Notifications;
