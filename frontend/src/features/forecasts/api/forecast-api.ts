import { fetchJson } from '@/lib/api-client';
import { ForecastSummary } from '@/types';

export async function fetchForecastSummary(cutoffRule: string): Promise<ForecastSummary> {
  const query = new URLSearchParams({ cutoff_rule: cutoffRule });
  return fetchJson<ForecastSummary>(`/api/v1/forecasts/summary?${query.toString()}`);
}
