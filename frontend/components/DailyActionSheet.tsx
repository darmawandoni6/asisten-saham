'use client';

import React from 'react';

import {
  AlertOctagon,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  PauseCircle,
  Send,
} from 'lucide-react';

import { formatNumber, formatPercent } from '@/lib/utils';
import { Holding } from '@/types';

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
    (a, b) => (priorityMap[a.actionStatus] || 99) - (priorityMap[b.actionStatus] || 99),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELL_CUT_LOSS':
        return (
          <span className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
            <AlertOctagon className="h-3 w-3" /> CUT LOSS
          </span>
        );
      case 'SL_PROXIMITY_WARNING':
        return (
          <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-800">
            <AlertTriangle className="h-3 w-3 text-orange-600" /> DEKAT SL
          </span>
        );
      case 'TAKE_PROFIT':
        return (
          <span className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> TAKE PROFIT
          </span>
        );
      case 'TP_PROXIMITY_WARNING':
        return (
          <span className="flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800">
            <CheckCircle2 className="h-3 w-3 text-teal-600" /> DEKAT TP
          </span>
        );
      case 'TRAILING_STOP_WARNING':
        return (
          <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">
            <AlertTriangle className="h-3 w-3" /> TRAILING STOP
          </span>
        );
      case 'RECOVERY_MODE':
        return (
          <span className="flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
            <LifeBuoy className="h-3 w-3" /> RECOVERY
          </span>
        );
      case 'AVERAGING_REVIEW':
        return (
          <span className="flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
            <LifeBuoy className="h-3 w-3" /> AVG DOWN
          </span>
        );

      default:
        return (
          <span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            <PauseCircle className="h-3 w-3" /> HOLD
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              Daily Action Sheet (EOD Pasar 17:30 WIB)
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
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
          onClick={() => alert('Kirim notifikasi Telegram bot untuk 5 saham ini!')}
          className="flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500 sm:self-auto"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Kirim Notifikasi Telegram</span>
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
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
                  <div className="max-w-[140px] truncate text-[11px] text-slate-500">{h.name}</div>
                </td>
                <td className="px-3 py-3.5 font-mono font-bold text-slate-900">Rp {formatNumber(h.currentPrice)}</td>
                <td className="px-3 py-3.5 font-mono text-[11px] text-slate-600">
                  <div>Avg: Rp {formatNumber(h.avgPrice)}</div>
                  <div className="text-[10px] text-slate-400">
                    SL: {h.stopLoss ? formatNumber(h.stopLoss) : 'No SL'} | TP: {formatNumber(h.targetPrice)}
                  </div>
                </td>
                <td className="px-3 py-3.5 font-mono font-bold">
                  <span className={h.floatingPnlPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {formatPercent(h.floatingPnlPct)}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="mb-1 flex items-center gap-2">{getStatusBadge(h.actionStatus)}</div>
                  <p className="max-w-sm text-[11px] leading-snug text-slate-600">{h.actionReason}</p>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenStock?.(h)}
                    className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    title="Buka Detail"
                  >
                    <ExternalLink className="h-4 w-4" />
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
