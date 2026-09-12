'use client';

import React from 'react';

import { ArrowDown, ArrowUp, ArrowUpDown, BarChart2, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenerSortDirection, ScreenerSortField } from '@/hooks/useScreener';
import { ScreenerDiscussionState } from '@/hooks/useScreenerDiscussion';
import { formatNumber, formatPercent } from '@/lib/utils';
import { ScreenerItem } from '@/types';

import { ScreenerAIDiscussion } from './ScreenerAIDiscussion';

interface ScreenerTableViewProps {
  items: ScreenerItem[];
  sortField: ScreenerSortField;
  sortDirection: ScreenerSortDirection;
  onSort: (field: ScreenerSortField) => void;
  expandedTicker: string | null;
  onToggleExpand: (ticker: string) => void;
  discussions: Record<string, ScreenerDiscussionState>;
  onOpenChart: (ticker: string) => void;
  onOpenKamus: () => void;
  onSendQuestion: (ticker: string, questionText?: string) => void;
  onClearHistory: (ticker: string) => void;
  onInputChange: (ticker: string, text: string) => void;
}

export function ScreenerTableView({
  items,
  sortField,
  sortDirection,
  onSort,
  expandedTicker,
  onToggleExpand,
  discussions,
  onOpenChart,
  onOpenKamus,
  onSendQuestion,
  onClearHistory,
  onInputChange,
}: ScreenerTableViewProps) {
  const renderSortTh = (
    label: string,
    field: ScreenerSortField,
    align: 'left' | 'right' = 'left',
    tooltip?: string,
  ) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={e => {
          e.stopPropagation();
          onSort(field);
        }}
        className={`cursor-pointer px-3 py-3.5 transition-colors select-none hover:bg-slate-100/80 ${
          isActive ? 'bg-emerald-50/50 font-black text-emerald-800' : 'font-bold text-slate-600'
        } ${align === 'right' ? 'text-right' : 'text-left'}`}
        title={tooltip ? `${label}: ${tooltip} (Klik untuk mengurutkan)` : `Urutkan berdasarkan ${label}`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {tooltip && (
            <span
              onClick={e => {
                e.stopPropagation();
                onOpenKamus();
              }}
              title={tooltip}
              className="text-slate-400 transition-colors hover:text-emerald-600"
            >
              <HelpCircle className="inline h-3 w-3" />
            </span>
          )}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-60 hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {renderSortTh('# Ticker', 'ticker')}
              {renderSortTh('Harga Close', 'price')}
              {renderSortTh('Perubahan', 'changePct')}
              {renderSortTh(
                'RSI',
                'rsi',
                'left',
                'Relative Strength Index (0-100). Indikator momentum jenuh jual (<35) atau jenuh beli (>70).',
              )}
              {renderSortTh(
                'Risk:Reward',
                'riskRewardRatio',
                'left',
                'Risk:Reward Ratio (RRR). Perbandingan batas risiko Stop Loss vs potensi keuntungan Take Profit. Standar ideal minimal 1 : 2.0.',
              )}
              {renderSortTh(
                'Skor AI (1-10)',
                'convictionScore',
                'left',
                'Skor Rekomendasi AI (1-10): Tingkat keyakinan beli besok pagi. Skor 10/10 berarti WAJIB DIBELI BESOK PAGI karena setup teknikal & fundamental prima.',
              )}
              <th className="px-3.5 py-3.5 text-right font-bold text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {items.map((item, idx) => {
              const isExpanded = expandedTicker === item.ticker;
              const convScore = item.convictionScore || 8;
              const isConv10 = convScore >= 10;

              return (
                <React.Fragment key={item.ticker}>
                  <tr
                    onClick={() => onToggleExpand(item.ticker)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-900">{item.ticker}</div>
                          <div className="text-[11px] text-slate-500">{item.name}</div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {item.profileSuitability === 'BOTH' ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[9px] font-bold text-emerald-800"
                              >
                                ✨ Trading &amp; Investasi
                              </Badge>
                            ) : item.profileSuitability === 'INVESTASI' ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-indigo-50 px-1.5 py-0 text-[9px] font-bold text-indigo-800"
                              >
                                🏛️ Investasi
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-sky-200 bg-sky-50 px-1.5 py-0 text-[9px] font-bold text-sky-800"
                              >
                                ⚡ Trading
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3.5 font-mono">
                      <div className="text-xs font-bold text-slate-900">Rp {formatNumber(item.price)}</div>
                      <div className="text-[10px] font-medium text-slate-400">
                        Rp {formatNumber(item.price * 100)}/lot
                      </div>
                    </td>

                    <td className="px-3.5 font-mono font-bold">
                      <div className={item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        <span>
                          {(item.changeNominal ?? 0) >= 0
                            ? `+${formatNumber(item.changeNominal ?? 0)}`
                            : formatNumber(item.changeNominal ?? 0)}
                        </span>
                        <span className="ml-1 text-[10px]">({formatPercent(item.changePct)})</span>
                      </div>
                    </td>

                    <td className="px-3.5 font-mono font-bold">
                      <span
                        className={
                          item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-700'
                        }
                      >
                        {item.rsi}
                      </span>
                    </td>

                    <td className="px-3.5 font-mono">
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-900"
                      >
                        {item.riskRewardRatio}
                      </Badge>
                    </td>

                    <td className="px-3.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs font-bold ${
                            isConv10
                              ? 'border-emerald-300 bg-emerald-50 font-black text-emerald-900 shadow-2xs'
                              : convScore >= 8
                                ? 'border-blue-200 bg-blue-50 text-blue-900'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isConv10 ? '🔥 ' : ''}
                          {convScore}/10
                        </Badge>
                        <div className="hidden h-1.5 w-8 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div
                            className={`h-full rounded-full ${
                              isConv10 ? 'bg-emerald-600' : convScore >= 8 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${(convScore / 10) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            onToggleExpand(item.ticker);
                          }}
                          className={`h-7 gap-1 px-2 text-[11px] font-bold ${
                            isExpanded
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Diskusi dengan AI"
                        >
                          <span>💬 AI</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenChart(item.ticker);
                          }}
                          className="h-7 w-7 border-slate-200 bg-slate-50 p-0 text-slate-600 hover:bg-slate-100"
                          title="Lihat Chart"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 border-slate-200 bg-slate-50 p-0 text-slate-600 hover:bg-slate-100"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row: Sector, Fundamental Metrics, Levels, 3 Pillars & AI Discussion */}
                  {isExpanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={7} className="border-y border-slate-200 p-4">
                        <div className="space-y-4">
                          {/* Top Detail Strip: Sektor, 4 Metrik Fundamental & Trading Plan Levels */}
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs shadow-2xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700"
                              >
                                Sektor: {item.sector}
                              </Badge>
                              {item.profileSuitability === 'BOTH' ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-800"
                                >
                                  ✨ Trading &amp; Investasi
                                </Badge>
                              ) : item.profileSuitability === 'INVESTASI' ? (
                                <Badge
                                  variant="outline"
                                  className="border-indigo-200 bg-indigo-50 text-[11px] font-bold text-indigo-800"
                                >
                                  🏛️ Cocok Investasi
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-sky-200 bg-sky-50 text-[11px] font-bold text-sky-800"
                                >
                                  ⚡ Cocok Trading
                                </Badge>
                              )}
                              <span
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                                title="Kapitalisasi Pasar"
                              >
                                🏢 MC: <strong className="text-slate-900">{item.marketCapFormatted || '-'}</strong>
                              </span>
                              <span
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                                title="Porsi Kepemilikan Publik (Free Float)"
                              >
                                🌐 Float:{' '}
                                <strong className="text-slate-900">
                                  {item.freeFloatPct !== null && item.freeFloatPct !== undefined
                                    ? `${item.freeFloatPct}%`
                                    : 'N/A'}
                                </strong>
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                  item.roePct !== null && item.roePct !== undefined && item.roePct >= 10
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                                title="Return on Equity"
                              >
                                📊 ROE:{' '}
                                <strong className="font-bold">
                                  {item.roePct !== null && item.roePct !== undefined ? `${item.roePct}%` : 'N/A'}
                                </strong>
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                  item.der !== null && item.der !== undefined && item.der <= 1.0
                                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                                title="Debt to Equity Ratio"
                              >
                                ⚖️ DER:{' '}
                                <strong className="font-bold">
                                  {item.der !== null && item.der !== undefined ? `${item.der}x` : 'N/A'}
                                </strong>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                              <span className="text-slate-600">
                                Area Beli: <strong className="text-slate-900">{item.buyArea}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-emerald-800">
                                Target TP: Rp {formatNumber(item.targetPrice || item.resistance)} (+
                                {item.potentialGainPct}%)
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-rose-800">
                                Stop Loss: Rp {formatNumber(item.stopLoss || item.support)} (-{item.potentialRiskPct}%)
                              </span>
                            </div>
                          </div>

                          {/* 3 Pillars & Multi-Turn AI Discussion Component */}
                          <ScreenerAIDiscussion
                            item={item}
                            discussion={
                              discussions[item.ticker] || {
                                isLoading: false,
                                isSending: false,
                                data: null,
                                messages: [],
                                inputQuestion: '',
                                error: null,
                              }
                            }
                            onSendQuestion={onSendQuestion}
                            onClearHistory={onClearHistory}
                            onInputChange={onInputChange}
                            onOpenKamus={onOpenKamus}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
