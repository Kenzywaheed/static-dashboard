import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/endpoints';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardAPI.getStats(),
    select: (response) => response.data,
  });
};

export const useDashboardReports = () => {
  return useQuery({
    queryKey: ['dashboard', 'reports'],
    queryFn: () => dashboardAPI.getReports(),
    select: (response) => response.data,
  });
};

export const useUsersStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'users-stats'],
    queryFn: () => dashboardAPI.getUsersStats(),
    select: (response) => response.data,
  });
};

export const useTopCategories = () => {
  return useQuery({
    queryKey: ['dashboard', 'top-categories'],
    queryFn: () => dashboardAPI.getTopCategories(),
    select: (response) => response.data,
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['dashboard', 'transactions'],
    queryFn: () => dashboardAPI.getTransactions(),
    select: (response) => response.data,
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

