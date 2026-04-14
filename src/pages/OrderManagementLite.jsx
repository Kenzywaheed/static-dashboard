import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'dashboard-mock-orders';
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const seedOrders = [
  { id: 'ORD-24041', customer: 'Lina Hassan', total: 184.5, profit: 36.9, items: 3, city: 'Cairo', paymentMethod: 'Visa', created: '2026-04-08', deliveryDate: '2026-04-10', priority: 'normal', status: 'delivered' },
  { id: 'ORD-24042', customer: 'Omar Adel', total: 92, profit: 18.4, items: 1, city: 'Giza', paymentMethod: 'Cash on delivery', created: '2026-04-11', deliveryDate: '2026-04-15', priority: 'high', status: 'processing' },
  { id: 'ORD-24043', customer: 'Salma Nabil', total: 255.99, profit: 57.75, items: 5, city: 'Alexandria', paymentMethod: 'Mastercard', created: '2026-04-12', deliveryDate: '2026-04-17', priority: 'urgent', status: 'pending' },
  { id: 'ORD-24044', customer: 'Youssef Magdy', total: 148.75, profit: 29.75, items: 2, city: 'Mansoura', paymentMethod: 'Instapay', created: '2026-04-13', deliveryDate: '2026-04-16', priority: 'normal', status: 'shipped' },
  { id: 'ORD-24045', customer: 'Mariam Tarek', total: 67.25, profit: 10.1, items: 1, city: 'Tanta', paymentMethod: 'Wallet', created: '2026-04-13', deliveryDate: '2026-04-18', priority: 'low', status: 'cancelled' },
  { id: 'ORD-24046', customer: 'Nour Mostafa', total: 319.4, profit: 73.45, items: 6, city: 'Cairo', paymentMethod: 'Visa', created: '2026-04-14', deliveryDate: '2026-04-19', priority: 'urgent', status: 'processing' },
  { id: 'ORD-24047', customer: 'Karim Samer', total: 141.2, profit: 31.06, items: 2, city: 'Zagazig', paymentMethod: 'Cash on delivery', created: '2026-04-14', deliveryDate: '2026-04-20', priority: 'high', status: 'pending' },
  { id: 'ORD-24048', customer: 'Farah Wael', total: 210.65, profit: 46.34, items: 4, city: 'Cairo', paymentMethod: 'Wallet', created: '2026-04-15', deliveryDate: '2026-04-18', priority: 'normal', status: 'shipped' },
];

const loadOrders = () => {
  const savedOrders = localStorage.getItem(STORAGE_KEY);

  if (!savedOrders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }

  try {
    const parsedOrders = JSON.parse(savedOrders);

    if (!Array.isArray(parsedOrders) || parsedOrders.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
      return seedOrders;
    }

    return parsedOrders;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }
};

const saveOrders = (orders) => localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export default function OrderManagementLite() {
  const [orders, setOrders] = useState(loadOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    total: '',
    city: 'Cairo',
    items: 1,
    paymentMethod: 'Cash on delivery',
    deliveryDate: '',
    priority: 'normal',
  });

  const rows = useMemo(
    () =>
      orders.filter(
        (order) =>
          `${order.id} ${order.customer} ${order.city}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (statusFilter === 'all' || order.status === statusFilter) &&
          (priorityFilter === 'all' || order.priority === priorityFilter)
      ),
    [orders, priorityFilter, searchQuery, statusFilter]
  );

  const persistOrders = (nextOrders) => {
    setOrders(nextOrders);
    saveOrders(nextOrders);
  };

  const addOrder = (event) => {
    event.preventDefault();

    const nextId = Math.max(...orders.map((order) => Number(order.id.replace('ORD-', ''))), 24040) + 1;
    const total = Number(form.total);

    persistOrders([
      {
        id: `ORD-${nextId}`,
        customer: form.customer,
        total,
        profit: Number((total * 0.22).toFixed(2)),
        items: Number(form.items),
        city: form.city,
        paymentMethod: form.paymentMethod,
        created: new Date().toISOString().split('T')[0],
        deliveryDate: form.deliveryDate || new Date(Date.now() + 172800000).toISOString().split('T')[0],
        priority: form.priority,
        status: 'pending',
      },
      ...orders,
    ]);

    setIsModalOpen(false);
    setForm({
      customer: '',
      total: '',
      city: 'Cairo',
      items: 1,
      paymentMethod: 'Cash on delivery',
      deliveryDate: '',
      priority: 'normal',
    });
    toast.success('Order created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Mock orders with local persistence.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white">
          <PlusIcon className="h-5 w-5" />
          Add Order
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{money(orders.reduce((sum, order) => sum + order.total, 0))}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{orders.filter((order) => ['pending', 'processing'].includes(order.status)).length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Delivery</p>
          <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{orders.filter((order) => ['shipped', 'delivered'].includes(order.status)).length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Urgent</p>
          <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{orders.filter((order) => order.priority === 'urgent').length}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="all">All Status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="all">All Priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Delivery</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    <div>{order.customer}</div>
                    <div className="text-xs text-gray-500">
                      {order.city} • {order.items} items • {order.priority}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{order.deliveryDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    <div>{money(order.total)}</div>
                    <div className="text-xs text-gray-500">Profit {money(order.profit)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(event) => {
                        persistOrders(orders.map((currentOrder) => (currentOrder.id === order.id ? { ...currentOrder, status: event.target.value } : currentOrder)));
                        toast.success('Status updated');
                      }}
                      className="rounded-full px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this order?')) {
                          persistOrders(orders.filter((currentOrder) => currentOrder.id !== order.id));
                          toast.success('Order deleted');
                        }
                      }}
                      className="text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Add New Order</h2>
            <form onSubmit={addOrder} className="grid gap-4 md:grid-cols-2">
              <input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} placeholder="Customer" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
              <input type="number" step="0.01" value={form.total} onChange={(event) => setForm({ ...form, total: event.target.value })} placeholder="Total" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="City" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
              <input type="number" min="1" value={form.items} onChange={(event) => setForm({ ...form, items: event.target.value })} placeholder="Items" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
              <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option>Cash on delivery</option>
                <option>Visa</option>
                <option>Mastercard</option>
                <option>Wallet</option>
                <option>Instapay</option>
              </select>
              <input type="date" value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <div className="flex flex-wrap gap-2 md:col-span-2">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setForm({ ...form, priority })}
                    className={`rounded-full px-4 py-2 text-sm ${form.priority === priority ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 md:col-span-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white">
                  Add Order
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
