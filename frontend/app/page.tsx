'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { PlusCircle, TrendingUp } from 'lucide-react';

import { AICopilotPanel } from '@/components/AICopilotPanel';
import { ActionCard } from '@/components/ActionCard';
import { CandlestickChart } from '@/components/CandlestickChart';
import { DailyActionSheet } from '@/components/DailyActionSheet';
import { EditBalanceModal } from '@/components/EditBalanceModal';
import { PortfolioSummaryCards } from '@/components/PortfolioSummaryCards';
import { Topbar } from '@/components/Topbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDashboard } from '@/hooks/useDashboard';
import { Holding } from '@/types';

export default function DashboardPage() {
  const { holdings, summary, isLoading, loadDashboard, setSummary } = useDashboard();

  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [activeModal, setActiveModal] = useState<'chart' | 'ai' | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleOpenChart = (holding: Holding) => {
    setSelectedHolding(holding);
    setActiveModal('chart');
  };

  const handleOpenAI = (holding: Holding) => {
    setSelectedHolding(holding);
    setActiveModal('ai');
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Smart Decision Dashboard (EOD Analysis)"
        subtitle="Rekomendasi objektif Hold / Sell / Buy berdasarkan data closing 17:30 WIB"
        onRefresh={loadDashboard}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* Top Summary Metrics */}
        <PortfolioSummaryCards summary={summary} onEditCashBalance={() => setIsBalanceModalOpen(true)} />

        {/* 1. Core Feature: Smart Action Cards */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">Smart Action Cards</h2>
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                  {holdings.length} Saham Terpantau
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Kartu ringkasan status harian dengan 5 indikator warna tegas (Cut Loss, Take Profit, Hold, Trailing
                Stop, Recovery)
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(idx => (
                <Card key={idx} className="animate-pulse border-slate-200 p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="h-6 w-24 rounded bg-slate-200" />
                    <div className="h-5 w-20 rounded bg-slate-200" />
                  </div>
                  <div className="space-y-3 py-6">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-8 w-48 rounded bg-slate-200" />
                  </div>
                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <div className="h-8 flex-1 rounded-lg bg-slate-200" />
                    <div className="h-8 flex-1 rounded-lg bg-slate-200" />
                  </div>
                </Card>
              ))}
            </div>
          ) : holdings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {holdings.map(holding => (
                <ActionCard
                  key={holding.id}
                  holding={holding}
                  onSelectStock={handleOpenChart}
                  onOpenAI={handleOpenAI}
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center border-slate-200 bg-white p-10 text-center shadow-2xs">
              <CardHeader className="flex flex-col items-center p-0 pb-3">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-sm font-bold tracking-normal text-slate-900 normal-case">
                  Belum Ada Saham di Portofolio
                </CardTitle>
                <CardDescription className="max-w-sm text-xs text-slate-500">
                  Mulai masukkan trading plan pertama Anda (Ticker, Avg Price Beli, Lot, Target Price, dan Stop Loss)
                  untuk memantau status aksi harian.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <Button asChild variant="emerald" size="sm" className="gap-2 rounded-xl">
                  <Link href="/portfolio">
                    <PlusCircle className="h-4 w-4" />
                    <span>Tambah Saham Pertama</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 2. Daily Action Sheet */}
        {holdings.length > 0 && (
          <div>
            <DailyActionSheet holdings={holdings} onOpenStock={handleOpenAI} />
          </div>
        )}
      </div>

      {/* Modal / Dialog for Candlestick Chart (shadcn/ui Dialog) */}
      <Dialog open={activeModal === 'chart' && !!selectedHolding} onOpenChange={open => !open && closeModal()}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Grafik Candlestick {selectedHolding?.ticker}</DialogTitle>
            <DialogDescription>
              Grafik teknikal candlestick harian untuk saham {selectedHolding?.ticker}
            </DialogDescription>
          </DialogHeader>
          {selectedHolding && (
            <CandlestickChart
              ticker={selectedHolding.ticker}
              candles={[]}
              holding={selectedHolding}
              onClose={closeModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal / Dialog for AI Copilot (shadcn/ui Dialog) */}
      {selectedHolding && (
        <AICopilotPanel isOpen={activeModal === 'ai'} holding={selectedHolding} onClose={closeModal} />
      )}

      {/* Modal Edit Cash Balance */}
      <EditBalanceModal
        isOpen={isBalanceModalOpen}
        currentBalance={summary.cashBalance || 0}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={newBalance => {
          setSummary(prev => ({
            ...prev,
            cashBalance: newBalance,
          }));
          loadDashboard();
        }}
      />
    </div>
  );
}
