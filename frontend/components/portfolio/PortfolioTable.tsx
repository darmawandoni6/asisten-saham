'use client';

import { Inbox, LineChart, Tag, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

interface PortfolioTableProps {
  holdings: Holding[];
  onOpenChart: (holding: Holding) => void;
  onSellHolding: (holding: Holding) => void;
  onDeleteHolding: (id: number) => void;
}

export function PortfolioTable({ holdings, onOpenChart, onSellHolding, onDeleteHolding }: PortfolioTableProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="px-3 py-3">Ticker</th>
              <th className="px-3 py-3">Jenis</th>
              <th className="px-3 py-3">Sektor</th>
              <th className="px-3 py-3">Avg Beli</th>
              <th className="px-3 py-3">Jumlah Lot</th>
              <th className="px-3 py-3">Modal Beli</th>
              <th className="px-3 py-3">Close EOD</th>
              <th className="px-3 py-3">Floating PnL</th>
              <th className="px-3 py-3">Target (TP)</th>
              <th className="px-3 py-3">Stop Loss</th>
              <th className="px-3 py-3 text-center">Chart</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {holdings.length > 0 ? (
              holdings.map(h => {
                const cost = h.avgPrice * h.shares;
                const isProfit = h.floatingPnl >= 0;

                return (
                  <tr key={h.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-3 py-3.5 font-mono font-bold text-slate-900">{h.ticker}</td>
                    <td className="px-3 py-3.5">
                      {h.jenis === 'investasi' ? (
                        <Badge
                          variant="outline"
                          className="border-indigo-200 bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                        >
                          📈 Investasi
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-100 text-[10px] font-semibold text-amber-700"
                        >
                          ⚡ Trading
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-500">{h.sector || '—'}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-800">Rp {formatNumber(h.avgPrice)}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-700">{formatNumber(h.lot)} Lot</td>
                    <td className="px-3 py-3.5 font-mono text-slate-800">{formatRupiah(cost)}</td>
                    <td className="px-3 py-3.5 font-mono font-bold text-slate-900">
                      Rp {formatNumber(h.currentPrice)}
                    </td>
                    <td className="px-3 py-3.5 font-mono font-bold">
                      <div className={isProfit ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatPercent(h.floatingPnlPct)}
                      </div>
                      <div className={`text-[10px] ${isProfit ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {formatRupiah(h.floatingPnl)}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-mono font-bold text-emerald-700">
                      Rp {formatNumber(h.targetPrice)}
                    </td>
                    <td className="px-3 py-3.5 font-mono font-bold">
                      {h.stopLoss ? (
                        <span className="text-rose-600">Rp {formatNumber(h.stopLoss)}</span>
                      ) : (
                        <span className="text-[10px] font-medium text-indigo-500">
                          No Hard SL
                          <br />
                          <span className="text-slate-400">Avg Down</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChart(h)}
                        className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-200"
                        title="Buka Chart"
                      >
                        <LineChart className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSellHolding(h)}
                          className="h-7 gap-1 border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          title="Jual saham / Take Profit / Cut Loss"
                        >
                          <Tag className="h-3 w-3" />
                          <span>Jual</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteHolding(h.id)}
                          className="h-7 w-7 border-slate-200 bg-slate-50 p-0 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus manual dari pencatatan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">Belum Ada Saham di Portofolio</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Klik tombol &quot;Tambah Saham Baru&quot; di atas untuk mencatat trading plan pertama Anda.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
