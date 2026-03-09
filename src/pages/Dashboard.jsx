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
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

// Loading skeleton component
const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

const ReportSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded"></div>
  </div>
);

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard stats with improved error handling
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      console.log("Dashboard API Response (stats):", response.data);
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Dashboard API Error (stats):", error);
    },
  });

  // Fetch reports
  const { 
    data: reportsData, 
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const response = await api.get('/dashboard/reports');
      console.log("Dashboard API Response (reports):", response.data);
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Dashboard API Error (reports):", error);
    },
  });

  // Fetch top categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const response = await api.get('/dashboard/top-categories');
      console.log("Dashboard API Response (categories):", response.data);
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Dashboard API Error (categories):", error);
    },
  });

  // Fetch users stats
  const { 
    data: usersStatsData, 
    isLoading: usersStatsLoading,
    error: usersStatsError,
    refetch: refetchUsersStats
  } = useQuery({
    queryKey: ['dashboard-users-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/users-stats');
      console.log("Dashboard API Response (users-stats):", response.data);
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Dashboard API Error (users-stats):", error);
    },
  });

  // Fetch transactions
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const response = await api.get('/dashboard/transactions');
      console.log("Dashboard API Response (transactions):", response.data);
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Dashboard API Error (transactions):", error);
    },
  });

  // Determine if any query has an error
  const anyError = statsError || reportsError || categoriesError || usersStatsError || transactionsError;
  
  // Determine if any data is loading
  const isLoading = statsLoading || reportsLoading || categoriesLoading || usersStatsLoading || transactionsLoading;

  // Safe data extraction with fallbacks
  const safeStatsData = statsData || {};
  const safeReportsData = reportsData || {};
  const safeCategoriesData = Array.isArray(categoriesData) ? categoriesData : [];
  const safeUsersStatsData = usersStatsData?.perMinute || [];
  const safeTransactionsData = Array.isArray(transactionsData) ? transactionsData : [];

  const stats = [
    { name: 'Total Sales', value: `$${(safeStatsData.totalSales || 0).toLocaleString()}`, icon: CurrencyDollarIcon, color: 'bg-blue-500' },
    { name: 'Total Orders', value: (safeStatsData.totalOrders || 0).toLocaleString(), icon: ShoppingCartIcon, color: 'bg-green-500' },
    { name: 'Discounted Amount', value: `$${(safeStatsData.discountedAmount || 0).toLocaleString()}`, icon: TagIcon, color: 'bg-purple-500' },
    { name: 'Total Costs', value: `$${(safeStatsData.totalCosts || 0).toLocaleString()}`, icon: UserGroupIcon, color: 'bg-orange-500' },
  ];

  const reports = [
    { label: 'Customers', value: (safeReportsData.customers || 0).toLocaleString() },
    { label: 'Total Products', value: (safeReportsData.totalProducts || 0).toLocaleString() },
    { label: 'Stock Products', value: (safeReportsData.stockProducts || 0).toLocaleString() },
    { label: 'Out of Stock', value: (safeReportsData.outOfStock || 0).toLocaleString() },
    { label: 'Revenue', value: `$${(safeReportsData.revenue || 0).toLocaleString()}` },
  ];

  // Fallback categories if API fails
  const defaultCategories = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 28 },
    { name: 'Home & Garden', value: 20 },
    { name: 'Sports', value: 12 },
    { name: 'Others', value: 5 },
  ];

  const topCategories = safeCategoriesData.length > 0 ? safeCategoriesData : defaultCategories;

  // Fallback users stats if API fails
  const defaultUsersStats = [
    { time: '10:00', users: 45 },
    { time: '10:05', users: 52 },
    { time: '10:10', users: 48 },
    { time: '10:15', users: 65 },
    { time: '10:20', users: 72 },
    { time: '10:25', users: 68 },
    { time: '10:30', users: 85 },
  ];

  const usersStats = safeUsersStatsData.length > 0 ? safeUsersStatsData : defaultUsersStats;

  // Fallback transactions if API fails
  const defaultTransactions = [
    { id: 'ORD-001', customer: 'John Doe', date: '2024-01-15', amount: '$125.00', status: 'Completed' },
    { id: 'ORD-002', customer: 'Jane Smith', date: '2024-01-15', amount: '$89.99', status: 'Processing' },
    { id: 'ORD-003', customer: 'Mike Johnson', date: '2024-01-14', amount: '$250.00', status: 'Completed' },
    { id: 'ORD-004', customer: 'Sarah Williams', date: '2024-01-14', amount: '$45.00', status: 'Pending' },
    { id: 'ORD-005', customer: 'Tom Brown', date: '2024-01-13', amount: '$175.50', status: 'Completed' },
  ];

  const transactions = safeTransactionsData.length > 0 ? safeTransactionsData : defaultTransactions;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch all data using refetch methods
      await Promise.all([
        refetchStats(),
        refetchReports(),
        refetchCategories(),
        refetchUsersStats(),
        refetchTransactions(),
      ]);
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error("Dashboard refresh error:", error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Show error state with friendly UI
  if (anyError && !isLoading) {
    return (
      <div className="p-6 space-y-6">
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

        {/* Friendly Error Message */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                Unable to Load Dashboard Data
              </h3>
              <p className="mt-2 text-amber-700 dark:text-amber-300">
                We couldn't connect to the server. This might be because:
              </p>
              <ul className="mt-2 list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
                <li>The server is not running (make sure port 3001 is active)</li>
                <li>Network connection issues</li>
                <li>Authentication token may have expired</li>
              </ul>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Show partial data with fallback values */}
        <div className="space-y-6">
          {/* Stats Cards with fallback */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reports with fallback */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reports</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {reports.map((report, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{report.label}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{report.value}</p>
                </div>
              ))}
            </div>
          </div>
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Section */}
      {isLoading ? (
        <ReportSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {reports.map((report, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">{report.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{report.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Categories */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
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
        )}

        {/* Users Stats */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
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
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Last Transactions</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;

