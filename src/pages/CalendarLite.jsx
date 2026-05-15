import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { calendarAPI } from '../services/endpoints';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const eventTypeStyles = {
  ORDER_CREATED: 'bg-sky-500',
  ORDER_SHIPPED: 'bg-indigo-500',
  ORDER_DELIVERED: 'bg-teal-500',
  ORDER_CANCELLED: 'bg-rose-500',
};

const formatMonthParam = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
);

const formatDateKey = (year, month, day) => (
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

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

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
    {message}
  </div>
);

export default function CalendarLite() {
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');

  const monthParam = formatMonthParam(displayDate);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;

  const {
    data: monthData,
    isLoading: loadingMonth,
    isError: monthError,
    refetch: refetchMonth,
  } = useQuery({
    queryKey: ['brand-calendar-month', monthParam],
    queryFn: async () => {
      const response = await calendarAPI.getMonth({ month: monthParam });
      return response.data || { days: [], upcomingOrders: [] };
    },
  });

  const resolvedSelectedDate = useMemo(() => {
    if (selectedDate && selectedDate.startsWith(monthParam)) {
      return selectedDate;
    }

    return monthData?.days?.[0]?.date || `${monthParam}-01`;
  }, [monthData?.days, monthParam, selectedDate]);

  const {
    data: dayData,
    isLoading: loadingDay,
  } = useQuery({
    queryKey: ['brand-calendar-day', resolvedSelectedDate],
    enabled: Boolean(resolvedSelectedDate),
    queryFn: async () => {
      const response = await calendarAPI.getDay({ date: resolvedSelectedDate });
      return response.data || { date: resolvedSelectedDate, events: [] };
    },
  });

  const daysByDate = useMemo(() => (
    new Map((monthData?.days || []).map((entry) => [entry.date, entry]))
  ), [monthData?.days]);

  const totalDays = new Date(year, month, 0).getDate();
  const startDay = new Date(year, month - 1, 1).getDay();

  const cells = [];

  for (let index = 0; index < startDay; index += 1) {
    cells.push(<div key={`empty-${index}`} className="min-h-[110px] rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40" />);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = formatDateKey(year, month, day);
    const daySummary = daysByDate.get(dateKey);
    const markers = daySummary?.markers || [];
    const isSelected = resolvedSelectedDate === dateKey;

    cells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => setSelectedDate(dateKey)}
        className={`min-h-[110px] rounded-xl border p-3 text-left transition ${
          isSelected
            ? 'border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800'
            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-950 dark:text-white">{day}</span>
          {Number(daySummary?.totalEvents || 0) > 0 && <span className="text-xs text-slate-400">{daySummary.totalEvents}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {markers.slice(0, 4).map((marker) => (
            <span
              key={`${dateKey}-${marker.eventType}`}
              className={`h-2.5 w-2.5 rounded-full ${eventTypeStyles[marker.eventType] || 'bg-slate-400'}`}
              title={`${marker.eventType}: ${marker.count}`}
            />
          ))}
        </div>
      </button>,
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-[var(--brand-primary)]">Schedule</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Calendar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Monthly order activity with daily event markers and a day-by-day breakdown from the calendar endpoints.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{monthNames[month - 1]} {year}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monthly event overview.</p>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDisplayDate(new Date(year, month - 2, 1))} className="rounded-xl border border-slate-300 p-2.5 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setDisplayDate(new Date(year, month, 1))} className="rounded-xl border border-slate-300 p-2.5 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {monthError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <p className="font-semibold">We could not load the calendar month.</p>
              <button type="button" onClick={() => refetchMonth()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
                Try again
              </button>
            </div>
          ) : loadingMonth ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading calendar...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekdayNames.map((weekday) => (
                <div key={weekday} className="rounded-xl bg-slate-100 p-3 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {weekday}
                </div>
              ))}
              {cells}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Selected day</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{resolvedSelectedDate || 'No day selected'}</p>
            <div className="mt-5 space-y-3">
              {loadingDay ? (
                <EmptyState message="Loading day events..." />
              ) : (dayData?.events || []).length === 0 ? (
                <EmptyState message="No events on this day." />
              ) : dayData.events.map((event) => (
                <article key={`${event.orderId}-${event.eventType}-${event.eventTime}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${eventTypeStyles[event.eventType] || 'bg-slate-400'}`} />
                    <p className="font-medium text-slate-950 dark:text-white">{event.title || event.orderNumber}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.customerName || event.customerEmail}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{event.orderStatus}</span>
                    <span>{formatCurrency(event.totalPrice)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(event.eventTime)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Upcoming orders</h2>
            <div className="mt-4 space-y-3">
              {(monthData?.upcomingOrders || []).length === 0 ? (
                <EmptyState message="No upcoming orders were returned for this month." />
              ) : monthData.upcomingOrders.map((order) => (
                <div key={order.orderId} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-950 dark:text-white">{order.orderNumber || order.orderId}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{order.orderStatus}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.customerName || order.customerEmail}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{formatDateTime(order.createdAt)}</span>
                    <span>{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
