import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2 } from 'lucide-react';

export interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Methodology, Market Timeline & Mathematical Definitions"
      description="UK Wholesale Day-Ahead Electricity Trading & Elexon Wind Accuracy Framework"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-slate-300 text-xs sm:text-sm">
        
        {/* Section 1: Business Context */}
        <div>
          <h3 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
            1. Business Context: Day-Ahead Wholesale Electricity Purchasing
          </h3>
          <p className="leading-relaxed">
            In Great Britain's wholesale electricity market, utilities and electricity suppliers
            must procure physical electricity ahead of time to meet expected customer demand.
            Because wind power is weather-dependent and has near-zero marginal operating cost,
            accurate wind volume forecasting is essential for trading desks to hedge physical
            imbalances, determine optimal bid volumes, and mitigate costly imbalance cashout exposure
            in the Balancing Mechanism.
          </p>
        </div>

        {/* Section 2: Official Elexon BMRS Datasets */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            2. Official Elexon BMRS Data Sources
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 font-bold whitespace-nowrap">FUELHH/stream:</span>
              <span>
                Half-Hourly Generation Outturn by Fuel Type. Filtered strictly to{' '}
                <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">fuelType = WIND</code>.
                Provides the true metered delivery generation (MW) at 30-minute settlement period resolution
                (48 periods per calendar day in January 2026, totaling 1,488 half-hours).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-sky-400 font-bold whitespace-nowrap">WINDFOR/stream:</span>
              <span>
                Wind Generation Forecast Stream submitted to BMRS. Contains target delivery start time
                (<code className="bg-slate-800 px-1 py-0.5 rounded">startTime</code>), publication timestamp
                (<code className="bg-slate-800 px-1 py-0.5 rounded">publishTime</code>), and predicted generation
                in MW (<code className="bg-slate-800 px-1 py-0.5 rounded">generation</code>).
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: Forecast Selection Rule */}
        <div>
          <h3 className="text-base font-bold text-cyan-400 mb-2">
            3. Decision Cutoff & Forecast Selection Rule
          </h3>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-900/40 space-y-3">
            <p className="leading-relaxed">
              <strong>The Golden Rule:</strong> Never evaluate purchasing decisions using forecasts
              published after the relevant decision cutoff. In physical trading, a buyer can only act on
              information known before gate closure.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-white mb-1">
                  Day-Ahead 11:00 GMT (EPEX SPOT / Nord Pool)
                </div>
                <p className="text-slate-400">
                  GB Day-Ahead power auction gate closure occurs at 11:00 GMT on day D-1.
                  For any delivery period on Day D, only forecasts published strictly on or before
                  <code className="text-cyan-300 ml-1">D-1 11:00:00 UTC</code> are eligible.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-white mb-1">Selection Algorithm</div>
                <p className="text-slate-400">
                  Among all eligible forecasts satisfying <code className="text-cyan-300">publishTime &le; cutoff</code>,
                  the system selects the one with the <strong>maximum publishTime</strong> (the newest forecast
                  available to the desk when bidding).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Accuracy Metrics */}
        <div>
          <h3 className="text-base font-bold text-cyan-400 mb-2">
            4. Mathematical Accuracy Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-mono font-bold text-emerald-400 mb-1">MAE (Mean Absolute Error)</div>
              <p className="font-mono text-slate-300 mb-1">MAE = (1/n) &Sigma; |F_t &minus; A_t|</p>
              <p className="text-slate-400">
                Measures the average magnitude of error in MW regardless of direction. Easy to interpret as the expected volumetric deviation.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-mono font-bold text-sky-400 mb-1">RMSE (Root Mean Squared Error)</div>
              <p className="font-mono text-slate-300 mb-1">RMSE = &radic;((1/n) &Sigma; (F_t &minus; A_t)&sup2;)</p>
              <p className="text-slate-400">
                Penalizes large outlier forecast errors disproportionately. Highly relevant in power systems where large deviations cause extreme balancing price spikes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-mono font-bold text-amber-400 mb-1">MBE (Mean Bias Error)</div>
              <p className="font-mono text-slate-300 mb-1">MBE = (1/n) &Sigma; (F_t &minus; A_t)</p>
              <p className="text-slate-400">
                Measures systemic directional bias. <strong>Positive (+)</strong> indicates persistent overforecasting (surplus). <strong>Negative (&minus;)</strong> indicates underforecasting (deficit).
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Transparency & Missing Data */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Data Integrity & Honest Transparency
          </h4>
          <p className="text-slate-400 leading-relaxed">
            • <strong>No Synthetic Fabrication:</strong> The application does not invent or fill missing values. Missing forecasts or actuals are preserved honestly.
            <br />
            • <strong>Zero vs Missing:</strong> A genuine 0 MW generation reading is handled explicitly and distinguished from null/unrecorded delivery periods.
            <br />
            • <strong>Timezone / Daylight Saving:</strong> In January 2026, the United Kingdom observes Greenwich Mean Time (GMT, UTC+0). BST is not in effect. All internal calculations use UTC timestamps.
          </p>
        </div>

      </div>
    </Modal>
  );
};
