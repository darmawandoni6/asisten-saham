'use client';

import { CircleDollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPercent, formatRupiah } from '@/lib/utils';

interface PortfolioMetricsBarProps {
  totalCost: number;
  totalMarketValue: number;
  totalFloatingPnl: number;
  totalFloatingPnlPct: number;
  cashBalance: number;
  totalHoldings: number;
  onEditCashBalance: () => void;
}

export function PortfolioMetricsBar({
  totalCost,
  totalMarketValue,
  totalFloatingPnl,
  totalFloatingPnlPct,
  cashBalance,
  totalHoldings,
  onEditCashBalance,
}: PortfolioMetricsBarProps) {
  const isPnlPositive = totalFloatingPnl >= 0;
  const totalCapital = totalMarketValue + cashBalance;
  const stockPct = totalCapital > 0 ? Math.round((totalMarketValue / totalCapital) * 100) : 0;
  const cashPct = totalCapital > 0 ? Math.round((cashBalance / totalCapital) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Portofolio (Saham + Kas) */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Total Portofolio (Aset)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-slate-900">{formatRupiah(totalCapital)}</div>
          <p className="mt-1 text-xs text-slate-500">
            Nilai Pasar Saham:{' '}
            <span className="font-mono font-semibold text-slate-700">{formatRupiah(totalMarketValue)}</span>
          </p>
        </div>
      </Card>

      {/* 2. Modal Beli Terinvestasi */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Modal Beli (Cost Basis)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <CircleDollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-slate-900">{formatRupiah(totalCost)}</div>
          <p className="mt-1 text-xs text-slate-500">
            Total <span className="font-mono font-semibold text-slate-700">{totalHoldings} Saham</span> Aktif
          </p>
        </div>
      </Card>

      {/* 3. Floating PnL */}
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
            {formatRupiah(totalFloatingPnl)}
          </div>
          <Badge
            variant={isPnlPositive ? 'secondary' : 'destructive'}
            className={`font-mono text-xs font-bold ${
              isPnlPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {formatPercent(totalFloatingPnlPct)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">Keuntungan / Kerugian Belum Terealisasi</p>
      </Card>

      {/* 4. Kas RDN & Alokasi */}
      <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Saldo Kas RDN</span>
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
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-slate-900">{formatRupiah(cashBalance)}</div>
          <p className="mt-1 text-xs text-slate-500">
            Alokasi: <span className="font-semibold text-slate-800">{stockPct}% Saham</span> /{' '}
            <span className="font-semibold text-emerald-700">{cashPct}% Kas</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
