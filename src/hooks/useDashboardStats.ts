import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/statsService';

export function useDashboardStats() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  return {
    stats,
    loading: isLoading,
    error,
    refresh: refetch
  };
}
