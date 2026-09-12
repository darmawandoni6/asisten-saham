'use client';

import { useState } from 'react';

import { CandlestickChart } from '@/components/CandlestickChart';
import { EditBalanceModal } from '@/components/EditBalanceModal';
import { SellHoldingModal } from '@/components/SellHoldingModal';
import { Topbar } from '@/components/Topbar';
import { AddHoldingModal } from '@/components/portfolio/AddHoldingModal';
import { EditHoldingModal } from '@/components/portfolio/EditHoldingModal';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioMetricsBar } from '@/components/portfolio/PortfolioMetricsBar';
import { PortfolioTable } from '@/components/portfolio/PortfolioTable';
import { ScaleOutMatrixCard } from '@/components/portfolio/ScaleOutMatrixCard';
import { SectorAllocationCard } from '@/components/portfolio/SectorAllocationCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Holding } from '@/types';

export default function PortfolioPage() {
  const {
    holdings,
    cashBalance,
    loadPortfolio,
    addHolding,
    updateHolding,
    deleteHolding,
    setCashBalance,
    totalCost,
    totalMarketValue,
    totalFloatingPnl,
    totalFloatingPnlPct,
    sectorMap,
  } = usePortfolio();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buyMoreTicker, setBuyMoreTicker] = useState<string>('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [chartStock, setChartStock] = useState<Holding | null>(null);

  const handleOpenAddHolding = () => {
    setBuyMoreTicker('');
    setIsModalOpen(true);
  };

  const handleOpenBuyMore = (holding: Holding) => {
    setBuyMoreTicker(holding.ticker);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holding: Holding) => {
    setEditingHolding(holding);
    setIsEditModalOpen(true);
  };

  const handleOpenSellModal = (holding: Holding) => {
    setSellingHolding(holding);
    setIsSellModalOpen(true);
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Portofolio & Trading Plan Management"
        subtitle="Kelola kepemilikan, target profit, stop loss dinamis, dan alokasi risiko"
        onRefresh={loadPortfolio}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* 1. Portfolio KPI Summary Metrics Bar */}
        <PortfolioMetricsBar
          totalCost={totalCost}
          totalMarketValue={totalMarketValue}
          totalFloatingPnl={totalFloatingPnl}
          totalFloatingPnlPct={totalFloatingPnlPct}
          cashBalance={cashBalance}
          totalHoldings={holdings.length}
          onEditCashBalance={() => setIsBalanceModalOpen(true)}
        />

        {/* 2. Header Actions */}
        <div className="space-y-4">
          <PortfolioHeader totalHoldings={holdings.length} onOpenAddHolding={handleOpenAddHolding} />

          {/* 3. Portfolio Table with Filters & Sorting */}
          <PortfolioTable
            holdings={holdings}
            onOpenChart={setChartStock}
            onBuyMore={handleOpenBuyMore}
            onEditHolding={handleOpenEditModal}
            onSellHolding={handleOpenSellModal}
            onDeleteHolding={deleteHolding}
          />
        </div>

        {/* 4. Money Management & Selling Engine */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SectorAllocationCard sectorMap={sectorMap} totalCost={totalCost} hasHoldings={holdings.length > 0} />
          <ScaleOutMatrixCard holdings={holdings} />
        </div>
      </div>

      {/* Modal Add Holding Form */}
      <AddHoldingModal
        isOpen={isModalOpen}
        holdings={holdings}
        initialTicker={buyMoreTicker}
        onClose={() => {
          setIsModalOpen(false);
          setBuyMoreTicker('');
        }}
        onAddHolding={addHolding}
      />

      {/* Modal Edit Holding Form */}
      <EditHoldingModal
        isOpen={isEditModalOpen}
        holding={editingHolding}
        onClose={() => {
          setIsEditModalOpen(false);
        }}
        onUpdateHolding={updateHolding}
      />

      {/* Modal / Dialog for Candlestick Chart (shadcn/ui Dialog) */}
      <Dialog open={!!chartStock} onOpenChange={open => !open && setChartStock(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Grafik Candlestick {chartStock?.ticker}</DialogTitle>
            <DialogDescription>Grafik teknikal candlestick harian untuk saham {chartStock?.ticker}</DialogDescription>
          </DialogHeader>
          {chartStock && (
            <CandlestickChart
              ticker={chartStock.ticker}
              candles={[]}
              holding={chartStock}
              onClose={() => setChartStock(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Edit Cash Balance */}
      <EditBalanceModal
        isOpen={isBalanceModalOpen}
        currentBalance={cashBalance}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={newBalance => {
          setCashBalance(newBalance);
          loadPortfolio();
        }}
      />

      {/* Modal Sell Holding */}
      <SellHoldingModal
        isOpen={isSellModalOpen}
        holding={sellingHolding}
        onClose={() => {
          setIsSellModalOpen(false);
        }}
        onSuccess={() => {
          loadPortfolio();
        }}
      />
    </main>
  );
}
