import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { MatchedDeliveryRecord } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  formatMW,
  formatDateTimeUTC,
  exportToCsv,
} from '@/lib/utils';

export interface RecordsTableProps {
  records: MatchedDeliveryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onlyMatched: boolean;
  onOnlyMatchedToggle: (val: boolean) => void;
  isLoading?: boolean;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onlyMatched,
  onOnlyMatchedToggle,
  isLoading,
}) => {
  const handleExport = () => {
    const exportData = records.map((r) => ({
      'Delivery Period (UTC)': r.startTime,
      'Settlement Date': r.settlementDate,
      'Settlement Period': r.settlementPeriod,
      'Actual Gen (MW)': r.actualGeneration ?? '',
      'Forecast Gen (MW)': r.forecastGeneration ?? '',
      'Forecast Error (MW)': r.forecastError ?? '',
      'Absolute Error (MW)': r.absError ?? '',
      'Percentage Error (%)': r.percentageError ? `${r.percentageError}%` : '',
      'Forecast Published (UTC)': r.publishTime ?? '',
      'Decision Cutoff (UTC)': r.decisionCutoff ?? '',
      Matched: r.isMatched ? 'YES' : 'NO',
    }));
    exportToCsv(`elexon_wind_accuracy_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      );
    }
    return (
      <span className="text-cyan-400 font-bold ml-1 text-xs shrink-0">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-800">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Detailed Delivery Period Records
            <Badge variant="outline" size="sm">
              {total} Total Records
            </Badge>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Half-hourly settlement periods matched with pre-cutoff WINDFOR publications
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Only Matched Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMatched}
              onChange={(e) => onOnlyMatchedToggle(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span>Only Matched Pairs</span>
          </label>

          {/* Export to CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto mt-4 rounded-lg border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 select-none">
            <tr>
              <th
                onClick={() => onSortChange('startTime')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Delivery Time (UTC)</span>
                  {renderSortIcon('startTime')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('settlementPeriod')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>SP</span>
                  {renderSortIcon('settlementPeriod')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('actualGeneration')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center justify-end gap-1.5 w-full">
                  <span>Actual (MW)</span>
                  {renderSortIcon('actualGeneration')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('forecastGeneration')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center justify-end gap-1.5 w-full">
                  <span>Forecast (MW)</span>
                  {renderSortIcon('forecastGeneration')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('forecastError')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center justify-end gap-1.5 w-full">
                  <span>Error (MW)</span>
                  {renderSortIcon('forecastError')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('absError')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
              >
                <div className="inline-flex items-center justify-end gap-1.5 w-full">
                  <span>Abs Error</span>
                  {renderSortIcon('absError')}
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Forecast Published</th>
              <th className="py-3 px-3 whitespace-nowrap">Decision Cutoff</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  Loading records...
                </td>
              </tr>
            ) : !records.length ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  No records match the current filter selection.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
                const err = r.forecastError;
                const isOver = err !== null && err > 0;
                return (
                  <tr
                    key={r.startTime + idx}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-200 font-sans whitespace-nowrap">
                      {formatDateTimeUTC(r.startTime)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      SP {r.settlementPeriod}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold whitespace-nowrap">
                      {formatMW(r.actualGeneration)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-400 font-semibold whitespace-nowrap">
                      {formatMW(r.forecastGeneration)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        err === null
                          ? 'text-slate-600'
                          : isOver
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {err !== null ? (err > 0 ? `+${formatMW(err)}` : formatMW(err)) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {formatMW(r.absError)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap font-sans">
                      {r.publishTime ? formatDateTimeUTC(r.publishTime) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap font-sans">
                      {r.decisionCutoff ? formatDateTimeUTC(r.decisionCutoff) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {r.isMatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span> No Forecast
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
