"use client";

import React from "react";
import { PortfolioSummary } from "@/types";
import { formatRupiah, formatPercent } from "@/lib/utils";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  AlertTriangle 
} from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Portfolio Value (Saham + Kas) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Total Portofolio (Saham + Kas)
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatRupiah(totalCapital)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Saham: <span className="font-mono text-slate-700 font-semibold">{formatRupiah(summary.totalEquity)}</span>
          </p>
        </div>
      </div>

      {/* Floating PnL */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Floating PnL (EOD)
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isPnlPositive 
              ? "bg-emerald-50 text-emerald-700" 
              : "bg-rose-50 text-rose-700"
          }`}>
            {isPnlPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className={`text-xl font-bold font-mono ${isPnlPositive ? "text-emerald-700" : "text-rose-600"}`}>
            {formatRupiah(summary.floatingPnl)}
          </div>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isPnlPositive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}>
            {formatPercent(summary.floatingPnlPct)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Total {summary.totalLots} Lot Tercatat</p>
      </div>

      {/* Status Aksi Hari Ini */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Status Aksi Saham
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono">
            {summary.actionCounts.sellCutLoss} Cut Loss
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
            {summary.actionCounts.takeProfit} Take Profit
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold font-mono">
            {summary.actionCounts.trailingStopWarning} Trailing Stop
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold font-mono">
            {summary.actionCounts.recoveryMode} Recovery
          </span>
        </div>
      </div>

      {/* Cash vs Stock Balance */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Cash Reserve (Saldo Kas)
          </span>
          {onEditCashBalance ? (
            <button
              type="button"
              onClick={onEditCashBalance}
              className="text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Edit Saldo Kas RDN"
            >
              ✏️ Edit
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatRupiah(summary.cashBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalCapital > 0 ? (
              <>Alokasi: <span className="text-slate-800 font-semibold">{stockPct}% Saham</span> / <span className="text-emerald-700 font-semibold">{cashPct}% Cash</span></>
            ) : (
              <span>Belum ada alokasi modal</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
