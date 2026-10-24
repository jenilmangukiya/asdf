export interface MatchedDeliveryRecord {
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualGeneration: number | null;
  forecastGeneration: number | null;
  forecastError: number | null;
  absError: number | null;
  percentageError: number | null;
  publishTime: string | null;
  decisionCutoff: string | null;
  isMatched: boolean;
}

export interface AccuracySummary {
  mae: number;
  rmse: number;
  mbe: number;
  nmaePercent: number | null;
  matchedCount: number;
  totalDeliveryPeriods: number;
  missingActualCount: number;
  missingForecastCount: number;
  meanActualGeneration: number;
  meanForecastGeneration: number;
  totalActualEnergyGWh: number;
  totalForecastEnergyGWh: number;
  maxOverforecastMW: number;
  maxUnderforecastMW: number;
  cutoffRule: string;
  cutoffRuleDescription: string;
  matchingMode: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ForecastSummary {
  totalForecastRecords: number;
  uniqueDeliveryPeriods: number;
  firstPublishTime: string | null;
  lastPublishTime: string | null;
  meanForecastMW: number;
  maxForecastMW: number;
  minForecastMW: number;
  cutoffRule: string;
}

export interface DataStatusResponse {
  status: 'ready' | 'fetching' | 'uninitialized' | 'error';
  elexonConnected: boolean;
  lastFetchedAt: string | null;
  fuelhhRecordsCached: number;
  windforRecordsCached: number;
  analysisPeriodStart: string;
  analysisPeriodEnd: string;
  cacheTtlHours: number;
  isCacheWarm: boolean;
  message: string | null;
}

export interface TimeseriesResponse {
  count: number;
  unit: string;
  resolution: string;
  cutoffRule: string;
  matchingMode: string;
  records: MatchedDeliveryRecord[];
}

export interface PaginatedRecordsResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: MatchedDeliveryRecord[];
}

export interface DashboardFilterState {
  startDate: string;
  endDate: string;
  cutoffRule: string;
  matchingMode: 'exact' | 'half_hour';
}
