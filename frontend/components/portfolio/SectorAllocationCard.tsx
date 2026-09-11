'use client';

import { PieChart } from 'lucide-react';

import { Card } from '@/components/ui/card';

interface SectorAllocationCardProps {
  sectorMap: Record<string, number>;
  totalCost: number;
  hasHoldings: boolean;
}

export function SectorAllocationCard({ sectorMap, totalCost, hasHoldings }: SectorAllocationCardProps) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
        <PieChart className="h-4 w-4 text-emerald-600" />
        <span>Money Management: Alokasi Sektor</span>
      </div>
      {hasHoldings ? (
        <div className="space-y-3">
          {Object.entries(sectorMap).map(([sec, val]) => {
            const pct = totalCost > 0 ? (val / totalCost) * 100 : 0;
            return (
              <div key={sec}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-700">{sec}</span>
                  <span className="font-mono font-bold text-emerald-700">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-slate-400">Belum ada saham untuk dihitung alokasi sektornya.</p>
      )}
    </Card>
  );
}
