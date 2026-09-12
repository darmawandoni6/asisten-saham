'use client';

import { AlertTriangle, Layers, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPercent, formatRupiah } from '@/lib/utils';
import { PortfolioSummary } from '@/types';

interface Props {
  summary: PortfolioSummary;
  onEditCashBalance?: () => void;
}

export function PortfolioSummaryCards({ summary, onEditCashBalance }: Props) {
  const isPnlPositive = summary.floatingPnl >= 0;
  const totalCapital = summary.totalEquity + (summary.cashBalance || 0);
  const stockPct = totalCapital > 0 ? Math.round((summary.totalEquity / totalCapital) * 100) : 0;
  const cashPct = totalCapital > 0 ? Math.round(((summary.cashBalance || 0) / totalCapital) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value (Saham + Kas) */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Total Portofolio (Saham + Kas)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-slate-900">{formatRupiah(totalCapital)}</div>
          <p className="mt-1 text-xs text-slate-500">
            Saham: <span className="font-mono font-semibold text-slate-700">{formatRupiah(summary.totalEquity)}</span>
          </p>
        </div>
      </Card>

      {/* Floating PnL */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Floating PnL (EOD)</span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isPnlPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPnlPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className={`font-mono text-xl font-bold ${isPnlPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatRupiah(summary.floatingPnl)}
          </div>
          <Badge
            variant={isPnlPositive ? 'secondary' : 'destructive'}
            className={`font-mono text-xs font-bold ${
              isPnlPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {formatPercent(summary.floatingPnlPct)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">Total {summary.totalLots} Lot Tercatat</p>
      </Card>

      {/* Status Aksi Hari Ini */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Status Aksi Saham</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="border-rose-200 bg-rose-50 font-mono text-xs font-bold text-rose-700">
            {summary.actionCounts.sellCutLoss} Cut Loss
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-700"
          >
            {summary.actionCounts.takeProfit} Take Profit
          </Badge>
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 font-mono text-xs font-bold text-orange-700"
          >
            {summary.actionCounts.trailingStopWarning} Trailing Stop
          </Badge>
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 font-mono text-xs font-bold text-purple-700"
          >
            {summary.actionCounts.recoveryMode} Recovery
          </Badge>
        </div>
      </Card>

      {/* Cash vs Stock Balance */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Cash Reserve (Saldo Kas)
          </span>
          {onEditCashBalance ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEditCashBalance}
              className="h-6 gap-1 rounded-md border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              title="Edit Saldo Kas RDN"
            >
              ✏️ Edit
            </Button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Layers className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-slate-900">{formatRupiah(summary.cashBalance)}</div>
          <p className="mt-1 text-xs text-slate-500">
            {totalCapital > 0 ? (
              <>
                Alokasi: <span className="font-semibold text-slate-800">{stockPct}% Saham</span> /{' '}
                <span className="font-semibold text-emerald-700">{cashPct}% Cash</span>
              </>
            ) : (
              <span>Belum ada alokasi modal</span>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}
