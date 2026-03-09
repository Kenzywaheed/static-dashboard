import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      console.log("Dashboard Stats API Response:", response.data);
      return response.data || {};
    },
    onError: (error) => {
      console.error("Dashboard Stats API Error:", error);
    },
  });
};

export const useDashboardReports = () => {
  return useQuery({
    queryKey: ['dashboard', 'reports'],
    queryFn: async () => {
      const response = await api.get('/dashboard/reports');
      console.log("Dashboard Reports API Response:", response.data);
      return response.data || {};
    },
    onError: (error) => {
      console.error("Dashboard Reports API Error:", error);
    },
  });
};

export const useUsersStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'users-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/users-stats');
      console.log("Dashboard UsersStats API Response:", response.data);
      return response.data || {};
    },
    onError: (error) => {
      console.error("Dashboard UsersStats API Error:", error);
    },
  });
};

export const useTopCategories = () => {
  return useQuery({
    queryKey: ['dashboard', 'top-categories'],
    queryFn: async () => {
      const response = await api.get('/dashboard/top-categories');
      console.log("Dashboard TopCategories API Response:", response.data);
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
    onError: (error) => {
      console.error("Dashboard TopCategories API Error:", error);
    },
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['dashboard', 'transactions'],
    queryFn: async () => {
      const response = await api.get('/dashboard/transactions');
      console.log("Dashboard Transactions API Response:", response.data);
      // Ensure we always return an array
      if (!response.data) return [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    },
    onError: (error) => {
      console.error("Dashboard Transactions API Error:", error);
    },
  });
};

export const useDashboardData = () => {
  const stats = useDashboardStats();
  const reports = useDashboardReports();
  const usersStats = useUsersStats();
  const topCategories = useTopCategories();
  const transactions = useTransactions();

  return {
    stats,
    reports,
    usersStats,
    topCategories,
    transactions,
  };
};

export default useDashboardData;

