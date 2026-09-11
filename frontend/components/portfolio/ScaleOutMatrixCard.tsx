'use client';

import { Calculator } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ScaleOutMatrixCard() {
  return (
    <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
        <Calculator className="h-4 w-4 text-emerald-600" />
        <span>Selling Engine: Scale-Out Matrix</span>
      </div>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <span className="block font-bold text-emerald-700">TP1 (Target Profit 1)</span>
            <span className="text-[11px] text-slate-500">Jual 50% Posisi</span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-100 font-mono text-[11px] font-bold text-emerald-800"
          >
            Kunci Profit 50%
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <span className="block font-bold text-slate-800">TP2 (Target Profit 2)</span>
            <span className="text-[11px] text-slate-500">Jual 25% Posisi</span>
          </div>
          <Badge variant="secondary" className="font-mono text-[11px] font-bold text-slate-700">
            Amankan 25%
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <span className="block font-bold text-orange-700">Sisa 25% Posisi (Trailing Stop)</span>
            <span className="text-[11px] text-slate-500">Batas Proteksi: 7% dari High Watermark</span>
          </div>
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-100 font-mono text-[11px] font-bold text-orange-800"
          >
            Ride The Trend
          </Badge>
        </div>
      </div>
    </Card>
  );
}
