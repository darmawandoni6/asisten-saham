'use client';

import { useMemo, useState } from 'react';

import { AlertTriangle, ArrowUpDown, ChevronDown, Inbox, LineChart, Pencil, Plus, Tag, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

type SortField = 'ticker' | 'cost' | 'price' | 'pnlPct';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'trading' | 'investasi';

interface PortfolioTableProps {
  holdings: Holding[];
  onOpenChart: (holding: Holding) => void;
  onBuyMore?: (holding: Holding) => void;
  onEditHolding: (holding: Holding) => void;
  onSellHolding: (holding: Holding) => void;
  onDeleteHolding: (id: number) => Promise<void>;
}

export function PortfolioTable({
  holdings,
  onOpenChart,
  onBuyMore,
  onEditHolding,
  onSellHolding,
  onDeleteHolding,
}: PortfolioTableProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deletingHolding, setDeletingHolding] = useState<Holding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Counts for tabs
  const countAll = holdings.length;
  const countTrading = holdings.filter(h => h.jenis === 'trading').length;
  const countInvestasi = holdings.filter(h => h.jenis === 'investasi').length;

  // Filtered & Sorted Holdings
  const processedHoldings = useMemo(() => {
    let result = [...holdings];

    if (filterType !== 'all') {
      result = result.filter(h => (h.jenis || 'trading') === filterType);
    }

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'ticker':
          return sortOrder === 'asc' ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
        case 'cost':
          valA = a.avgPrice * a.shares;
          valB = b.avgPrice * b.shares;
          break;
        case 'price':
          valA = a.currentPrice || a.avgPrice;
          valB = b.currentPrice || b.avgPrice;
          break;
        case 'pnlPct':
          valA = a.floatingPnlPct;
          valB = b.floatingPnlPct;
          break;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [holdings, filterType, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const confirmDelete = async () => {
    if (!deletingHolding) return;
    setIsDeleting(true);
    try {
      await onDeleteHolding(deletingHolding.id);
      setDeletingHolding(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-2xs">
      {/* Table Toolbar / Filter Tabs */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({countAll})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('trading')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'trading' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>⚡ Trading ({countTrading})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('investasi')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'investasi' ? 'bg-white text-indigo-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📈 Investasi ({countInvestasi})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Menampilkan <span className="font-semibold text-slate-700">{processedHoldings.length}</span> dari {countAll}{' '}
          saham
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th
                className="cursor-pointer px-3 py-3 select-none hover:text-slate-900"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center gap-1">
                  <span>Ticker</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-3">Jenis</th>
              <th className="px-3 py-3">Sektor</th>
              <th className="px-3 py-3">Avg Beli</th>
              <th className="px-3 py-3">Lot</th>
              <th
                className="cursor-pointer px-3 py-3 select-none hover:text-slate-900"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center gap-1">
                  <span>Modal Beli</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-3 select-none hover:text-slate-900"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1">
                  <span>Close EOD</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="cursor-pointer px-3 py-3 select-none hover:text-slate-900"
                onClick={() => handleSort('pnlPct')}
              >
                <div className="flex items-center gap-1">
                  <span>Floating PnL</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-3">Target Plan</th>
              <th className="px-3 py-3">Stop Loss</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {processedHoldings.length > 0 ? (
              processedHoldings.map(h => {
                const cost = h.avgPrice * h.shares;
                const isProfit = h.floatingPnl >= 0;
                const isExitRebound =
                  h.targetPrice && h.avgPrice && h.targetPrice < h.avgPrice && h.jenis !== 'investasi';

                return (
                  <tr key={h.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-3 py-3.5">
                      <div className="font-mono font-bold text-slate-900">{h.ticker}</div>
                      <div className="max-w-30 truncate text-[10px] text-slate-400" title={h.name}>
                        {h.name}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {h.jenis === 'investasi' ? (
                        <Badge
                          variant="outline"
                          className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                        >
                          Investasi
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700"
                        >
                          Trading
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">{h.sector || '—'}</td>
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
                    <td className="px-3 py-3.5 font-mono font-bold">
                      {isExitRebound ? (
                        <div title="Target Exit Rebound: Resisten terdekat berada di bawah harga modal untuk meminimalkan kerugian saat rebound.">
                          <span className="text-amber-700">Rp {formatNumber(h.targetPrice)}</span>
                          <span className="block text-[10px] font-semibold text-amber-600">⚡ Exit Rebound</span>
                        </div>
                      ) : (
                        <div title="Target Take Profit">
                          <span className="text-emerald-700">Rp {formatNumber(h.targetPrice)}</span>
                          <span className="block text-[10px] font-normal text-slate-400">
                            {h.jenis === 'investasi' ? 'Target Puncak' : '🎯 TP'}
                          </span>
                        </div>
                      )}
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
                    <td className="px-3 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                          <span>Aksi</span>
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Aksi ({h.ticker})</DropdownMenuLabel>

                          <DropdownMenuItem onClick={() => onBuyMore?.(h)}>
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Beli Lagi (Averaging)</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onSellHolding(h)}>
                            <Tag className="h-3.5 w-3.5 text-amber-600" />
                            <span>Jual / Pangkas Lot</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onOpenChart(h)}>
                            <LineChart className="h-3.5 w-3.5 text-blue-600" />
                            <span>Buka Chart Candlestick</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onEditHolding(h)}>
                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                            <span>Edit Trading Plan</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem destructive onClick={() => setDeletingHolding(h)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus dari Portofolio</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">
                    {filterType === 'all'
                      ? 'Belum Ada Saham di Portofolio'
                      : `Tidak ada saham dengan kategori ${filterType}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Gunakan tombol &quot;Tambah Saham Baru&quot; di atas untuk memasukkan trading plan.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingHolding} onOpenChange={open => !open && setDeletingHolding(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader className="p-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Hapus {deletingHolding?.ticker} dari Portofolio?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Saham ini akan dihapus dari pencatatan aktif portofolio Anda. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingHolding(null)}
              className="rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="rounded-lg text-xs font-semibold"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Saham'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
