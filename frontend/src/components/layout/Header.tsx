import React from 'react';
import { Wind, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataStatusResponse } from '@/types';
import { formatDateTimeUTC } from '@/lib/utils';

export interface HeaderProps {
  statusData?: DataStatusResponse;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statusData,
  isRefreshing,
  onRefresh,
  onOpenMethodology,
}) => {
  const isReady = statusData?.status === 'ready' && statusData?.isCacheWarm;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-bold">
              <Wind className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Wind Power Forecast & Accuracy Dashboard
                </h1>
                <Badge variant="info" size="sm" className="hidden sm:inline-flex">
                  GB Market
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>UK National Wind Power</span>
                <span className="text-slate-600">•</span>
                <span>January 2026 Analysis Period</span>
                <span className="text-slate-600">•</span>
                <a
                  href="https://bmrs.elexon.co.uk/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
                >
                  Source: Elexon BMRS
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </p>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Live Data Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                {isReady ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
              <span className="font-mono text-slate-400">
                Data: {statusData?.lastFetchedAt ? formatDateTimeUTC(statusData.lastFetchedAt) : 'Ready'}
              </span>
            </div>

            {/* Refresh Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              title="Refresh data from Elexon BMRS API"
            >
              Refresh
            </Button>

            {/* Methodology Documentation Trigger */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenMethodology}
              icon={<HelpCircle className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Methodology
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
};
