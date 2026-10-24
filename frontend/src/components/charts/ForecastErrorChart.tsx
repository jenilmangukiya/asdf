import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { MatchedDeliveryRecord } from '@/types';
import { formatMW, formatShortDate, formatDateTimeUTC } from '@/lib/utils';

export interface ForecastErrorChartProps {
  records: MatchedDeliveryRecord[];
  isLoading?: boolean;
}

export const ForecastErrorChart: React.FC<ForecastErrorChartProps> = ({
  records,
  isLoading,
}) => {
  const chartData = useMemo(() => {
    return records
      .filter((r) => r.isMatched && r.forecastError !== null)
      .map((r) => ({
        rawTime: r.startTime,
        timeLabel: formatShortDate(r.startTime),
        error: r.forecastError,
        absError: r.absError,
        sp: r.settlementPeriod,
        isOver: (r.forecastError ?? 0) > 0,
      }));
  }, [records]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 h-72 flex items-center justify-center">
        <div className="animate-pulse text-sm text-slate-500">Loading forecast error chart...</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="glass-card rounded-xl p-6 h-72 flex items-center justify-center">
        <p className="text-sm text-slate-500">No error data available for current selection.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-slate-800/80 gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Forecast Error Distribution (MW)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Error = Forecast − Actual. Overforecasts (+) indicate surplus generation booked; Underforecasts (−) indicate deficit.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="text-slate-300">Overforecast (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span className="text-slate-300">Underforecast (−)</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 15, left: 10, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                const err = data.error;
                const isOver = err > 0;
                return (
                  <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                    <div className="font-semibold text-white">
                      {formatDateTimeUTC(data.rawTime)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Settlement Period: {data.sp}
                    </div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        isOver ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {err > 0 ? `+${formatMW(err)}` : formatMW(err)} MW
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      {isOver
                        ? 'Overforecast: Output lower than predicted (Overbought volume)'
                        : 'Underforecast: Output higher than predicted (Underbought volume)'}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="error" maxBarSize={12} radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOver ? '#f59e0b' : '#ef4444'}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
