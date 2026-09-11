'use client';

import { useCallback, useEffect, useState } from 'react';

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
import { api } from '@/lib/api';
import { Holding, PortfolioSummary } from '@/types';

const INITIAL_SUMMARY: PortfolioSummary = {
  totalEquity: 0,
  totalCost: 0,
  floatingPnl: 0,
  floatingPnlPct: 0.0,
  cashBalance: 0,
  totalLots: 0,
  actionCounts: {
    sellCutLoss: 0,
    takeProfit: 0,
    holdMonitor: 0,
    trailingStopWarning: 0,
    recoveryMode: 0,
  },
};

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>(INITIAL_SUMMARY);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [activeModal, setActiveModal] = useState<'chart' | 'ai' | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      if (data) {
        setHoldings(data.holdings || []);
        setSummary(data.summary || INITIAL_SUMMARY);
      }
    } catch (err) {
      console.warn('Backend API offline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getDashboard()
      .then(data => {
        if (isMounted && data) {
          setHoldings(data.holdings || []);
          setSummary(data.summary || INITIAL_SUMMARY);
        }
      })
      .catch(err => {
        console.warn('Backend API offline:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 pb-16">
      <Topbar
        title="Smart Decision Dashboard (EOD Analysis)"
        subtitle="Rekomendasi objektif Hold / Sell / Buy berdasarkan data closing 17:30 WIB"
        onRefresh={loadDashboard}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Summary Metrics */}
        <PortfolioSummaryCards summary={summary} onEditCashBalance={() => setIsBalanceModalOpen(true)} />

        {/* 1. Core Feature: Smart Action Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">Smart Action Cards</h2>
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                  {holdings.length} Saham Terpantau
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kartu ringkasan status harian dengan 5 indikator warna tegas (Cut Loss, Take Profit, Hold, Trailing
                Stop, Recovery)
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(idx => (
                <Card key={idx} className="p-5 animate-pulse border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="py-6 space-y-3">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-8 w-48 bg-slate-200 rounded" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <div className="h-8 flex-1 bg-slate-200 rounded-lg" />
                    <div className="h-8 flex-1 bg-slate-200 rounded-lg" />
                  </div>
                </Card>
              ))}
            </div>
          ) : holdings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <Card className="border-slate-200 bg-white p-10 text-center shadow-2xs flex flex-col items-center justify-center">
              <CardHeader className="p-0 pb-3 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 normal-case tracking-normal">
                  Belum Ada Saham di Portofolio
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 max-w-sm">
                  Mulai masukkan trading plan pertama Anda (Ticker, Avg Price Beli, Lot, Target Price, dan Stop Loss)
                  untuk memantau status aksi harian.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <Button asChild variant="emerald" size="sm" className="gap-2 rounded-xl">
                  <Link href="/portfolio">
                    <PlusCircle className="w-4 h-4" />
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
        <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none [&>button]:hidden">
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
