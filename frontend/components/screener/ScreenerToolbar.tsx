'use client';

import {
  ArrowUpDown,
  HelpCircle,
  LayoutGrid,
  List,
  Loader2,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScreenerSortDirection, ScreenerSortField, ScreenerStrategyTab } from '@/hooks/useScreener';
import { formatNumber } from '@/lib/utils';

interface ScreenerToolbarProps {
  activeTab: ScreenerStrategyTab;
  setActiveTab: (tab: ScreenerStrategyTab) => void;
  totalItemsCount: number;
  filteredItemsCount: number;
  isScanning: boolean;
  handleRunScan: () => void;
  setIsKamusOpen: (open: boolean) => void;
  maxPriceFilter: number | null;
  setMaxPriceFilter: (price: number | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortField: ScreenerSortField;
  sortDirection: ScreenerSortDirection;
  setSortField: (f: ScreenerSortField) => void;
  setSortDirection: (d: ScreenerSortDirection) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
}

export function ScreenerToolbar({
  activeTab,
  setActiveTab,
  totalItemsCount,
  filteredItemsCount,
  isScanning,
  handleRunScan,
  setIsKamusOpen,
  maxPriceFilter,
  setMaxPriceFilter,
  searchQuery,
  setSearchQuery,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
  viewMode,
  setViewMode,
}: ScreenerToolbarProps) {
  return (
    <div className="space-y-3.5">
      {/* Top Row: Category Tabs & Primary Action Buttons */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Strategy Tabs */}
        <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            type="button"
            variant={activeTab === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('ALL')}
            className={`rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs ${
              activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Semua Rekomendasi ({totalItemsCount})
          </Button>

          <Button
            type="button"
            variant={activeTab === 'OVERSOLD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('OVERSOLD')}
            className={`gap-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs ${
              activeTab === 'OVERSOLD'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Oversold Rebound</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === 'BREAKOUT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('BREAKOUT')}
            className={`gap-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs ${
              activeTab === 'BREAKOUT'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Breakout MA20</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === 'VALUE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('VALUE')}
            className={`gap-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs ${
              activeTab === 'VALUE'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Value Stocks</span>
          </Button>
        </div>

        {/* Action Buttons: Kamus & Scan EOD */}
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsKamusOpen(true)}
            className="gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
            <span>Kamus Badge</span>
          </Button>

          <Button
            type="button"
            variant="emerald"
            size="sm"
            onClick={handleRunScan}
            disabled={isScanning}
            className="gap-1.5 rounded-xl text-xs font-bold shadow-2xs"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                <span>Scan EOD (Top 10)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Budget / Price Filter Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Batas Harga:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant={maxPriceFilter === 2000 ? 'emerald' : 'secondary'}
              size="sm"
              onClick={() => setMaxPriceFilter(2000)}
              className="h-7 rounded-xl px-3 text-xs font-bold shadow-2xs"
            >
              ≤ Rp 2.000 (≤ 200rb/lot)
            </Button>
            <Button
              type="button"
              variant={maxPriceFilter === 1000 ? 'emerald' : 'secondary'}
              size="sm"
              onClick={() => setMaxPriceFilter(1000)}
              className="h-7 rounded-xl px-3 text-xs font-bold shadow-2xs"
            >
              ≤ Rp 1.000 (≤ 100rb/lot)
            </Button>
            <Button
              type="button"
              variant={maxPriceFilter === 500 ? 'emerald' : 'secondary'}
              size="sm"
              onClick={() => setMaxPriceFilter(500)}
              className="h-7 rounded-xl px-3 text-xs font-bold shadow-2xs"
            >
              ≤ Rp 500 (≤ 50rb/lot)
            </Button>
            <Button
              type="button"
              variant={maxPriceFilter === null ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setMaxPriceFilter(null)}
              className="h-7 rounded-xl px-3 text-xs font-bold shadow-2xs"
            >
              Semua Harga
            </Button>
          </div>
        </div>

        <div className="hidden text-xs font-medium text-slate-500 sm:block">
          {maxPriceFilter !== null ? (
            <span>
              Menampilkan saham terjangkau{' '}
              <strong className="font-mono text-emerald-700">≤ Rp {formatNumber(maxPriceFilter)}</strong> (≤ Rp{' '}
              {formatNumber(maxPriceFilter * 100)}/lot)
            </span>
          ) : (
            <span>Menampilkan seluruh rentang harga saham</span>
          )}
        </div>
      </Card>

      {/* Bottom Row: Search Box, Quick Sort Dropdown, and View Mode Toggle */}
      <Card className="flex flex-col justify-between gap-3 rounded-2xl border-slate-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center">
        {/* Search & Sort Group */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari ticker atau nama emiten..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="hidden text-xs font-medium text-slate-400 md:inline">Urutkan:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={e => {
                const [f, d] = e.target.value.split('-') as [ScreenerSortField, ScreenerSortDirection];
                setSortField(f);
                setSortDirection(d);
              }}
              className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-800 focus:outline-none"
              title="Pilih Urutan Saham"
            >
              <option value="convictionScore-desc">Skor (10/10 Teratas)</option>
              <option value="convictionScore-asc">Skor (Terendah)</option>
              <option value="changePct-desc">Perubahan (+ Tertinggi)</option>
              <option value="changePct-asc">Perubahan (- Terendah)</option>
              <option value="price-desc">Harga (Tertinggi)</option>
              <option value="price-asc">Harga (Terendah)</option>
              <option value="rsi-asc">RSI (Paling Oversold)</option>
              <option value="rsi-desc">RSI (Paling Overbought)</option>
              <option value="ticker-asc">Ticker (A – Z)</option>
              <option value="ticker-desc">Ticker (Z – A)</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Count */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
          <span className="text-xs font-medium text-slate-400">
            Menampilkan <strong className="text-slate-700">{filteredItemsCount}</strong> saham
          </span>

          <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <Button
              type="button"
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`h-7 rounded-lg px-3 text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs hover:bg-white hover:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Analisis Terbuka"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Mode Kartu</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={`h-7 rounded-lg px-3 text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs hover:bg-white hover:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Ringkas"
            >
              <List className="h-3.5 w-3.5" />
              <span>Mode Tabel</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
