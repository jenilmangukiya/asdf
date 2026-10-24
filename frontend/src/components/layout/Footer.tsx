import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          UK National Electricity Market Analytics • Day-Ahead Purchasing Accuracy
        </p>
        <p className="flex items-center gap-2">
          <span>Data: Elexon BMRS (FUELHH & WINDFOR streams)</span>
          <span>•</span>
          <span>Timestamps: UTC / GMT</span>
        </p>
      </div>
    </footer>
  );
};
