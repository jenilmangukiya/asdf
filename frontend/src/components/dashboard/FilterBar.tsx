import React from 'react';
import { Calendar, Clock, RotateCcw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardFilterState } from '@/types';

export interface FilterBarProps {
  filters: DashboardFilterState;
  onChange: (newFilters: DashboardFilterState) => void;
  onReset: () => void;
}

const PRESET_RANGES = [
  { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  { label: 'Week 1', start: '2026-01-01', end: '2026-01-07' },
  { label: 'Week 2', start: '2026-01-08', end: '2026-01-14' },
  { label: 'Week 3', start: '2026-01-15', end: '2026-01-21' },
  { label: 'Week 4', start: '2026-01-22', end: '2026-01-28' },
  { label: 'Jan 29-31', start: '2026-01-29', end: '2026-01-31' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const handlePresetClick = (start: string, end: string) => {
    onChange({
      ...filters,
      startDate: start,
      endDate: end,
    });
  };

  const handleCutoffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      cutoffRule: e.target.value,
    });
  };

  const handleModeChange = (mode: 'exact' | 'half_hour') => {
    onChange({
      ...filters,
      matchingMode: mode,
    });
  };

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 mb-6 border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Date Filters & Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Delivery Range:</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_RANGES.map((preset) => {
              const active =
                filters.startDate === preset.start && filters.endDate === preset.end;
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.start, preset.end)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Inputs restricted to Jan 2026 */}
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.startDate}
              onChange={(e) =>
                onChange({ ...filters, startDate: e.target.value || '2026-01-01' })
              }
              className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.endDate}
              onChange={(e) =>
                onChange({ ...filters, endDate: e.target.value || '2026-01-31' })
              }
              className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Cutoff & Matching Mode Selection */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Decision Cutoff Selector */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Cutoff:</span>
            <select
              value={filters.cutoffRule}
              onChange={handleCutoffChange}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="day_ahead_1100">Day-Ahead 11:00 GMT (EPEX/Nord Pool Gate Closure)</option>
              <option value="day_ahead_1200">Day-Ahead 12:00 GMT (Midday Benchmark)</option>
              <option value="day_ahead_1700">Day-Ahead 17:00 GMT (Close of Bilateral DA)</option>
              <option value="intraday_4h">Intraday (4 Hours Ahead)</option>
              <option value="gate_closure_1h">Balancing Gate Closure (1 Hour Ahead)</option>
            </select>
          </div>

          {/* Matching Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="px-2 text-slate-400 flex items-center gap-1 text-[11px]">
              <Layers className="w-3 h-3 text-cyan-400" />
              Mode:
            </span>
            <button
              onClick={() => handleModeChange('exact')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filters.matchingMode === 'exact'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Only periods with exact forecast timestamp (Hourly resolution, 744 periods in Jan 2026)"
            >
              Hourly (Exact)
            </button>
            <button
              onClick={() => handleModeChange('half_hour')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filters.matchingMode === 'half_hour'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Extends hourly forecast to both 30-min settlement periods (All 1,488 periods in Jan 2026)"
            >
              Half-Hourly (All SPs)
            </button>
          </div>

          {/* Reset Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            icon={<RotateCcw className="w-3 h-3" />}
            title="Reset filters to default"
          >
            Reset
          </Button>
        </div>

      </div>
    </div>
  );
};
