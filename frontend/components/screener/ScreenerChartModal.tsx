'use client';

import { CandlestickChart } from '@/components/CandlestickChart';

interface ScreenerChartModalProps {
  ticker: string | null;
  onClose: () => void;
}

export function ScreenerChartModal({ ticker, onClose }: ScreenerChartModalProps) {
  if (!ticker) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs duration-150">
      <div className="w-full max-w-4xl">
        <CandlestickChart ticker={ticker} candles={[]} onClose={onClose} />
      </div>
    </div>
  );
}
