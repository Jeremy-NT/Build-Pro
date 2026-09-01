import { useQuery } from '@tanstack/react-query';
import { getDashboardKpis } from '../services/dashboardService';

export const dashboardQueryKeys = {
  kpis: (userId?: string) => ['dashboardKPIs', userId] as const,
};

export const useDashboardKpisQuery = (userId?: string) =>
  useQuery({
    queryKey: dashboardQueryKeys.kpis(userId),
    queryFn: () => getDashboardKpis(userId as string),
    enabled: !!userId,
  });
