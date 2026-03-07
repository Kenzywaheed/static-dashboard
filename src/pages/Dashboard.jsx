import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TagIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const response = await api.get('/dashboard/reports');
      return response.data;
    },
  });

  // Fetch top categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const response = await api.get('/dashboard/top-categories');
      return response.data;
    },
  });

  // Fetch users stats
  const { data: usersStatsData, isLoading: usersStatsLoading } = useQuery({
    queryKey: ['dashboard-users-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/users-stats');
      return response.data;
    },
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const response = await api.get('/dashboard/transactions');
      return response.data;
    },
  });

  const stats = statsData ? [
    { name: 'Total Sales', value: `$${statsData.totalSales?.toLocaleString() || 0}`, icon: CurrencyDollarIcon, color: 'bg-blue-500' },
    { name: 'Total Orders', value: statsData.totalOrders?.toLocaleString() || 0, icon: ShoppingCartIcon, color: 'bg-green-500' },
    { name: 'Discounted Amount', value: `$${statsData.discountedAmount?.toLocaleString() || 0}`, icon: TagIcon, color: 'bg-purple-500' },
    { name: 'Total Costs', value: `$${statsData.totalCosts?.toLocaleString() || 0}`, icon: UserGroupIcon, color: 'bg-orange-500' },
  ] : [
    { name: 'Total Sales', value: '$0', icon: CurrencyDollarIcon, color: 'bg-blue-500' },
    { name: 'Total Orders', value: '0', icon: ShoppingCartIcon, color: 'bg-green-500' },
    { name: 'Discounted Amount', value: '$0', icon: TagIcon, color: 'bg-purple-500' },
    { name: 'Total Costs', value: '$0', icon: UserGroupIcon, color: 'bg-orange-500' },
  ];

  const reports = reportsData ? [
    { label: 'Customers', value: reportsData.customers?.toLocaleString() || 0 },
    { label: 'Total Products', value: reportsData.totalProducts?.toLocaleString() || 0 },
    { label: 'Stock Products', value: reportsData.stockProducts?.toLocaleString() || 0 },
    { label: 'Out of Stock', value: reportsData.outOfStock?.toLocaleString() || 0 },
    { label: 'Revenue', value: `$${reportsData.revenue?.toLocaleString() || 0}` },
  ] : [
    { label: 'Customers', value: '0' },
    { label: 'Total Products', value: '0' },
    { label: 'Stock Products', value: '0' },
    { label: 'Out of Stock', value: '0' },
    { label: 'Revenue', value: '$0' },
  ];

  const topCategories = categoriesData || [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 28 },
    { name: 'Home & Garden', value: 20 },
    { name: 'Sports', value: 12 },
    { name: 'Others', value: 5 },
  ];

  const usersStats = usersStatsData?.perMinute || [
    { time: '10:00', users: 45 },
    { time: '10:05', users: 52 },
    { time: '10:10', users: 48 },
    { time: '10:15', users: 65 },
    { time: '10:20', users: 72 },
    { time: '10:25', users: 68 },
    { time: '10:30', users: 85 },
  ];

  const transactions = transactionsData || [
    { id: 'ORD-001', customer: 'John Doe', date: '2024-01-15', amount: '$125.00', status: 'Completed' },
    { id: 'ORD-002', customer: 'Jane Smith', date: '2024-01-15', amount: '$89.99', status: 'Processing' },
    { id: 'ORD-003', customer: 'Mike Johnson', date: '2024-01-14', amount: '$250.00', status: 'Completed' },
    { id: 'ORD-004', customer: 'Sarah Williams', date: '2024-01-14', amount: '$45.00', status: 'Pending' },
    { id: 'ORD-005', customer: 'Tom Brown', date: '2024-01-13', amount: '$175.50', status: 'Completed' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch all data
      await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/reports'),
        api.get('/dashboard/top-categories'),
        api.get('/dashboard/users-stats'),
        api.get('/dashboard/transactions'),
      ]);
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = statsLoading || reportsLoading || categoriesLoading || usersStatsLoading || transactionsLoading;

  if (statsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Failed to load dashboard data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{isLoading ? '...' : stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {reports.map((report, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{report.label}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{isLoading ? '...' : report.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Selling Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Users Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Users per Minute</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Last Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">
                    {typeof transaction.amount === 'number' 
                      ? `$${transaction.amount.toFixed(2)}` 
                      : transaction.amount || '$0.00'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

