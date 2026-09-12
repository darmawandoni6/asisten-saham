'use client';

import { BarChart2, ChevronDown, ChevronUp, HelpCircle, Sparkles, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenerDiscussionState } from '@/hooks/useScreenerDiscussion';
import { formatNumber, formatPercent } from '@/lib/utils';
import { ScreenerItem } from '@/types';

import { ScreenerAIDiscussion } from './ScreenerAIDiscussion';

interface ScreenerCardItemProps {
  item: ScreenerItem;
  index: number;
  isDiscussionActive: boolean;
  discussion: ScreenerDiscussionState;
  onToggleDiscussion: (ticker: string) => void;
  onOpenChart: (ticker: string) => void;
  onOpenKamus: () => void;
  onSendQuestion: (ticker: string, questionText?: string) => void;
  onClearHistory: (ticker: string) => void;
  onInputChange: (ticker: string, text: string) => void;
}

export function ScreenerCardItem({
  item,
  index,
  isDiscussionActive,
  discussion,
  onToggleDiscussion,
  onOpenChart,
  onOpenKamus,
  onSendQuestion,
  onClearHistory,
  onInputChange,
}: ScreenerCardItemProps) {
  const convScore = item.convictionScore || 8;
  const isConv10 = convScore >= 10;

  return (
    <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
      {/* Card Header: Ticker, Name, Sector (Jenis Saham), Price, Change, RSI & AI Score */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-600">
            #{index + 1}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black text-slate-900">{item.ticker}</span>
              <span className="text-xs font-medium text-slate-500">{item.name}</span>
              <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-700">
                Sektor: {item.sector}
              </Badge>
              {item.profileSuitability === 'BOTH' ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800"
                >
                  ✨ Trading &amp; Investasi
                </Badge>
              ) : item.profileSuitability === 'INVESTASI' ? (
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-800"
                >
                  🏛️ Cocok Investasi
                </Badge>
              ) : (
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[10px] font-bold text-sky-800">
                  ⚡ Cocok Trading
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-900">Rp {formatNumber(item.price)}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                Rp {formatNumber(item.price * 100)}/lot
              </span>
              <span
                className={`font-mono text-xs font-bold ${item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                {(item.changeNominal ?? 0) >= 0
                  ? `+${formatNumber(item.changeNominal ?? 0)}`
                  : formatNumber(item.changeNominal ?? 0)}{' '}
                ({formatPercent(item.changePct)})
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-xs text-slate-500">
                RSI:{' '}
                <strong
                  className={item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-800'}
                >
                  {item.rsi}
                </strong>
              </span>
            </div>

            {/* 4 Fundamental Metrics Badges (Market Cap, Free Float, ROE, DER) */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
              <span
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700"
                title="Kapitalisasi Pasar"
              >
                🏢 MC: <strong className="font-bold text-slate-900">{item.marketCapFormatted || '-'}</strong>
              </span>
              <span
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700"
                title="Porsi Kepemilikan Publik (Free Float)"
              >
                🌐 Float:{' '}
                <strong className="font-bold text-slate-900">
                  {item.freeFloatPct !== null && item.freeFloatPct !== undefined ? `${item.freeFloatPct}%` : 'N/A'}
                </strong>
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 font-semibold ${
                  item.roePct !== null && item.roePct !== undefined && item.roePct >= 10
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                title="Return on Equity (Tingkat Profitabilitas)"
              >
                📊 ROE:{' '}
                <strong className="font-bold">
                  {item.roePct !== null && item.roePct !== undefined ? `${item.roePct}%` : 'N/A'}
                </strong>
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 font-semibold ${
                  item.der !== null && item.der !== undefined && item.der <= 1.0
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                title="Debt to Equity Ratio (Rasio Utang terhadap Ekuitas)"
              >
                ⚖️ DER:{' '}
                <strong className="font-bold">
                  {item.der !== null && item.der !== undefined ? `${item.der}x` : 'N/A (Finansial)'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
          {/* Strategy Badge */}
          <Badge
            variant="outline"
            className={`font-mono text-xs font-bold ${
              item.strategy === 'OVERSOLD'
                ? 'border-purple-200 bg-purple-50 text-purple-800'
                : item.strategy === 'BREAKOUT'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {item.actionStance || item.strategy}
          </Badge>

          {/* Unified Conviction Score Pill (1-10) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenKamus}
            className={`h-auto gap-1.5 px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
              isConv10
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-2xs'
                : convScore >= 8
                  ? 'border-blue-200 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
            title="Skor Rekomendasi AI (1-10): 10 = Wajib Dibeli Besok Pagi. Klik untuk buka kamus."
          >
            <span>{isConv10 ? '🔥' : '⭐'} Skor AI:</span>
            <span className="text-sm font-black">{convScore}/10</span>
            <HelpCircle className="h-3 w-3 opacity-70" />
          </Button>

          {/* Interactive Chart Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChart(item.ticker)}
            className="h-auto gap-1.5 border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Chart</span>
          </Button>
        </div>
      </div>

      {/* 3 Pillars Analysis Grid */}
      <div className="grid grid-cols-1 gap-4 text-xs lg:grid-cols-3">
        {/* Pilar 1: Alasan Rekomendasi (Why Buy) */}
        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
            <span className="text-emerald-600">💡</span>
            <span>Alasan Rekomendasi</span>
          </div>
          <p className="font-sans leading-relaxed text-slate-700">{item.whyBuy || item.catalyst}</p>
          <div className="pt-1 text-xs text-slate-500">
            Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
          </div>
        </div>

        {/* Pilar 2: Hal Wajib Dipantau Besok (Watch Trigger) */}
        <div className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-950 uppercase">
            <span className="text-amber-700">👀</span>
            <span>Wajib Dipantau Besok (09:00 WIB)</span>
          </div>
          <p className="font-sans leading-relaxed text-slate-700">{item.watchTrigger}</p>
          <div className="pt-1 text-xs font-medium text-amber-900/80">
            👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
          </div>
        </div>

        {/* Pilar 3: Panduan Level Eksekusi & Risk/Reward Ratio */}
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>Panduan Level &amp; Rasio</span>
            </div>
            <button
              type="button"
              onClick={onOpenKamus}
              className="flex cursor-pointer items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900 transition-colors hover:bg-emerald-200"
              title="Risk to Reward Ratio (RRR). Klik untuk buka penjelasan matematis."
            >
              <span>RRR {item.riskRewardRatio}</span>
              <HelpCircle className="h-2.5 w-2.5 text-emerald-700 opacity-80" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <span className="block text-[10px] text-slate-500">Area Beli Ideal</span>
              <strong className="font-bold text-slate-900">{item.buyArea}</strong>
            </div>
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-2">
              <span className="block text-[10px] text-emerald-700">Target Profit (TP)</span>
              <strong className="font-bold text-emerald-900">
                Rp {formatNumber(item.targetPrice || item.resistance)} (+{item.potentialGainPct}%)
              </strong>
            </div>
            <div className="rounded-lg border border-rose-200/60 bg-rose-50/60 p-2">
              <span className="block text-[10px] text-rose-700">Stop Loss (SL)</span>
              <strong className="font-bold text-rose-900">
                Rp {formatNumber(item.stopLoss || item.support)} (-{item.potentialRiskPct}%)
              </strong>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <span className="block text-[10px] text-slate-500">Support / Resist</span>
              <strong className="font-bold text-slate-800">
                {formatNumber(item.support)} / {formatNumber(item.resistance)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Card AI Discussion Trigger Bar */}
      <div className="flex flex-col justify-between gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-xs font-bold ${
              isConv10
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : convScore >= 8
                  ? 'border-blue-200 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <span>{isConv10 ? '🔥' : convScore >= 8 ? '⚡' : '🎯'}</span>
            <span>
              Skor {convScore}/10: {item.convictionLabel}
            </span>
          </Badge>
        </div>

        <Button
          type="button"
          variant={isDiscussionActive ? 'emerald' : 'outline'}
          size="sm"
          onClick={() => onToggleDiscussion(item.ticker)}
          className={`h-auto gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            isDiscussionActive ? 'shadow-2xs' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isDiscussionActive ? 'Tutup Diskusi AI' : 'Diskusi dengan AI'}</span>
          {isDiscussionActive ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Expanded Card AI Discussion Block */}
      {isDiscussionActive && (
        <div className="animate-in fade-in mt-2 border-t border-slate-200 pt-3 duration-150">
          <ScreenerAIDiscussion
            item={item}
            discussion={discussion}
            onSendQuestion={onSendQuestion}
            onClearHistory={onClearHistory}
            onInputChange={onInputChange}
            onOpenKamus={onOpenKamus}
          />
        </div>
      )}
    </Card>
  );
}
