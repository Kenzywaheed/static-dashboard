import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getCalendarEvents, getOrdersData } from '../services/dashboardMockData';

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

const normalizeDate = (value) => String(value).slice(0, 10);

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

export default function CalendarLite() {
  const [displayDate, setDisplayDate] = useState(new Date(2026, 4, 1));
  const [selectedDate, setSelectedDate] = useState('2026-05-04');

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;

  const { data: events = [] } = useQuery({
    queryKey: ['brand-calendar-events', year, month],
    queryFn: async () => getCalendarEvents(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['brand-orders-calendar-sidebar'],
    queryFn: async () => getOrdersData(),
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
  const upcomingOrders = [...orders].slice(0, 4);

  const cells = [];
  const totalDays = new Date(year, month, 0).getDate();
  const startDay = new Date(year, month - 1, 1).getDay();

  for (let index = 0; index < startDay; index += 1) {
    cells.push(<div key={`empty-${index}`} className="min-h-[110px] rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40" />);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateKey] || [];
    const isSelected = selectedDate === dateKey;

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
          {dayEvents.length > 0 && <span className="text-xs text-slate-400">{dayEvents.length}</span>}
        </div>
        <div className="mt-3 space-y-2">
          {dayEvents.slice(0, 2).map((event) => (
            <div key={`${event.orderId}-${event.eventType}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${eventTypeStyles[event.eventType] || 'bg-slate-400'}`} />
              <span className="truncate">{event.title}</span>
            </div>
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
          A simple monthly view for order events, shipping movement, and customer activity.
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

          <div className="grid grid-cols-7 gap-2">
            {weekdayNames.map((weekday) => (
              <div key={weekday} className="rounded-xl bg-slate-100 p-3 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {weekday}
              </div>
            ))}
            {cells}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Selected day</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedDate}</p>
            <div className="mt-5 space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No events on this day.
                </div>
              ) : selectedEvents.map((event) => (
                <article key={`${event.orderId}-${event.eventType}-${event.eventDate}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${eventTypeStyles[event.eventType] || 'bg-slate-400'}`} />
                    <p className="font-medium text-slate-950 dark:text-white">{event.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.customerEmail}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{event.currentOrderStatus}</span>
                    <span>{formatCurrency(event.totalPrice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Upcoming orders</h2>
            <div className="mt-4 space-y-3">
              {upcomingOrders.map((order) => (
                <div key={order.orderId} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-950 dark:text-white">{order.orderId}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{order.orderStatus}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.customerName}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
