import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccuracySummary,
  fetchAccuracyTimeseries,
  fetchPaginatedRecords,
  fetchDataStatus,
  refreshDataStatus,
  AccuracyQueryParams,
  RecordsQueryParams,
} from '../api/accuracy-api';

export function useAccuracySummary(params: AccuracyQueryParams) {
  return useQuery({
    queryKey: ['accuracy-summary', params],
    queryFn: () => fetchAccuracySummary(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useAccuracyTimeseries(params: AccuracyQueryParams) {
  return useQuery({
    queryKey: ['accuracy-timeseries', params],
    queryFn: () => fetchAccuracyTimeseries(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function usePaginatedRecords(params: RecordsQueryParams) {
  return useQuery({
    queryKey: ['accuracy-records', params],
    queryFn: () => fetchPaginatedRecords(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useDataStatus() {
  return useQuery({
    queryKey: ['data-status'],
    queryFn: fetchDataStatus,
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useRefreshData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshDataStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
