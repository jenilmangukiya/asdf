import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
} from 'recharts';
import { MatchedDeliveryRecord } from '@/types';
import { formatMW, formatShortDate, formatDateTimeUTC } from '@/lib/utils';
import { Activity } from 'lucide-react';

export interface ForecastVsActualChartProps {
  records: MatchedDeliveryRecord[];
  isLoading?: boolean;
}

export const ForecastVsActualChart: React.FC<ForecastVsActualChartProps> = ({
  records,
  isLoading,
}) => {
  // Prepare formatted chart data
  const chartData = useMemo(() => {
    return records.map((r) => ({
      rawTime: r.startTime,
      timeLabel: formatShortDate(r.startTime),
      actual: r.actualGeneration,
      forecast: r.forecastGeneration,
      error: r.forecastError,
      sp: r.settlementPeriod,
      publishTime: r.publishTime,
    }));
  }, [records]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Activity className="w-8 h-8 animate-pulse text-cyan-400" />
          <span className="text-sm font-medium">Loading time series chart...</span>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="glass-card rounded-xl p-6 h-96 flex items-center justify-center">
        <p className="text-sm text-slate-500">No generation data available for selected filter range.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-slate-800/80 gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Forecast vs Actual Wind Generation (MW)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly / half-hourly national outturn comparison over selected delivery timeline
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500"></span>
            <span className="text-slate-300">Actual Outturn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 border-dashed"></span>
            <span className="text-slate-300">Day-Ahead Forecast</span>
          </div>
        </div>
      </div>

      <div className="h-80 sm:h-96 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
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
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                const err = data.error;
                const isOver = err !== null && err > 0;
                return (
                  <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[240px]">
                    <div className="border-b border-slate-800 pb-1.5">
                      <div className="font-semibold text-white">
                        {formatDateTimeUTC(data.rawTime)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Settlement Period: {data.sp} of 48
                      </div>
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between items-center text-emerald-400">
                        <span className="text-slate-400 font-sans">Actual (FUELHH):</span>
                        <span className="font-bold">{formatMW(data.actual)} MW</span>
                      </div>
                      <div className="flex justify-between items-center text-sky-400">
                        <span className="text-slate-400 font-sans">Forecast (WINDFOR):</span>
                        <span className="font-bold">{formatMW(data.forecast)} MW</span>
                      </div>

                      {err !== null && err !== undefined && (
                        <div
                          className={`flex justify-between items-center pt-1 border-t border-slate-800 ${
                            isOver ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          <span className="text-slate-400 font-sans">Forecast Error:</span>
                          <span className="font-bold">
                            {err > 0 ? `+${formatMW(err)}` : formatMW(err)} MW
                          </span>
                        </div>
                      )}
                    </div>

                    {data.publishTime && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        Forecast Published: {formatDateTimeUTC(data.publishTime)}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Outturn"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#0f172a' }}
              connectNulls={true}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Day-Ahead Forecast"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 4, stroke: '#38bdf8', strokeWidth: 2, fill: '#0f172a' }}
              connectNulls={true}
            />
            <Brush
              dataKey="timeLabel"
              height={26}
              stroke="#38bdf8"
              fill="#090d16"
              tickFormatter={() => ''}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
