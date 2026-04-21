import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const eventTypeStyles = {
  CREATED: 'bg-sky-500',
  PAID: 'bg-emerald-500',
  SHIPPED: 'bg-indigo-500',
  DELIVERED: 'bg-teal-500',
  CANCELLED: 'bg-rose-500',
  PENDING: 'bg-amber-500',
};

const normalizeDate = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const toEventLabel = (event) => event.title || event.eventType || event.currentOrderStatus || 'Order event';

const toEventTone = (event) => {
  const normalized = String(event.eventType || event.currentOrderStatus || '').toUpperCase();
  return eventTypeStyles[normalized] || 'bg-slate-500';
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(Number(value || 0));

export default function CalendarLite() {
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;

  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['brand-calendar-events', year, month],
    queryFn: async () => [],
  });

  const {
    data: orders = [],
  } = useQuery({
    queryKey: ['brand-orders-calendar-sidebar'],
    queryFn: async () => [],
  });

  const eventsByDate = useMemo(() => (
    events.reduce((accumulator, event) => {
      const key = normalizeDate(event.eventDate);
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(event);
      return accumulator;
    }, {})
  ), [events]);

  const selectedEvents = eventsByDate[selectedDate] || [];

  const upcomingOrders = useMemo(() => (
    [...orders]
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
      .slice(0, 6)
  ), [orders]);

  const cells = [];
  const totalDays = new Date(year, month, 0).getDate();
  const startDay = new Date(year, month - 1, 1).getDay();

  for (let index = 0; index < startDay; index += 1) {
    cells.push(
      <div key={`empty-${index}`} className="min-h-[130px] rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40" />,
    );
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateKey] || [];
    const isSelected = selectedDate === dateKey;
    const isToday = dateKey === new Date().toISOString().split('T')[0];

    cells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => setSelectedDate(dateKey)}
        className={`min-h-[130px] rounded-2xl border p-3 text-left transition ${
          isSelected
            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/40 dark:border-[var(--brand-primary)] dark:bg-[var(--brand-primary)]/10'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold ${
            isToday ? 'bg-[var(--brand-primary)] text-white' : 'text-slate-700 dark:text-slate-200'
          }`}>
            {day}
          </span>
          {dayEvents.length > 0 && <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{dayEvents.length} items</span>}
        </div>

        <div className="mt-3 space-y-2">
          {dayEvents.slice(0, 3).map((event) => (
            <div key={`${event.orderId}-${event.eventType}`} className={`rounded-xl px-2.5 py-2 text-xs font-semibold text-white ${toEventTone(event)}`}>
              {toEventLabel(event)}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">+{dayEvents.length - 3} more</p>
          )}
        </div>
      </button>,
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[var(--brand-primary-soft)]/40 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">Schedule view</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Calendar</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              See order events by month so you can spot delivery pressure, cancellations, and shipping flow at a glance.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{monthNames[month - 1]} {year}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Order events will appear here after the order APIs are enabled.</p>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDisplayDate(new Date(year, month - 2, 1))} className="rounded-2xl border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setDisplayDate(new Date(year, month, 1))} className="rounded-2xl border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading calendar events...
            </div>
          ) : isError ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <p className="font-semibold">We could not load the calendar for this month.</p>
              <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-white">
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {weekdayNames.map((weekday) => (
                  <div key={weekday} className="rounded-2xl bg-slate-100 p-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {weekday}
                  </div>
                ))}
                {cells}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {Object.entries(eventTypeStyles).map(([type, className]) => (
                  <div key={type} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className={`h-3 w-3 rounded-full ${className}`} />
                    {type}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Selected day</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedDate}</p>

            <div className="mt-5 space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No order events landed on this day.
                </div>
              ) : selectedEvents.map((event) => (
                <article key={`${event.orderId}-${event.eventType}-${event.eventDate}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">{toEventLabel(event)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{event.eventType || event.currentOrderStatus}</p>
                    </div>
                    <span className={`mt-1 h-3 w-3 rounded-full ${toEventTone(event)}`} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{event.customerEmail || 'Customer email unavailable'}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>{event.currentOrderStatus || 'Status pending'}</span>
                    <span>{formatCurrency(event.totalPrice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent orders</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              A quick list to keep nearby while reviewing the month.
            </p>

            <div className="mt-5 space-y-3">
              {upcomingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Orders will appear here as soon as the brand receives them.
                </div>
              ) : upcomingOrders.map((order) => (
                <div key={order.orderId} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{String(order.orderId).slice(0, 8)}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{order.orderStatus}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{order.customerEmail}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{normalizeDate(order.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
