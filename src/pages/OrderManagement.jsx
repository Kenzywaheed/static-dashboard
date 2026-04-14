import { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'dashboard-mock-orders';
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const initialOrders = [
  { id: 'ORD-24041', customer: 'Lina Hassan', total: 184.5, profit: 36.9, items: 3, city: 'Cairo', paymentMethod: 'Visa', created: '2026-04-08', deliveryDate: '2026-04-10', priority: 'normal', status: 'delivered' },
  { id: 'ORD-24042', customer: 'Omar Adel', total: 92, profit: 18.4, items: 1, city: 'Giza', paymentMethod: 'Cash on delivery', created: '2026-04-11', deliveryDate: '2026-04-15', priority: 'high', status: 'processing' },
  { id: 'ORD-24043', customer: 'Salma Nabil', total: 255.99, profit: 57.75, items: 5, city: 'Alexandria', paymentMethod: 'Mastercard', created: '2026-04-12', deliveryDate: '2026-04-17', priority: 'urgent', status: 'pending' },
  { id: 'ORD-24044', customer: 'Youssef Magdy', total: 148.75, profit: 29.75, items: 2, city: 'Mansoura', paymentMethod: 'Instapay', created: '2026-04-13', deliveryDate: '2026-04-16', priority: 'normal', status: 'shipped' },
  { id: 'ORD-24045', customer: 'Mariam Tarek', total: 67.25, profit: 10.1, items: 1, city: 'Tanta', paymentMethod: 'Wallet', created: '2026-04-13', deliveryDate: '2026-04-18', priority: 'low', status: 'cancelled' },
  { id: 'ORD-24046', customer: 'Nour Mostafa', total: 319.4, profit: 73.45, items: 6, city: 'Cairo', paymentMethod: 'Visa', created: '2026-04-14', deliveryDate: '2026-04-19', priority: 'urgent', status: 'processing' },
];

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

const priorityStyles = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-teal-100 text-teal-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-rose-100 text-rose-800',
};
