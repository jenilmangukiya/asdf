import { fetchJson } from '@/lib/api-client';
import {
  AccuracySummary,
  TimeseriesResponse,
  PaginatedRecordsResponse,
  DataStatusResponse,
} from '@/types';

export interface AccuracyQueryParams {
  startDate: string;
  endDate: string;
  cutoffRule: string;
  matchingMode: 'exact' | 'half_hour';
}

export async function fetchAccuracySummary(params: AccuracyQueryParams): Promise<AccuracySummary> {
  const query = new URLSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    cutoff_rule: params.cutoffRule,
    matching_mode: params.matchingMode,
  });
  return fetchJson<AccuracySummary>(`/api/v1/accuracy/summary?${query.toString()}`);
}

export async function fetchAccuracyTimeseries(params: AccuracyQueryParams): Promise<TimeseriesResponse> {
  const query = new URLSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    cutoff_rule: params.cutoffRule,
    matching_mode: params.matchingMode,
  });
  return fetchJson<TimeseriesResponse>(`/api/v1/accuracy/timeseries?${query.toString()}`);
}

export interface RecordsQueryParams extends AccuracyQueryParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onlyMatched?: boolean;
}

export async function fetchPaginatedRecords(params: RecordsQueryParams): Promise<PaginatedRecordsResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
    start_date: params.startDate,
    end_date: params.endDate,
    cutoff_rule: params.cutoffRule,
    matching_mode: params.matchingMode,
    sort_by: params.sortBy || 'startTime',
    sort_order: params.sortOrder || 'asc',
    only_matched: String(params.onlyMatched ?? false),
  });
  return fetchJson<PaginatedRecordsResponse>(`/api/v1/accuracy/records?${query.toString()}`);
}

export async function fetchDataStatus(): Promise<DataStatusResponse> {
  return fetchJson<DataStatusResponse>('/api/v1/data-status');
}

export async function refreshDataStatus(): Promise<{ status: string; details: any }> {
  return fetchJson<{ status: string; details: any }>('/api/v1/data-status/refresh?force=true', {
    method: 'POST',
  });
}
