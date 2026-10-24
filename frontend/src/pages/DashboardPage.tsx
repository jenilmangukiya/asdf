import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MethodologyModal } from '@/components/dashboard/MethodologyModal';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { ForecastVsActualChart } from '@/components/charts/ForecastVsActualChart';
import { ForecastErrorChart } from '@/components/charts/ForecastErrorChart';
import { RecordsTable } from '@/components/tables/RecordsTable';
import {
  useAccuracySummary,
  useAccuracyTimeseries,
  usePaginatedRecords,
  useDataStatus,
  useRefreshData,
} from '@/features/accuracy/hooks/use-accuracy';
import { DashboardFilterState } from '@/types';
import { formatMW, formatGWh, formatPercent } from '@/lib/utils';
import { AlertCircle, TrendingUp, TrendingDown, Layers, Zap } from 'lucide-react';

const INITIAL_FILTERS: DashboardFilterState = {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  cutoffRule: 'day_ahead_1100',
  matchingMode: 'exact',
};

export const DashboardPage: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [onlyMatched, setOnlyMatched] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Queries
  const { data: statusData } = useDataStatus();
  const refreshMutation = useRefreshData();

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useAccuracySummary(filters);

  const {
    data: timeseriesData,
    isLoading: isTimeseriesLoading,
  } = useAccuracyTimeseries(filters);

  const {
    data: paginatedData,
    isLoading: isRecordsLoading,
  } = usePaginatedRecords({
    ...filters,
    page,
    pageSize,
    sortBy,
    sortOrder,
    onlyMatched,
  });

  const handleFilterChange = (newFilters: DashboardFilterState) => {
    setFilters(newFilters);
    setPage(1); // reset to page 1 on filter changes
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setPageSize(10);
    setSortBy('startTime');
    setSortOrder('asc');
    setOnlyMatched(false);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const isOverforecast = (summaryData?.mbe ?? 0) > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Application Navigation Header */}
      <Header
        statusData={statusData}
        isRefreshing={refreshMutation.isPending}
        onRefresh={() => refreshMutation.mutate()}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* API Error Notification if any */}
        {summaryError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Error loading accuracy metrics</h4>
              <p className="text-xs text-rose-300/90 mt-1">
                {(summaryError as any)?.message || 'Failed to reach API server. Check if backend is running on port 8000.'}
              </p>
            </div>
          </div>
        )}

        {/* Key KPI Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: MAE */}
          <MetricCard
            title="Mean Absolute Error (MAE)"
            value={formatMW(summaryData?.mae)}
            unit="MW"
            accentColor="cyan"
            isLoading={isSummaryLoading}
            tooltip="Average absolute volumetric deviation between forecast and actual generation across valid matched delivery periods."
            subtitle={
              summaryData?.nmaePercent !== null && summaryData?.nmaePercent !== undefined
                ? `Normalized MAE: ${formatPercent(summaryData.nmaePercent)} of avg generation`
                : undefined
            }
            badge={<Badge variant="info">Expected Error</Badge>}
          />

          {/* Card 2: RMSE */}
          <MetricCard
            title="Root Mean Squared Error"
            value={formatMW(summaryData?.rmse)}
            unit="MW"
            accentColor="slate"
            isLoading={isSummaryLoading}
            tooltip="Quadratic scoring metric that heavily penalizes extreme forecast errors. Essential for measuring imbalance risk exposure."
            subtitle="Heavily penalizes large outlier misses"
            badge={<Badge variant="outline">Outlier Penalty</Badge>}
          />

          {/* Card 3: MBE */}
          <MetricCard
            title="Mean Bias Error (MBE)"
            value={
              summaryData?.mbe !== undefined
                ? `${summaryData.mbe > 0 ? '+' : ''}${formatMW(summaryData.mbe)}`
                : '—'
            }
            unit="MW"
            accentColor={isOverforecast ? 'amber' : 'rose'}
            isLoading={isSummaryLoading}
            tooltip="Average directional bias: Forecast − Actual. Positive indicates overforecasting (surplus bought); negative indicates underforecasting (deficit)."
            subtitle={
              isOverforecast
                ? 'Tendency to overestimate wind power'
                : 'Tendency to underestimate wind power'
            }
            badge={
              isOverforecast ? (
                <Badge variant="warning">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Overforecast (+)
                </Badge>
              ) : (
                <Badge variant="danger">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Underforecast (−)
                </Badge>
              )
            }
          />

          {/* Card 4: Matched Coverage */}
          <MetricCard
            title="Delivery Periods Matched"
            value={`${summaryData?.matchedCount ?? 0} / ${summaryData?.totalDeliveryPeriods ?? 0}`}
            accentColor="emerald"
            isLoading={isSummaryLoading}
            tooltip="Number of delivery periods having an eligible forecast published prior to the decision cutoff and valid metered actual generation."
            subtitle={
              filters.matchingMode === 'exact'
                ? 'Exact hourly periods (WINDFOR native resolution)'
                : 'Full half-hourly settlement coverage (48 SP/day)'
            }
            badge={
              <Badge variant="success">
                <Layers className="w-3 h-3 mr-0.5" />
                {summaryData?.totalDeliveryPeriods
                  ? `${Math.round(((summaryData?.matchedCount ?? 0) / summaryData.totalDeliveryPeriods) * 100)}% Matched`
                  : '100%'}
              </Badge>
            }
          />
        </section>

        {/* Secondary Context Row: Energy Volume Totals */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Actual Energy Outturn</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatGWh(summaryData?.totalActualEnergyGWh)} <span className="text-xs font-sans text-slate-400">GWh</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Mean: {formatMW(summaryData?.meanActualGeneration)} MW
              </span>
            </div>
            <Zap className="w-6 h-6 text-emerald-400/50" />
          </div>

          <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Forecast Energy Volume</span>
              <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                {formatGWh(summaryData?.totalForecastEnergyGWh)} <span className="text-xs font-sans text-slate-400">GWh</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Mean: {formatMW(summaryData?.meanForecastGeneration)} MW
              </span>
            </div>
            <Zap className="w-6 h-6 text-sky-400/50" />
          </div>

          <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Peak Over / Under Error</span>
              <div className="text-sm font-bold font-mono mt-0.5 flex items-center gap-2">
                <span className="text-amber-400">+{formatMW(summaryData?.maxOverforecastMW)} MW</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">{formatMW(summaryData?.maxUnderforecastMW)} MW</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Extreme deviation extremes across period
              </span>
            </div>
            <AlertCircle className="w-6 h-6 text-slate-500/50" />
          </div>
        </section>

        {/* Charts Section */}
        <section className="space-y-6 mb-6">
          {/* Chart 1: Time Series Forecast vs Actual */}
          <ForecastVsActualChart
            records={timeseriesData?.records || []}
            isLoading={isTimeseriesLoading}
          />

          {/* Chart 2: Forecast Error Bar Chart */}
          <ForecastErrorChart
            records={timeseriesData?.records || []}
            isLoading={isTimeseriesLoading}
          />
        </section>

        {/* Detailed Table Section */}
        <section className="mb-6">
          <RecordsTable
            records={paginatedData?.records || []}
            total={paginatedData?.total || 0}
            page={page}
            pageSize={pageSize}
            totalPages={paginatedData?.totalPages || 1}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onlyMatched={onlyMatched}
            onOnlyMatchedToggle={setOnlyMatched}
            isLoading={isRecordsLoading}
          />
        </section>

      </main>

      {/* Footer */}
      <Footer />

      {/* Methodology & Market Guide Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
