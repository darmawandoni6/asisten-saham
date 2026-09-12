'use client';

import { AlertOctagon, AlertTriangle, CheckCircle2, LifeBuoy, LineChart, PauseCircle, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatNumber, formatPercent } from '@/lib/utils';
import { Holding } from '@/types';

interface Props {
  holdings: Holding[];
  onOpenStock?: (holding: Holding) => void;
  onSelectStock?: (holding: Holding) => void;
}

export function DailyActionSheet({ holdings, onOpenStock, onSelectStock }: Props) {
  const priorityMap: Record<string, number> = {
    SELL_CUT_LOSS: 1,
    SL_PROXIMITY_WARNING: 2,
    TRAILING_STOP_WARNING: 3,
    RECOVERY_MODE: 4,
    AVERAGING_REVIEW: 4,
    EXIT_REBOUND: 5,
    ER_PROXIMITY_WARNING: 5,
    TAKE_PROFIT: 6,
    TP_PROXIMITY_WARNING: 7,
    HOLD_MONITOR: 8,
  };

  const sortedHoldings = [...holdings].sort(
    (a, b) => (priorityMap[a.actionStatus] || 99) - (priorityMap[b.actionStatus] || 99),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELL_CUT_LOSS':
        return (
          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">
            <AlertOctagon className="mr-1 h-3 w-3" /> CUT LOSS
          </Badge>
        );
      case 'SL_PROXIMITY_WARNING':
        return (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-xs font-bold text-orange-800">
            <AlertTriangle className="mr-1 h-3 w-3 text-orange-600" /> DEKAT SL
          </Badge>
        );
      case 'EXIT_REBOUND':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs font-bold text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" /> EXIT REBOUND
          </Badge>
        );
      case 'ER_PROXIMITY_WARNING':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs font-bold text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" /> DEKAT EXIT
          </Badge>
        );
      case 'TAKE_PROFIT':
        return (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> TAKE PROFIT
          </Badge>
        );
      case 'TP_PROXIMITY_WARNING':
        return (
          <Badge variant="outline" className="border-teal-200 bg-teal-50 text-xs font-bold text-teal-800">
            <CheckCircle2 className="mr-1 h-3 w-3 text-teal-600" /> DEKAT TP
          </Badge>
        );
      case 'TRAILING_STOP_WARNING':
        return (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-xs font-bold text-orange-700">
            <AlertTriangle className="mr-1 h-3 w-3" /> TRAILING STOP
          </Badge>
        );
      case 'RECOVERY_MODE':
        return (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-xs font-bold text-purple-700">
            <LifeBuoy className="mr-1 h-3 w-3" /> RECOVERY
          </Badge>
        );
      case 'AVERAGING_REVIEW':
        return (
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700">
            <LifeBuoy className="mr-1 h-3 w-3" /> AVG DOWN
          </Badge>
        );

      default:
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs font-bold text-amber-800">
            <PauseCircle className="mr-1 h-3 w-3" /> HOLD
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="px-3 py-3">Urgensi</th>
              <th className="px-3 py-3">Ticker</th>
              <th className="px-3 py-3">Close EOD</th>
              <th className="px-3 py-3">Avg / Plan</th>
              <th className="px-3 py-3">PnL (%)</th>
              <th className="px-3 py-3">Instruksi Eksekusi</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sortedHoldings.map((h, i) => (
              <tr key={h.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-3.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#{i + 1}</span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="font-mono text-xs font-bold text-slate-900">{h.ticker}</div>
                  <div className="max-w-35 truncate text-xs text-slate-500">{h.name}</div>
                </td>
                <td className="px-3 py-3.5 font-mono font-bold text-slate-900">Rp {formatNumber(h.currentPrice)}</td>
                <td className="px-3 py-3.5 font-mono text-xs text-slate-600">
                  <div>Avg: Rp {formatNumber(h.avgPrice)}</div>
                  <div className="text-[10px] text-slate-400">
                    SL: {h.stopLoss ? formatNumber(h.stopLoss) : 'No SL'} |{' '}
                    {h.targetPrice < h.avgPrice && h.jenis !== 'investasi' ? 'Exit' : 'TP'}:{' '}
                    {formatNumber(h.targetPrice)}
                  </div>
                </td>
                <td className="px-3 py-3.5 font-mono font-bold">
                  <span className={h.floatingPnlPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {formatPercent(h.floatingPnlPct)}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="mb-1 flex items-center gap-2">{getStatusBadge(h.actionStatus)}</div>
                  <p className="max-w-sm text-xs leading-snug text-slate-600">{h.actionReason}</p>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectStock?.(h)}
                      className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title="Buka Candlestick Chart"
                    >
                      <LineChart className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenStock?.(h)}
                      className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                      title="Buka AI Copilot"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
