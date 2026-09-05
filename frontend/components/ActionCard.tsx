"use client";

import React from "react";
import { Holding, ActionType } from "@/types";
import { formatRupiah, formatPercent, formatNumber } from "@/lib/utils";
import { 
  AlertOctagon, 
  CheckCircle2, 
  PauseCircle, 
  AlertTriangle, 
  LifeBuoy,
  Sparkles,
  LineChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface ActionCardProps {
  holding: Holding;
  onSelectStock?: (holding: Holding) => void;
  onOpenAI?: (holding: Holding) => void;
}

export function ActionCard({ holding, onSelectStock, onOpenAI }: ActionCardProps) {
  const getStatusConfig = (status: ActionType) => {
    switch (status) {
      case "SELL_CUT_LOSS":
        return {
          title: "SELL / CUT LOSS",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
          accentColor: "text-rose-600",
          topBorder: "border-t-4 border-t-rose-500",
          icon: AlertOctagon,
          indicatorDot: "bg-rose-500",
        };
      case "SL_PROXIMITY_WARNING":
        return {
          title: "SIAGA 1 (DEKAT STOP LOSS)",
          badgeBg: "bg-orange-50 text-orange-800 border-orange-300",
          accentColor: "text-orange-700",
          topBorder: "border-t-4 border-t-orange-500",
          icon: AlertTriangle,
          indicatorDot: "bg-orange-500",
        };
      case "TAKE_PROFIT":
        return {
          title: "TAKE PROFIT / TRIM",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          accentColor: "text-emerald-700",
          topBorder: "border-t-4 border-t-emerald-500",
          icon: CheckCircle2,
          indicatorDot: "bg-emerald-600",
        };
      case "TP_PROXIMITY_WARNING":
        return {
          title: "PERSIAPAN TAKE PROFIT",
          badgeBg: "bg-teal-50 text-teal-800 border-teal-300",
          accentColor: "text-teal-700",
          topBorder: "border-t-4 border-t-teal-500",
          icon: CheckCircle2,
          indicatorDot: "bg-teal-600",
        };

      case "TRAILING_STOP_WARNING":
        return {
          title: "TRAILING STOP WARNING",
          badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
          accentColor: "text-orange-700",
          topBorder: "border-t-4 border-t-orange-500",
          icon: AlertTriangle,
          indicatorDot: "bg-orange-500",
        };
      case "RECOVERY_MODE":
        return {
          title: "RECOVERY MODE",
          badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
          accentColor: "text-purple-700",
          topBorder: "border-t-4 border-t-purple-500",
          icon: LifeBuoy,
          indicatorDot: "bg-purple-600",
        };
      case "AVERAGING_REVIEW":
        return {
          title: "AVERAGING DOWN REVIEW",
          badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          accentColor: "text-indigo-700",
          topBorder: "border-t-4 border-t-indigo-500",
          icon: LifeBuoy,
          indicatorDot: "bg-indigo-600",
        };
      case "HOLD_MONITOR":
      default:
        return {
          title: "HOLD / MONITOR",
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          accentColor: "text-amber-700",
          topBorder: "border-t-4 border-t-amber-500",
          icon: PauseCircle,
          indicatorDot: "bg-amber-500",
        };
    }
  };

  const config = getStatusConfig(holding.actionStatus);
  const StatusIcon = config.icon;
  const isProfit = holding.floatingPnl >= 0;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${config.topBorder} p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between`}>
      <div>
        {/* Header: Ticker, Name, Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-slate-900 tracking-tight">
                {holding.ticker}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {holding.sector}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[210px] mt-0.5" title={holding.name}>
              {holding.name}
            </p>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${config.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.indicatorDot}`} />
            {config.title}
          </span>
        </div>

        {/* Pricing Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Closing EOD
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">
                Rp {formatNumber(holding.currentPrice)}
              </span>
              <span className={`text-[11px] font-semibold flex items-center ${
                holding.currentPrice >= holding.previousClose ? "text-emerald-700" : "text-rose-600"
              }`}>
                {holding.currentPrice >= holding.previousClose ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatPercent(((holding.currentPrice - holding.previousClose) / holding.previousClose) * 100)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Floating PnL
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-base font-bold font-mono ${isProfit ? "text-emerald-700" : "text-rose-600"}`}>
                {formatPercent(holding.floatingPnlPct)}
              </span>
              <span className={`text-[11px] font-mono ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
                ({formatRupiah(holding.floatingPnl)})
              </span>
            </div>
          </div>
        </div>

        {/* Trading Plan Parameters */}
        <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Avg Price</span>
            <span className="font-mono text-slate-800 font-bold">
              Rp {formatNumber(holding.avgPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Target (TP)</span>
            <span className="font-mono text-emerald-700 font-bold">
              Rp {formatNumber(holding.targetPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Stop Loss</span>
            {holding.stopLoss ? (
              <span className="font-mono text-rose-600 font-bold">
                Rp {formatNumber(holding.stopLoss)}
              </span>
            ) : (
              <span className="font-mono text-indigo-500 font-bold text-[10px]">
                No Hard SL<br/><span className="text-slate-400">Investasi</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Reason Box */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <StatusIcon className={`w-3.5 h-3.5 ${config.accentColor}`} />
            <span>Instruksi Aksi:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {holding.actionReason}
          </p>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectStock?.(holding)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <LineChart className="w-3.5 h-3.5 text-slate-500" />
          <span>Buka Chart</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAI?.(holding)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors border border-emerald-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Copilot</span>
        </button>
      </div>
    </div>
  );
}
