'use client';

import { useState } from 'react';

import { Calculator } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

interface ScaleOutMatrixCardProps {
  holdings?: Holding[];
}

export function ScaleOutMatrixCard({ holdings = [] }: ScaleOutMatrixCardProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>(holdings[0]?.ticker || '');

  const selectedHolding = holdings.find(h => h.ticker === selectedTicker) || holdings[0];

  // Calculations for interactive simulation
  const tpPrice = selectedHolding?.targetPrice || (selectedHolding ? selectedHolding.avgPrice * 1.15 : 0);
  const lotTotal = selectedHolding?.lot || 10;
  const tp1Lot = Math.max(1, Math.round(lotTotal * 0.5));
  const tp2Lot = Math.max(1, Math.round(lotTotal * 0.25));
  const trailingLot = Math.max(0, lotTotal - tp1Lot - tp2Lot);

  const tp1Value = tp1Lot * tpPrice * 100;
  const tp1Profit = selectedHolding ? (tpPrice - selectedHolding.avgPrice) * tp1Lot * 100 : 0;

  return (
    <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
          <Calculator className="h-4 w-4 text-emerald-600" />
          <span>Selling Engine: Scale-Out Matrix</span>
        </div>

        {holdings.length > 0 && (
          <div className="w-36">
            <Select value={selectedHolding?.ticker} onValueChange={val => val && setSelectedTicker(val)}>
              <SelectTrigger className="h-7 rounded-lg border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                <SelectValue placeholder="Pilih Saham" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white shadow-lg">
                {holdings.map(h => (
                  <SelectItem key={h.id} value={h.ticker} className="font-mono text-xs font-semibold">
                    {h.ticker} ({h.lot} Lot)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2.5 text-xs">
        {/* TP1 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700">TP1 (Kunci Profit 50%)</span>
              {selectedHolding && (
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {tp1Lot} Lot @ Rp {formatNumber(tpPrice)}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {selectedHolding
                ? `Kunci kas ${formatRupiah(tp1Value)} (Est. Laba ${formatRupiah(tp1Profit)})`
                : 'Jual 50% posisi saat menyentuh resistance pertama'}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 font-mono text-[10px] font-bold text-emerald-800"
          >
            Kunci 50%
          </Badge>
        </div>

        {/* TP2 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">TP2 (Target Profit 2)</span>
              {selectedHolding && <span className="font-mono text-xs font-semibold text-slate-700">{tp2Lot} Lot</span>}
            </div>
            <span className="text-xs text-slate-500">Jual 25% posisi di resistance berikutnya</span>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px] font-bold text-slate-700">
            Amankan 25%
          </Badge>
        </div>

        {/* Trailing Stop */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-700">Sisa Posisi (Trailing Stop)</span>
              {selectedHolding && (
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {trailingLot > 0 ? `${trailingLot} Lot` : `${tp2Lot} Lot`}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">Batas proteksi: 7% dari High Watermark</span>
          </div>
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 font-mono text-[10px] font-bold text-orange-800"
          >
            Ride The Trend
          </Badge>
        </div>
      </div>
    </Card>
  );
}
