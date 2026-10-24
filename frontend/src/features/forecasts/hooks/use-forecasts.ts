import { useQuery } from '@tanstack/react-query';
import { fetchForecastSummary } from '../api/forecast-api';

export function useForecastSummary(cutoffRule: string) {
  return useQuery({
    queryKey: ['forecast-summary', cutoffRule],
    queryFn: () => fetchForecastSummary(cutoffRule),
    staleTime: 5 * 60 * 1000,
  });
}
