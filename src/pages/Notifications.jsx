import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';
// import api from '../services/api'; 
import toast from 'react-hot-toast';

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
  });

  // Fetch notifications stats
  const { data: stats } = useQuery({
    queryKey: ['notifications-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/stats');
      return response.data || {};
    },
  });

  // Fetch chart data with auto-refresh
  const { data: chartData = [] } = useQuery({
    queryKey: ['notifications-chart'],
    queryFn: async () => {
      const response = await api.get('/notifications/chart-data');
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-stats']);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['notifications-chart']);
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.user?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'users' && n.type === 'user') ||
      (filter === 'models' && (n.type === 'order' || n.type === 'payment'));
    return matchesSearch && matchesFilter;
  });

  const markAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and view notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-gray-500" />
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount} new</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Notifications</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.total || notifications.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-blue-500">{stats?.unread || unreadCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Read</p>
          <p className="text-2xl font-bold text-green-500">{(stats?.total || notifications.length) - (stats?.unread || unreadCount)}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('users')}
              className={`px-4 py-2 rounded-lg ${filter === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Users
            </button>
            <button
              onClick={() => setFilter('models')}
              className={`px-4 py-2 rounded-lg ${filter === 'models' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Models
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Notifications Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Line type="monotone" dataKey="notifications" stroke="#3B82F6" strokeWidth={2} name="Notifications" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Notifications</h2>
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No notifications found</p>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                  notification.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{notification.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{notification.user}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mt-1"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

