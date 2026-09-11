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
              {renderSortTh('Sikap Aksi / Rekomendasi', 'strategy')}
              {renderSortTh('Harga Close', 'price')}
              {renderSortTh('Perubahan', 'changePct')}
              {renderSortTh(
                'RSI',
                'rsi',
                'left',
                'Relative Strength Index (0-100). Indikator momentum jenuh jual (<35) atau jenuh beli (>70).',
              )}
              <th className="px-3 py-3.5 font-bold text-slate-600">Area Beli Disarankan</th>
              {renderSortTh('Target TP', 'targetPrice')}
              {renderSortTh('Stop Loss', 'stopLoss')}
              {renderSortTh(
                'Risk:Reward',
                'riskRewardRatio',
                'left',
                'Risk:Reward Ratio (RRR). Perbandingan batas risiko Stop Loss vs potensi keuntungan Take Profit. Standar ideal: minimal 1 : 1.5 s/d 1 : 2.0 ke atas.',
              )}
              {renderSortTh(
                'Skor (1-10)',
                'convictionScore',
                'left',
                'Skor Perhatian (1-10): Tingkat keyakinan beli besok pagi. Skor 10/10 berarti WAJIB DIBELI BESOK PAGI karena setup teknikal prima & RRR prima.',
              )}
              <th className="px-3 py-3.5 text-right font-bold text-slate-600">Detail</th>
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
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] font-bold ${
                          item.strategy === 'OVERSOLD'
                            ? 'border-purple-200 bg-purple-50 text-purple-700'
                            : item.strategy === 'BREAKOUT'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {item.strategy}
                      </Badge>
                    </td>

                    <td className="px-3 py-3.5 font-mono">
                      <div className="text-xs font-bold text-slate-900">Rp {formatNumber(item.price)}</div>
                      <div className="text-[10px] font-medium text-slate-400">
                        Rp {formatNumber(item.price * 100)}/lot
                      </div>
                    </td>

                    <td className="px-3 py-3.5 font-mono font-bold">
                      <span className={item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatPercent(item.changePct)}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 font-mono font-bold">
                      <span
                        className={
                          item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-700'
                        }
                      >
                        {item.rsi}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 font-mono text-[11px] text-slate-700">{item.buyArea}</td>

                    <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-emerald-800">
                      Rp {formatNumber(item.targetPrice || item.resistance)}
                    </td>

                    <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-rose-800">
                      Rp {formatNumber(item.stopLoss || item.support)}
                    </td>

                    <td className="px-3 py-3.5 font-mono">
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-900"
                      >
                        {item.riskRewardRatio}
                      </Badge>
                    </td>

                    <td className="px-3 py-3.5 font-mono">
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

                  {/* Expanded Row: 3 Pillars + Conviction Score (1-10) + AI Discussion */}
                  {isExpanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={11} className="border-y border-slate-200 p-4">
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
