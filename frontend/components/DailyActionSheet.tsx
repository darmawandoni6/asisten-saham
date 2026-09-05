"use client";

import React from "react";
import { Holding } from "@/types";
import { formatNumber, formatPercent } from "@/lib/utils";
import { 
  BellRing, 
  Send, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  LifeBuoy, 
  PauseCircle,
  ExternalLink 
} from "lucide-react";

interface Props {
  holdings: Holding[];
  onOpenStock?: (holding: Holding) => void;
}

export function DailyActionSheet({ holdings, onOpenStock }: Props) {
  const priorityMap: Record<string, number> = {
    SELL_CUT_LOSS: 1,
    SL_PROXIMITY_WARNING: 2,
    TRAILING_STOP_WARNING: 3,
    RECOVERY_MODE: 4,
    AVERAGING_REVIEW: 4,
    TAKE_PROFIT: 5,
    TP_PROXIMITY_WARNING: 6,
    HOLD_MONITOR: 7,
  };

  const sortedHoldings = [...holdings].sort(
    (a, b) => (priorityMap[a.actionStatus] || 99) - (priorityMap[b.actionStatus] || 99)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELL_CUT_LOSS":
        return (
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> CUT LOSS
          </span>
        );
      case "SL_PROXIMITY_WARNING":
        return (
          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> DEKAT SL
          </span>
        );
      case "TAKE_PROFIT":
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> TAKE PROFIT
          </span>
        );
      case "TP_PROXIMITY_WARNING":
        return (
          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> DEKAT TP
          </span>
        );
      case "TRAILING_STOP_WARNING":
        return (
          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> TRAILING STOP
          </span>
        );
      case "RECOVERY_MODE":
        return (
          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
            <LifeBuoy className="w-3 h-3" /> RECOVERY
          </span>
        );
      case "AVERAGING_REVIEW":
        return (
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1">
            <LifeBuoy className="w-3 h-3" /> AVG DOWN
          </span>
        );


      default:
        return (
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
            <PauseCircle className="w-3 h-3" /> HOLD
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Daily Action Sheet (EOD Pasar 17:30 WIB)
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Otomatis
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar aksi terurut berdasarkan tingkat urgensi eksekusi sebelum market buka besok pagi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert("Kirim notifikasi Telegram bot untuk 5 saham ini!")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim Notifikasi Telegram</span>
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
              <th className="py-3 px-3">Urgensi</th>
              <th className="py-3 px-3">Ticker</th>
              <th className="py-3 px-3">Close EOD</th>
              <th className="py-3 px-3">Avg / Plan</th>
              <th className="py-3 px-3">PnL (%)</th>
              <th className="py-3 px-3">Instruksi Eksekusi</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sortedHoldings.map((h, i) => (
              <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-3">
                  <span className="font-mono text-slate-400 font-bold text-xs">
                    #{i + 1}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <div className="font-bold text-slate-900 font-mono text-xs">{h.ticker}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{h.name}</div>
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                  Rp {formatNumber(h.currentPrice)}
                </td>
                <td className="py-3.5 px-3 font-mono text-slate-600 text-[11px]">
                  <div>Avg: Rp {formatNumber(h.avgPrice)}</div>
                  <div className="text-[10px] text-slate-400">
                    SL: {h.stopLoss ? formatNumber(h.stopLoss) : "No SL"} | TP: {formatNumber(h.targetPrice)}
                  </div>
                </td>
                <td className="py-3.5 px-3 font-mono font-bold">
                  <span className={h.floatingPnlPct >= 0 ? "text-emerald-700" : "text-rose-600"}>
                    {formatPercent(h.floatingPnlPct)}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(h.actionStatus)}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug max-w-sm">
                    {h.actionReason}
                  </p>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenStock?.(h)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Buka Detail"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
