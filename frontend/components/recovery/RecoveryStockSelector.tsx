'use client';

import { LifeBuoy, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPercent, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

interface RecoveryStockSelectorProps {
  holdings: Holding[];
  selectedTicker: string;
  cashBalance?: number;
  onSelectStock: (holding: Holding) => void;
}

export function RecoveryStockSelector({
  holdings,
  selectedTicker,
  cashBalance,
  onSelectStock,
}: RecoveryStockSelectorProps) {
  if (holdings.length === 0) return null;

  return (
    <Card className="flex flex-col justify-between gap-4 rounded-2xl border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-sm font-semibold text-slate-600">Pilih Saham Floating Loss:</span>
        {holdings.map(h => {
          const isSelected = selectedTicker === h.ticker;
          return (
            <button
              key={h.ticker}
              type="button"
              onClick={() => onSelectStock(h)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-bold transition-all ${
                isSelected
                  ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LifeBuoy className="h-4 w-4 text-purple-600" />
              <span>{h.ticker}</span>
              <Badge variant="destructive" className="bg-rose-100 font-mono text-xs text-rose-800 hover:bg-rose-100">
                {formatPercent(h.floatingPnlPct)}
              </Badge>
            </button>
          );
        })}
      </div>

      {cashBalance !== undefined && (
        <div className="flex items-center gap-2.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm sm:self-auto">
          <Wallet className="h-4.5 w-4.5 text-slate-500" />
          <span className="font-medium text-slate-600">Sisa Kas Tersedia:</span>
          <span className="font-mono text-base font-bold text-slate-900">{formatRupiah(cashBalance)}</span>
        </div>
      )}
    </Card>
  );
}
