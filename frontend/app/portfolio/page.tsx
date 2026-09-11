'use client';

import { useState } from 'react';

import { CandlestickChart } from '@/components/CandlestickChart';
import { EditBalanceModal } from '@/components/EditBalanceModal';
import { SellHoldingModal } from '@/components/SellHoldingModal';
import { Topbar } from '@/components/Topbar';
import { AddHoldingModal } from '@/components/portfolio/AddHoldingModal';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioTable } from '@/components/portfolio/PortfolioTable';
import { ScaleOutMatrixCard } from '@/components/portfolio/ScaleOutMatrixCard';
import { SectorAllocationCard } from '@/components/portfolio/SectorAllocationCard';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Holding } from '@/types';

export default function PortfolioPage() {
  const { holdings, cashBalance, loadPortfolio, addHolding, deleteHolding, setCashBalance, totalCost, sectorMap } =
    usePortfolio();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [chartStock, setChartStock] = useState<Holding | null>(null);

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
        {/* Header Actions */}
        <PortfolioHeader
          cashBalance={cashBalance}
          onOpenEditBalance={() => setIsBalanceModalOpen(true)}
          onOpenAddHolding={() => setIsModalOpen(true)}
        />

        {/* Portfolio Table */}
        <PortfolioTable
          holdings={holdings}
          onOpenChart={setChartStock}
          onSellHolding={handleOpenSellModal}
          onDeleteHolding={deleteHolding}
        />

        {/* Money Management & Pyramiding Matrix */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SectorAllocationCard sectorMap={sectorMap} totalCost={totalCost} hasHoldings={holdings.length > 0} />
          <ScaleOutMatrixCard />
        </div>
      </div>

      {/* Modal Add Holding Form */}
      <AddHoldingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddHolding={addHolding} />

      {/* Modal Chart */}
      {chartStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl">
            <CandlestickChart
              ticker={chartStock.ticker}
              candles={[]}
              holding={chartStock}
              onClose={() => setChartStock(null)}
            />
          </div>
        </div>
      )}

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
          setSellingHolding(null);
        }}
        onSuccess={() => {
          loadPortfolio();
        }}
      />
    </main>
  );
}
