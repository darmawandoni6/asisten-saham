'use client';

import React from 'react';

import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  LifeBuoy,
  LineChart,
  PauseCircle,
  Sparkles,
} from 'lucide-react';

import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { ActionType, Holding } from '@/types';

interface ActionCardProps {
  holding: Holding;
  onSelectStock?: (holding: Holding) => void;
  onOpenAI?: (holding: Holding) => void;
}

export function ActionCard({ holding, onSelectStock, onOpenAI }: ActionCardProps) {
  const getStatusConfig = (status: ActionType) => {
    switch (status) {
      case 'SELL_CUT_LOSS':
        return {
          title: 'SELL / CUT LOSS',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          accentColor: 'text-rose-600',
          topBorder: 'border-t-4 border-t-rose-500',
          icon: AlertOctagon,
          indicatorDot: 'bg-rose-500',
        };
      case 'SL_PROXIMITY_WARNING':
        return {
          title: 'SIAGA 1 (DEKAT STOP LOSS)',
          badgeBg: 'bg-orange-50 text-orange-800 border-orange-300',
          accentColor: 'text-orange-700',
          topBorder: 'border-t-4 border-t-orange-500',
          icon: AlertTriangle,
          indicatorDot: 'bg-orange-500',
        };
      case 'TAKE_PROFIT':
        return {
          title: 'TAKE PROFIT / TRIM',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accentColor: 'text-emerald-700',
          topBorder: 'border-t-4 border-t-emerald-500',
          icon: CheckCircle2,
          indicatorDot: 'bg-emerald-600',
        };
      case 'TP_PROXIMITY_WARNING':
        return {
          title: 'PERSIAPAN TAKE PROFIT',
          badgeBg: 'bg-teal-50 text-teal-800 border-teal-300',
          accentColor: 'text-teal-700',
          topBorder: 'border-t-4 border-t-teal-500',
          icon: CheckCircle2,
          indicatorDot: 'bg-teal-600',
        };

      case 'TRAILING_STOP_WARNING':
        return {
          title: 'TRAILING STOP WARNING',
          badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
          accentColor: 'text-orange-700',
          topBorder: 'border-t-4 border-t-orange-500',
          icon: AlertTriangle,
          indicatorDot: 'bg-orange-500',
        };
      case 'RECOVERY_MODE':
        return {
          title: 'RECOVERY MODE',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          accentColor: 'text-purple-700',
          topBorder: 'border-t-4 border-t-purple-500',
          icon: LifeBuoy,
          indicatorDot: 'bg-purple-600',
        };
      case 'AVERAGING_REVIEW':
        return {
          title: 'AVERAGING DOWN REVIEW',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          accentColor: 'text-indigo-700',
          topBorder: 'border-t-4 border-t-indigo-500',
          icon: LifeBuoy,
          indicatorDot: 'bg-indigo-600',
        };
      case 'HOLD_MONITOR':
      default:
        return {
          title: 'HOLD / MONITOR',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          accentColor: 'text-amber-700',
          topBorder: 'border-t-4 border-t-amber-500',
          icon: PauseCircle,
          indicatorDot: 'bg-amber-500',
        };
    }
  };

  const config = getStatusConfig(holding.actionStatus);
  const StatusIcon = config.icon;
  const isProfit = holding.floatingPnl >= 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${config.topBorder} flex flex-col justify-between p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs`}
    >
      <div>
        {/* Header: Ticker, Name, Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight text-slate-900">{holding.ticker}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                {holding.sector}
              </span>
            </div>
            <p className="mt-0.5 max-w-[210px] truncate text-xs text-slate-500" title={holding.name}>
              {holding.name}
            </p>
          </div>

          <span
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold ${config.badgeBg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.indicatorDot}`} />
            {config.title}
          </span>
        </div>

        {/* Pricing Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Closing EOD</span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-mono text-lg font-bold text-slate-900">
                Rp {formatNumber(holding.currentPrice)}
              </span>
              <span
                className={`flex items-center text-[11px] font-semibold ${
                  holding.currentPrice >= holding.previousClose ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {holding.currentPrice >= holding.previousClose ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatPercent(((holding.currentPrice - holding.previousClose) / holding.previousClose) * 100)}
              </span>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Floating PnL
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className={`font-mono text-base font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatPercent(holding.floatingPnlPct)}
              </span>
              <span className={`font-mono text-[11px] ${isProfit ? 'text-emerald-600' : 'text-rose-500'}`}>
                ({formatRupiah(holding.floatingPnl)})
              </span>
            </div>
          </div>
        </div>

        {/* Trading Plan Parameters */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
          <div>
            <span className="block text-[10px] text-slate-500">Avg Price</span>
            <span className="font-mono font-bold text-slate-800">Rp {formatNumber(holding.avgPrice)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500">Target (TP)</span>
            <span className="font-mono font-bold text-emerald-700">Rp {formatNumber(holding.targetPrice)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500">Stop Loss</span>
            {holding.stopLoss ? (
              <span className="font-mono font-bold text-rose-600">Rp {formatNumber(holding.stopLoss)}</span>
            ) : (
              <span className="font-mono text-[10px] font-bold text-indigo-500">
                No Hard SL
                <br />
                <span className="text-slate-400">Investasi</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Reason Box */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-slate-800">
            <StatusIcon className={`h-3.5 w-3.5 ${config.accentColor}`} />
            <span>Instruksi Aksi:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">{holding.actionReason}</p>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onSelectStock?.(holding)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <LineChart className="h-3.5 w-3.5 text-slate-500" />
          <span>Buka Chart</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAI?.(holding)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>AI Copilot</span>
        </button>
      </div>
    </div>
  );
}
